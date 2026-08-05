import React from "react";
import styles from "../../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../../hooks/usetheme";
import { McpTool, TerminalLog } from "../types";

interface PlaygroundTabProps {
  mcpTools: McpTool[];
  selectedToolId: string;
  setSelectedToolId: (id: string) => void;
  playgroundLogs: TerminalLog[];
  playgroundInputs: Record<string, string>;
  setPlaygroundInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isRunningTest: boolean;
  handleRunTest: () => void;
  testResult: any;
}

const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
  mcpTools,
  selectedToolId,
  setSelectedToolId,
  playgroundLogs,
  playgroundInputs,
  setPlaygroundInputs,
  isRunningTest,
  handleRunTest,
  testResult
}) => {
  const { colors, isDark } = useThemeStore();

  const activeTool = mcpTools.find(t => t.id === selectedToolId);

  // Dynamic visual helper colors from theme
  const emeraldBadgeStyle = {
    backgroundColor: isDark ? "rgba(5, 150, 105, 0.15)" : "rgba(5, 150, 105, 0.1)",
    color: colors.BrandEmerald,
    borderColor: isDark ? "rgba(5, 150, 105, 0.3)" : "rgba(5, 150, 105, 0.2)",
    borderStyle: "solid" as const,
    borderWidth: "1px"
  };

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🧪 MCP Interaction & Testing Playground</h2>
          <p style={{ fontSize: "0.85rem", color: colors.TextSecondary }}>
            Execute tools inside a simulated sandboxed run window to inspect request execution, performance, and UI outcomes.
          </p>
        </div>

        <div className={styles.splitscreen}>
          {/* LEFT SPLIT: PARAMETERS CONTROL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>Select Tool to Test</label>
              <select
                className={styles.formSelect}
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: colors.CardBorder,
                  color: colors.TextPrimary
                }}
                value={selectedToolId}
                onChange={(e) => {
                  setSelectedToolId(e.target.value);
                  setPlaygroundInputs({});
                }}
              >
                <option value="">-- Choose Enabled Tool --</option>
                {mcpTools.filter(t => t.enabled).map(t => (
                  <option value={t.id} key={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Tool description & params */}
            {!activeTool ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  background: isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)",
                  border: `1px solid ${colors.CardBorder}`,
                  borderRadius: "8px",
                  color: colors.TextSecondary
                }}
              >
                Select an enabled tool from the dropdown above to configure parameters.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: `1px solid ${colors.CardBorder}`,
                    borderRadius: "8px",
                    padding: "1rem"
                  }}
                >
                  <h4 style={{ fontWeight: "700", fontFamily: "monospace", color: colors.TextGradientTwo }}>
                    {activeTool.name}
                  </h4>
                  <p style={{ fontSize: "0.825rem", color: colors.TextSecondary, marginTop: "0.25rem" }}>
                    {activeTool.desc}
                  </p>
                </div>

                {/* Dynamically build form inputs for tool arguments */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h5 style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: colors.TextSecondary }}>
                    Call Arguments
                  </h5>
                  {activeTool.params.map(param => (
                    <div className={styles.formGroup} key={param.name}>
                      <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>
                        {param.name} {param.required && <span style={{ color: colors.WarningText }}>*</span>}
                        <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: colors.TextSecondary, marginLeft: "0.5rem" }}>
                          ({param.type}) - {param.desc}
                        </span>
                      </label>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        className={styles.formInput}
                        style={{
                          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                          borderColor: colors.CardBorder,
                          color: colors.TextPrimary
                        }}
                        placeholder={param.type === "number" ? "e.g. 50" : "e.g. test-value"}
                        value={playgroundInputs[param.name] || ""}
                        onChange={(e) => setPlaygroundInputs(prev => ({
                          ...prev,
                          [param.name]: e.target.value
                        }))}
                        required={param.required}
                      />
                    </div>
                  ))}
                </div>

                <button
                  className={styles.btnPrimary}
                  style={{
                    width: "100%",
                    height: "42px",
                    backgroundColor: colors.TextPrimary,
                    color: colors.Background
                  }}
                  disabled={isRunningTest}
                  onClick={handleRunTest}
                >
                  {isRunningTest ? "Running Test Simulation..." : "🚀 Execute Tool Call"}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SPLIT: CONSOLE LOGS & OUTPUT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h5 style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: colors.TextSecondary }}>
              Playground Console Logs
            </h5>
            <div className={styles.terminalContainer}>
              {playgroundLogs.map((log, index) => (
                <div className={styles.terminalLog} key={index}>
                  <span className={styles.terminalTime}>[{log.time}]</span>
                  <span className={
                    log.type === "success" ? styles.terminalSuccess :
                    log.type === "warning" ? styles.terminalWarning :
                    log.type === "command" ? styles.terminalCommand :
                    styles.terminalInfo
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>

            {/* VISUAL WIDGET PREVIEW RESULT */}
            {testResult && (
              <div
                className={styles.sectionCard}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderColor: colors.CardBorder
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    color: colors.TextSecondary,
                    letterSpacing: "0.05em"
                  }}
                >
                  Dynamic Visual Widget Output
                </span>

                {/* 1. STOCK LEVEL WIDGET MOCK */}
                {testResult.type === "product_stock" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ fontWeight: "800", color: colors.TextPrimary }}>{testResult.data.sku}</h4>
                        <span style={{ fontSize: "0.8rem", color: colors.TextSecondary }}>Warehouse: {testResult.data.warehouse}</span>
                      </div>
                      <span className={styles.badge} style={emeraldBadgeStyle}>
                        {testResult.data.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", color: colors.TextSecondary }}>Stock Level</span>
                        <div style={{ fontSize: "2rem", fontWeight: "800", color: colors.BrandEmerald }}>
                          {testResult.data.stockLevel} pcs
                        </div>
                      </div>
                      <div style={{ flex: 1, borderLeft: `1px solid ${colors.CardBorder}`, paddingLeft: "1.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: colors.TextSecondary }}>Pricing Tier</span>
                        <div style={{ fontSize: "2rem", fontWeight: "800", color: colors.TextPrimary }}>
                          {testResult.data.price}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        borderRadius: "3px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, (testResult.data.stockLevel / 250) * 100)}%`,
                          height: "100%",
                          backgroundColor: colors.BrandEmerald,
                          boxShadow: `0 0 10px ${colors.BrandEmerald}`
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: colors.TextSecondary, textAlign: "right" }}>
                      Last Synced: {testResult.data.lastUpdated}
                    </span>
                  </div>
                )}

                {/* 2. TRANSACTION RECEIPT WIDGET MOCK */}
                {testResult.type === "payment" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      marginTop: "1rem",
                      background: "rgba(0,0,0,0.1)",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: `1px solid ${colors.CardBorder}`
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px dashed ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                        paddingBottom: "0.5rem"
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", color: colors.TextSecondary }}>Receipt Info</span>
                      <span className={styles.badge} style={emeraldBadgeStyle}>
                        {testResult.data.gatewayStatus}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: colors.TextSecondary }}>Txn ID:</span>
                      <span style={{ fontFamily: "monospace", fontWeight: "700", color: colors.TextPrimary }}>
                        {testResult.data.transactionId}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: colors.TextSecondary }}>Order Reference:</span>
                      <span style={{ color: colors.TextPrimary }}>{testResult.data.orderRef}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: colors.TextSecondary }}>Card Details:</span>
                      <span style={{ color: colors.TextPrimary, opacity: 0.8 }}>{testResult.data.brand}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        borderTop: `1px dashed ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                        paddingTop: "0.5rem"
                      }}
                    >
                      <span style={{ fontWeight: "700", color: colors.TextPrimary }}>Total Charged:</span>
                      <span style={{ color: colors.BrandEmerald, fontWeight: "800", fontSize: "1.1rem" }}>
                        {testResult.data.amountCharged}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: colors.TextSecondary, marginTop: "0.25rem", textAlign: "center" }}>
                      {testResult.data.timestamp}
                    </span>
                  </div>
                )}

                {/* 3. GENERIC DATA TABLE BLOCK */}
                {testResult.type === "generic" && (
                  <div style={{ marginTop: "1rem" }}>
                    <table className={styles.customTable} style={{ fontSize: "0.8rem" }}>
                      <thead>
                        <tr>
                          <th style={{ color: colors.TextSecondary }}>Field Key</th>
                          <th style={{ color: colors.TextSecondary }}>Returned Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(testResult.data).map(([key, val]) => (
                          <tr key={key} style={{ borderBottomColor: colors.CardBorder }}>
                            <td style={{ fontWeight: "700", color: colors.TextGradientTwo }}>{key}</td>
                            <td style={{ color: colors.TextPrimary }}>
                              {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaygroundTab;
