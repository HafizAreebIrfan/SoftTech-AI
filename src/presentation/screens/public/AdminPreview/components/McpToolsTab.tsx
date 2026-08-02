import React from "react";
import styles from "../../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../../hooks/usetheme";
import { McpTool } from "../types";

interface McpToolsTabProps {
  toolSearchQuery: string;
  setToolSearchQuery: (q: string) => void;
  toggleToolEnabled: (id: string) => void;
  filteredTools: McpTool[];
}

const McpToolsTab: React.FC<McpToolsTabProps> = ({
  toolSearchQuery,
  setToolSearchQuery,
  toggleToolEnabled,
  filteredTools
}) => {
  const { colors, isDark } = useThemeStore();

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🛠️ Model Context Protocol (MCP) Tool Specifications</h2>
          <p style={{ fontSize: "0.85rem", color: colors.TextSecondary }}>
            AI Agents will call these tools to interact with your registered company APIs dynamically.
          </p>
        </div>

        {/* Filter Search */}
        <div className={styles.formGroup}>
          <input
            type="text"
            className={styles.formInput}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              borderColor: colors.CardBorder,
              color: colors.TextPrimary
            }}
            placeholder="Search Tool Name or Schema descriptions..."
            value={toolSearchQuery}
            onChange={(e) => setToolSearchQuery(e.target.value)}
          />
        </div>

        {/* Tools list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredTools.map(tool => (
            <div
              className={styles.sectionCard}
              style={{
                background: "rgba(255, 255, 255, 0.005)",
                borderColor: colors.CardBorder
              }}
              key={tool.id}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontFamily: "monospace",
                      fontWeight: "700",
                      color: colors.TextGradientTwo
                    }}
                  >
                    {tool.name}
                  </span>
                  <p style={{ fontSize: "0.875rem", margin: "0.25rem 0", color: colors.TextSecondary }}>
                    {tool.desc}
                  </p>
                </div>

                {/* Toggle Tool Switch */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                  <label className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={tool.enabled}
                      onChange={() => toggleToolEnabled(tool.id)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: tool.enabled ? colors.BrandEmerald : colors.TextSecondary,
                      fontWeight: "600"
                    }}
                  >
                    {tool.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Input Schema Parameters */}
              <div
                style={{
                  backgroundColor: isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.03)",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  border: `1px solid ${colors.CardBorder}`
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: colors.TextSecondary
                  }}
                >
                  Input Argument Schema
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {tool.params.map(param => (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: `1px dashed ${isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.06)"}`,
                        paddingBottom: "0.25rem",
                        fontSize: "0.8rem"
                      }}
                      key={param.name}
                    >
                      <span style={{ fontFamily: "monospace", color: colors.TextPrimary }}>
                        {param.name}
                        {param.required && <span style={{ color: colors.WarningText }}> *</span>}
                      </span>
                      <span style={{ color: colors.TextSecondary }}>
                        ({param.type}) - {param.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default McpToolsTab;
