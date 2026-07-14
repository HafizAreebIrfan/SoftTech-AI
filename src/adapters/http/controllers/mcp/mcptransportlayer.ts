import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createCompanyMcpServer } from "../../../../infrastructure/mcp/server/companymcpserver";
import { CompanyModel } from "../../../persistence/models/companies/register/companyinfo";

type McpSession = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  lastSeenAt: number;
};

const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const mcpSessions = new Map<string, McpSession>();

/**
 * Main MCP HTTP entrypoint.
 * Routes initialize requests into a new session and all later requests into an existing one.
 */
export const McpTransportLayer = async (req: Request, res: Response) => {
  try {
    if (isInitializeRequest(req)) {
      await handleInitializeRequest(req, res);
      return;
    }

    const sessionId = getSessionIdFromHeader(req);

    if (!sessionId) {
      sendSessionNotFound(res);
      return;
    }

    await handleExistingSessionRequest(req, res, sessionId);
  } catch (error) {
    logMcpError(req, error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "MCP transport request failed",
      });
    }
  }
};

/**
 * Handles the very first initialize call by creating a fresh weather server and transport pair.
 */
const handleInitializeRequest = async (req: Request, res: Response) => {
  const server = await createServerForRequest(req);
  let initializedSessionId: string | undefined;

  const transport = buildTransport(server, (sessionId) => {
    initializedSessionId = sessionId;
    mcpSessions.set(sessionId, {
      server,
      transport,
      lastSeenAt: Date.now(),
    });
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  if (initializedSessionId) {
    touchSession(initializedSessionId);
    return;
  }

  await Promise.allSettled([server.close(), transport.close()]);
};

/**
 * Handles all MCP requests after initialize by looking up the existing session transport.
 */
const handleExistingSessionRequest = async (
  req: Request,
  res: Response,
  sessionId: string,
) => {
  const session = mcpSessions.get(sessionId);

  if (!session) {
    sendSessionNotFound(res);
    return;
  }

  touchSession(sessionId);
  await session.transport.handleRequest(req, res, req.body);
};

/**
 * Creates one transport instance for one MCP session.
 * The transport notifies us when the SDK creates or closes a session id.
 */
const buildTransport = (
  server: McpServer,
  onSessionInitialized: (sessionId: string) => void,
) =>
  new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: onSessionInitialized,
    onsessionclosed: (sessionId) => closeSession(sessionId),
  });

/**
 * Reads the MCP session id header from the incoming request.
 */
const getSessionIdFromHeader = (req: Request) => {
  const sessionId = req.headers["mcp-session-id"];

  if (Array.isArray(sessionId)) {
    return sessionId[0];
  }

  return sessionId;
};

/**
 * Detects whether the request is the first initialize call for a new MCP session.
 */
const isInitializeRequest = (req: Request) =>
  req.method === "POST" && req.body?.method === "initialize";

/**
 * Refreshes the last-seen time so active sessions do not get swept as expired.
 */
const touchSession = (sessionId: string) => {
  const session = mcpSessions.get(sessionId);

  if (!session) {
    return;
  }

  session.lastSeenAt = Date.now();
};

/**
 * Closes and removes one stored session.
 * This runs when the client explicitly closes the session or when the sweeper expires it.
 */
const closeSession = async (sessionId: string) => {
  const session = mcpSessions.get(sessionId);

  if (!session) {
    return;
  }

  mcpSessions.delete(sessionId);

  await Promise.allSettled([session.server.close(), session.transport.close()]);
};

/**
 * Finds sessions that have been idle longer than the configured TTL and closes them.
 */
const sweepExpiredSessions = async () => {
  const now = Date.now();
  const expiredSessionIds = [...mcpSessions.entries()]
    .filter(([, session]) => now - session.lastSeenAt > SESSION_TTL_MS)
    .map(([sessionId]) => sessionId);

  await Promise.all(expiredSessionIds.map(closeSession));
};

/**
 * Returns a JSON-RPC-style 404 when a client references a missing or expired session.
 */
const sendSessionNotFound = (res: Response) => {
  res.status(404).json({
    jsonrpc: "2.0",
    error: {
      code: -32001,
      message: "Session not found",
    },
    id: null,
  });
};

/**
 * Writes detailed MCP request context into the server logs when something throws.
 */
const logMcpError = (req: Request, error: unknown) => {
  console.error("MCP transport request failed:", {
    method: req.method,
    path: req.path,
    accept: req.headers.accept,
    sessionId: getSessionIdFromHeader(req),
    requestBody: req.body,
    error,
  });
};

const createServerForRequest = async (req: Request) => {
  const mcpSlug = normalizeMcpSlug(req.params.mcpSlug);

  if (!mcpSlug) {
    throw new Error("MCP slug is required");
  }

  const company = await CompanyModel.findOne({ mcpSlug }).lean();

  if (company) {
    return createCompanyMcpServer(company as any);
  }

  throw new Error(`No MCP app registered for slug "${mcpSlug}"`);
};

const normalizeMcpSlug = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

/**
 * Background cleanup timer.
 * Every few minutes it checks for idle sessions and removes the expired ones.
 */
const sweepInterval = setInterval(() => {
  void sweepExpiredSessions();
}, SESSION_SWEEP_INTERVAL_MS);

sweepInterval.unref();
