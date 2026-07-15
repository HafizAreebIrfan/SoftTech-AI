"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpTransportLayer = void 0;
const crypto_1 = require("crypto");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const companymcpserver_1 = require("../../../../infrastructure/mcp/server/companymcpserver");
const companyinfo_1 = require("../../../persistence/models/companies/register/companyinfo");
const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const mcpSessions = new Map();
/**
 * Main MCP HTTP entrypoint.
 * Routes initialize requests into a new session and all later requests into an existing one.
 */
const McpTransportLayer = async (req, res) => {
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
    }
    catch (error) {
        logMcpError(req, error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "MCP transport request failed",
            });
        }
    }
};
exports.McpTransportLayer = McpTransportLayer;
/**
 * Handles the very first initialize call by creating a fresh weather server and transport pair.
 */
const handleInitializeRequest = async (req, res) => {
    const server = await createServerForRequest(req);
    let initializedSessionId;
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
const handleExistingSessionRequest = async (req, res, sessionId) => {
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
const buildTransport = (server, onSessionInitialized) => new streamableHttp_js_1.StreamableHTTPServerTransport({
    sessionIdGenerator: () => (0, crypto_1.randomUUID)(),
    onsessioninitialized: onSessionInitialized,
    onsessionclosed: (sessionId) => closeSession(sessionId),
});
/**
 * Reads the MCP session id header from the incoming request.
 */
const getSessionIdFromHeader = (req) => {
    const sessionId = req.headers["mcp-session-id"];
    if (Array.isArray(sessionId)) {
        return sessionId[0];
    }
    return sessionId;
};
/**
 * Detects whether the request is the first initialize call for a new MCP session.
 */
const isInitializeRequest = (req) => req.method === "POST" && req.body?.method === "initialize";
/**
 * Refreshes the last-seen time so active sessions do not get swept as expired.
 */
const touchSession = (sessionId) => {
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
const closeSession = async (sessionId) => {
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
const sendSessionNotFound = (res) => {
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
const logMcpError = (req, error) => {
    console.error("MCP transport request failed:", {
        method: req.method,
        path: req.path,
        accept: req.headers.accept,
        sessionId: getSessionIdFromHeader(req),
        requestBody: req.body,
        error,
    });
};
const createServerForRequest = async (req) => {
    const mcpSlug = normalizeMcpSlug(req.params.mcpSlug);
    if (!mcpSlug) {
        throw new Error("MCP slug is required");
    }
    const company = await companyinfo_1.CompanyModel.findOne({ mcpSlug }).lean();
    if (company) {
        return (0, companymcpserver_1.createCompanyMcpServer)(company);
    }
    throw new Error(`No MCP app registered for slug "${mcpSlug}"`);
};
const normalizeMcpSlug = (value) => {
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
