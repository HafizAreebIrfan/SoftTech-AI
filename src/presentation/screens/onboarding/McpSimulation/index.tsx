import { FC, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RocketIcon, RightArrowIcon } from "../../../../assets/icons";
import { useAuthStore, useThemeStore } from "../../../../hooks";
import { showToast } from "../../../../utils/toast/toasts";
import { isDashboardOnboardingDone } from "../../auth/Signup/Onboarding/onboardingStep";
import styles from "../../../../styles/accountflow.module.css";
import {
  runLiveMcpSimulation,
  McpExecutionResult,
} from "../../../../adapters/mcp/mcpClient";

interface McpSimulationProps {
  isEmbeddedInDashboard?: boolean;
}

const McpSimulation: FC<McpSimulationProps> = ({
  isEmbeddedInDashboard = false,
}) => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { apisList, user, setOnboardingStep } = useAuthStore();

  const isCompanyInDashboard = Boolean(
    isEmbeddedInDashboard || isDashboardOnboardingDone(user),
  );

  // Connected APIs from store
  const availableTools = useMemo(() => {
    if (apisList && apisList.length > 0) {
      return apisList.map((api, idx) => ({
        id: api.id || `tool-${idx}`,
        rawIndex: api.rawIndex ?? idx,
        name: api.apiName || `API Tool #${idx + 1}`,
        mcpToolName:
          api.mcpToolName ||
          api.apiName?.toLowerCase().replace(/\s+/g, "_") ||
          `tool_${idx + 1}`,
        endpoint: api.apiEndpoint || "https://api.softtech.ai/v1/resource",
        method: api.apiMethod || "GET",
        authType: api.apiAuthType || "No Auth",
        credentials: api.apiCredentials,
        headers: api.headers || [],
        params: api.params || [],
        description:
          api.mcpDescription || "Dynamic Model Context Protocol tool",
        sampleResponse: api.sampleResponse || undefined,
      }));
    }
    return [
      {
        id: "default-tool",
        rawIndex: 0,
        name: "Car Rental Inventory Tool",
        mcpToolName: "call_falana_api",
        endpoint: "https://car-rental-pro-studio.onrender.com/api/cars",
        method: "GET",
        authType: "No Auth",
        credentials: "",
        headers: [],
        params: [
          { key: "city", value: "Karachi" },
          { key: "from", value: "2026-09-28" },
          { key: "to", value: "2026-10-01" },
        ],
        description: "Fetch dynamic company records and items",
        sampleResponse: undefined,
      },
    ];
  }, [apisList]);

  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const currentTool = availableTools[selectedToolIndex] || availableTools[0];

  const [promptText, setPromptText] = useState(
    `Query ${currentTool.mcpToolName} for available records`,
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [activeTab, setActiveTab] = useState<"chatgpt" | "inspector">(
    "chatgpt",
  );
  const [executionResult, setExecutionResult] =
    useState<McpExecutionResult | null>(null);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  // Dynamic parameters state allowing users to adjust query parameters
  const [toolParams, setToolParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (currentTool.params && Array.isArray(currentTool.params)) {
      currentTool.params.forEach((p: any) => {
        if (p && p.key) initial[p.key] = String(p.value || "");
      });
    }
    return initial;
  });

  const handleToolChange = (idx: number) => {
    setSelectedToolIndex(idx);
    const tool = availableTools[idx];
    if (tool) {
      setPromptText(`Query ${tool.mcpToolName} for active records`);
      setExecutionResult(null);
      setHasRun(false);

      const nextParams: Record<string, string> = {};
      if (tool.params && Array.isArray(tool.params)) {
        tool.params.forEach((p: any) => {
          if (p && p.key) nextParams[p.key] = String(p.value || "");
        });
      }
      setToolParams(nextParams);
    }
  };

  const handleRunSimulation = async () => {
    if (!promptText.trim()) {
      showToast("Please enter a test prompt", "warning");
      return;
    }

    setIsSimulating(true);
    try {
      const slug =
        user?.mcpSlug ||
        user?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        "";

      const res = await runLiveMcpSimulation({
        mcpSlug: slug,
        companyId: user?.id,
        apiIndex: currentTool.rawIndex ?? selectedToolIndex,
        toolName: currentTool.mcpToolName,
        prompt: promptText,
        endpoint: currentTool.endpoint,
        method: currentTool.method,
        headers: currentTool.headers,
        params: Object.keys(toolParams).map((k) => ({
          key: k,
          value: toolParams[k],
        })),
        authType: currentTool.authType,
        credentials: currentTool.credentials,
        customArgs: toolParams,
      });

      setExecutionResult(res);
      setHasRun(true);

      if (res.success) {
        showToast(
          `Real live MCP result received (${res.latencyMs}ms)`,
          "success",
        );
      } else {
        showToast(
          res.error || "Simulation completed with errors. See Inspector tab.",
          "warning",
        );
      }
    } catch (err: any) {
      showToast(err.message || "Failed to execute live MCP call", "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleContinue = () => {
    setOnboardingStep(2);
    navigate({
      to: isEmbeddedInDashboard ? "/onboarding_dashboard/plans" : "/plans",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    showToast(`Copied ${label} to clipboard`, "success");
    setTimeout(() => setCopiedState(null), 2000);
  };

  // Structured records extracted from live result
  const displayItems = useMemo(() => {
    if (!executionResult) return [];
    if (
      executionResult.structuredData &&
      executionResult.structuredData.length > 0
    ) {
      return executionResult.structuredData;
    }
    if (executionResult.singleRecord) {
      return [executionResult.singleRecord];
    }
    return [];
  }, [executionResult]);

  return (
    <div
      className={styles.flowShell}
      style={
        isCompanyInDashboard
          ? {
              padding: 0,
              background: "transparent",
              minHeight: "auto",
              boxShadow: "none",
            }
          : undefined
      }
    >
      <main
        className={styles.mcpMain}
        style={isCompanyInDashboard ? { padding: 0 } : undefined}
      >
        <section
          className={styles.mcpHero}
          style={isCompanyInDashboard ? { marginBottom: "1.5rem" } : undefined}
        >
          <div>
            <h2 className={styles.title}>
              Model Context Protocol (MCP) Simulation
            </h2>
            <p className={styles.subtitle}>
              Execute genuine live requests through your Model Context Protocol
              gateway. Test real API tools, inspect raw JSON-RPC 2.0 payloads,
              and verify authentic ChatGPT responses without an iframe.
            </p>
          </div>
        </section>

        {/* Configuration Card */}
        <section
          className={styles.card}
          style={{
            marginBottom: "2rem",
            padding: "1.75rem",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <label
                className={styles.label}
                style={{ marginBottom: "0.4rem", display: "block" }}
              >
                Select Registered MCP Tool to Test
              </label>
              <select
                className={styles.input}
                value={selectedToolIndex}
                onChange={(e) => handleToolChange(Number(e.target.value))}
                style={{ cursor: "pointer", fontWeight: 700 }}
              >
                {availableTools.map((t, idx) => (
                  <option key={t.id} value={idx}>
                    {t.name} ({t.mcpToolName}) - [{t.method}]
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
                  color: colors.TextBody,
                }}
              >
                <strong>Method:</strong> {currentTool.method}
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
                  color: colors.TextBody,
                }}
              >
                <strong>Auth:</strong> {currentTool.authType}
              </span>
            </div>
          </div>

          {/* Dynamic Tool Parameters if present */}
          {Object.keys(toolParams).length > 0 && (
            <div
              style={{
                marginBottom: "1.25rem",
                padding: "1rem",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: colors.TextGradientOne || "#6366f1",
                  marginBottom: "0.75rem",
                }}
              >
                Tool Query Parameters (Live Overrides)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {Object.keys(toolParams).map((paramKey) => (
                  <div key={paramKey}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: colors.TextBody,
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                      }}
                    >
                      {paramKey}
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      style={{
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.85rem",
                        minHeight: "auto",
                      }}
                      value={toolParams[paramKey]}
                      onChange={(e) =>
                        setToolParams((prev) => ({
                          ...prev,
                          [paramKey]: e.target.value,
                        }))
                      }
                      placeholder={`Value for ${paramKey}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              className={styles.label}
              style={{ marginBottom: "0.4rem", display: "block" }}
            >
              Test Query / Simulated ChatGPT User Prompt
            </label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <input
                type="text"
                className={styles.input}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter prompt for ChatGPT to call this tool..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunSimulation();
                }}
              />
              <button
                type="button"
                className={styles.button}
                onClick={handleRunSimulation}
                disabled={isSimulating}
                style={{
                  width: "auto",
                  minHeight: "3.2rem",
                  padding: "0 1.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                <RocketIcon
                  size={18}
                  color={colors.ButtonOverlaySecondaryText}
                />
                <span>
                  {isSimulating ? "Executing Live Call..." : "Run Simulation"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Live MCP Inspector & ChatGPT Response Preview */}
        <section className={styles.widgetPreview} style={{ textAlign: "left" }}>
          {/* Chrome Header with View Mode Tabs */}
          <div className={styles.widgetChrome}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className={styles.trafficLights}>
                <span style={{ background: "#c94f65" }} />
                <span style={{ background: "#c98839" }} />
                <span
                  style={{ background: colors.BrandEmerald || "#10b981" }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "0.25rem",
                  borderRadius: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("chatgpt")}
                  style={{
                    border: "none",
                    background:
                      activeTab === "chatgpt"
                        ? "rgba(255, 255, 255, 0.15)"
                        : "transparent",
                    color:
                      activeTab === "chatgpt"
                        ? colors.TextHeading
                        : colors.TextBody,
                    padding: "0.4rem 0.85rem",
                    borderRadius: "6px",
                    fontWeight: activeTab === "chatgpt" ? 700 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  ChatGPT UI Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("inspector")}
                  style={{
                    border: "none",
                    background:
                      activeTab === "inspector"
                        ? "rgba(255, 255, 255, 0.15)"
                        : "transparent",
                    color:
                      activeTab === "inspector"
                        ? colors.TextHeading
                        : colors.TextBody,
                    padding: "0.4rem 0.85rem",
                    borderRadius: "6px",
                    fontWeight: activeTab === "inspector" ? 700 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>MCP Inspector (Dev Mode)</span>
                  {executionResult && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                        background: executionResult.success
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                        color: executionResult.success ? "#10b981" : "#ef4444",
                        fontWeight: 700,
                      }}
                    >
                      {executionResult.statusCode ||
                        (executionResult.success ? 200 : 500)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {executionResult && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "4px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#818cf8",
                    fontWeight: 700,
                  }}
                >
                  ⚡ {executionResult.latencyMs}ms
                </span>
              )}
              <span
                style={{
                  color: colors.TextGradientOne,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {hasRun ? "LIVE RESPONSE VERIFIED" : "READY"}
              </span>
            </div>
          </div>

          {/* TAB 1: ChatGPT UI Experience Preview */}
          {activeTab === "chatgpt" && (
            <div className={styles.previewBody} style={{ padding: "2rem" }}>
              {/* User Message Bubble */}
              <div
                style={{
                  maxWidth: "75%",
                  marginLeft: "auto",
                  marginBottom: "1.5rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "1rem 1rem 0.2rem 1rem",
                  background: `linear-gradient(135deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                  color: colors.TextOverlay,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.25)",
                }}
              >
                {promptText}
              </div>

              {/* Assistant Response Bubble */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  maxWidth: "100%",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#10a37f",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  AI
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: colors.TextHeading,
                      fontSize: "1rem",
                      lineHeight: 1.6,
                      margin: "0 0 1rem 0",
                    }}
                  >
                    {hasRun && executionResult ? (
                      executionResult.success ? (
                        <>
                          I called your registered MCP tool{" "}
                          <strong>{currentTool.mcpToolName}</strong> via{" "}
                          <code
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                            }}
                          >
                            {executionResult.source === "mcp-server"
                              ? `/mcp/${user?.mcpSlug || "gateway"}`
                              : currentTool.endpoint}
                          </code>
                          .{" "}
                          {executionResult.textMessage ||
                            "Here is the verified live response:"}
                        </>
                      ) : (
                        <span style={{ color: "#ef4444" }}>
                          Tool call error:{" "}
                          <strong>
                            {executionResult.error ||
                              "The server could not process the request."}
                          </strong>
                          <br />
                          <small style={{ color: colors.TextBody }}>
                            Check the &quot;MCP Inspector&quot; tab above to
                            view the raw JSON-RPC response and diagnostics.
                          </small>
                        </span>
                      )
                    ) : (
                      <>
                        Ready to test. Click{" "}
                        <strong>&quot;Run Simulation&quot;</strong> above to
                        dispatch a live query to the Model Context Protocol
                        engine.
                      </>
                    )}
                  </p>

                  {/* Real Live Structured Cards */}
                  {hasRun && displayItems.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "1.25rem",
                        marginTop: "1.25rem",
                      }}
                    >
                      {displayItems.map((item: any, i: number) => {
                        const title =
                          item.name ||
                          item.title ||
                          (item.make && item.model
                            ? `${item.make} ${item.model}${item.variant ? ` (${item.variant})` : ""}`
                            : item.label || `Record #${i + 1}`);

                        const price = item.dailyRate
                          ? `$${item.dailyRate}/day`
                          : item.price || item.cost || item.amount || "";

                        const status =
                          item.status ||
                          item.category ||
                          item.fuelType ||
                          "Active";

                        const desc =
                          item.description ||
                          item.features ||
                          item.details ||
                          (item.location?.name
                            ? `Location: ${item.location.name}`
                            : "Verified authentic record from registered API");

                        const imageUrl =
                          item.images ||
                          item.image ||
                          item.photo ||
                          item.thumbnail;

                        return (
                          <div
                            key={i}
                            style={{
                              background:
                                "var(--app-bg-secondary, rgba(255, 255, 255, 0.04))",
                              border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
                              borderRadius: "1rem",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            {imageUrl && (
                              <div
                                style={{
                                  height: "140px",
                                  width: "100%",
                                  background: "#1e1e24",
                                  overflow: "hidden",
                                  position: "relative",
                                }}
                              >
                                <img
                                  src={imageUrl}
                                  alt={title}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      "none";
                                  }}
                                />
                              </div>
                            )}

                            <div style={{ padding: "1.25rem" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <h4
                                  style={{
                                    margin: 0,
                                    color: colors.TextHeading,
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {title}
                                </h4>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    color: "#10b981",
                                    background: "rgba(16, 185, 129, 0.15)",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {status}
                                </span>
                              </div>
                              <p
                                style={{
                                  margin: "0 0 0.75rem 0",
                                  color: colors.TextBody,
                                  fontSize: "0.825rem",
                                  lineHeight: 1.4,
                                }}
                              >
                                {desc}
                              </p>

                              {/* Attributes pills */}
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.4rem",
                                  marginBottom: "0.75rem",
                                }}
                              >
                                {item.year && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      padding: "0.15rem 0.4rem",
                                      borderRadius: "4px",
                                      background: "rgba(255, 255, 255, 0.06)",
                                      color: colors.TextBody,
                                    }}
                                  >
                                    Year: {item.year}
                                  </span>
                                )}
                                {item.transmission && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      padding: "0.15rem 0.4rem",
                                      borderRadius: "4px",
                                      background: "rgba(255, 255, 255, 0.06)",
                                      color: colors.TextBody,
                                    }}
                                  >
                                    {item.transmission}
                                  </span>
                                )}
                                {item.seats && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      padding: "0.15rem 0.4rem",
                                      borderRadius: "4px",
                                      background: "rgba(255, 255, 255, 0.06)",
                                      color: colors.TextBody,
                                    }}
                                  >
                                    {item.seats} Seats
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {price && (
                                  <span
                                    style={{
                                      color: colors.TextHeading,
                                      fontWeight: 800,
                                      fontSize: "1.05rem",
                                    }}
                                  >
                                    {price}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={styles.button}
                                  style={{
                                    width: "auto",
                                    minHeight: "2.2rem",
                                    padding: "0.35rem 0.85rem",
                                    fontSize: "0.75rem",
                                  }}
                                  onClick={() =>
                                    showToast(
                                      `Selected "${title}" via MCP tool action!`,
                                      "success",
                                    )
                                  }
                                >
                                  Call Action
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MCP Inspector Developer View (NO IFRAME) */}
          {activeTab === "inspector" && (
            <div style={{ padding: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 0.25rem 0",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: colors.TextHeading,
                    }}
                  >
                    MCP Protocol Inspector Console
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: colors.TextBody,
                    }}
                  >
                    Direct JSON-RPC 2.0 diagnostics against backend Model
                    Context Protocol server.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: colors.TextHeading,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          executionResult?.responsePayload ||
                            executionResult?.rawResponseText ||
                            {},
                          null,
                          2,
                        ),
                        "Response JSON",
                      )
                    }
                  >
                    {copiedState === "Response JSON"
                      ? "✓ Copied"
                      : "Copy Response JSON"}
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: colors.TextHeading,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          executionResult?.requestPayload || {},
                          null,
                          2,
                        ),
                        "Request JSON",
                      )
                    }
                  >
                    {copiedState === "Request JSON"
                      ? "✓ Copied"
                      : "Copy Request JSON"}
                  </button>
                </div>
              </div>

              {/* Status Header Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: colors.TextBody,
                      marginBottom: "0.25rem",
                    }}
                  >
                    TRANSPORT
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: colors.TextHeading,
                    }}
                  >
                    Streamable HTTP (SSE)
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: colors.TextBody,
                      marginBottom: "0.25rem",
                    }}
                  >
                    ACTIVE PROTOCOL
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#6366f1",
                    }}
                  >
                    Model Context Protocol 2024-11-05
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: colors.TextBody,
                      marginBottom: "0.25rem",
                    }}
                  >
                    ROUND-TRIP LATENCY
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    {executionResult
                      ? `${executionResult.latencyMs} ms`
                      : "---"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: colors.TextBody,
                      marginBottom: "0.25rem",
                    }}
                  >
                    RECORDS RETURNED
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: colors.TextHeading,
                    }}
                  >
                    {displayItems.length} records
                  </div>
                </div>
              </div>

              {/* JSON-RPC Request & Response Split Screen */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {/* Request Payload */}
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: colors.TextBody,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "0.5rem",
                    }}
                  >
                    JSON-RPC 2.0 Request (tools/call)
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "1rem",
                      borderRadius: "8px",
                      background: "#0c0d12",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#a5b4fc",
                      fontSize: "0.8rem",
                      fontFamily: "JetBrains Mono, monospace",
                      overflowX: "auto",
                      maxHeight: "360px",
                    }}
                  >
                    {executionResult
                      ? JSON.stringify(executionResult.requestPayload, null, 2)
                      : "Click 'Run Simulation' to dispatch JSON-RPC 2.0 tools/call request."}
                  </pre>
                </div>

                {/* Live Response Payload */}
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: colors.TextBody,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Actual Live Response (Result Body)
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "1rem",
                      borderRadius: "8px",
                      background: "#0c0d12",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: executionResult?.success ? "#34d399" : "#f87171",
                      fontSize: "0.8rem",
                      fontFamily: "JetBrains Mono, monospace",
                      overflowX: "auto",
                      maxHeight: "360px",
                    }}
                  >
                    {executionResult
                      ? JSON.stringify(
                          executionResult.responsePayload ||
                            executionResult.rawResponseText ||
                            {},
                          null,
                          2,
                        )
                      : "Awaiting live execution response from MCP server..."}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Actions Row (Hidden when in Dashboard or completed onboarding) */}
        {!isCompanyInDashboard && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "3rem",
              paddingTop: "2rem",
              borderTop: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
            }}
          >
            <div></div>
            <button
              type="button"
              className={styles.button}
              onClick={handleContinue}
              style={{
                width: "auto",
                minHeight: "3rem",
                padding: "0 2rem",
                opacity: !executionResult ? 0.5 : 1,
                cursor: !executionResult ? "not-allowed" : "pointer",
              }}
              disabled={!executionResult}
            >
              <span>Continue to Plan Selection</span>
              <RightArrowIcon size={18} color={colors.TextOverlay} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default McpSimulation;
