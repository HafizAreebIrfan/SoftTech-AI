import { FC, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  RocketIcon,
  ClipboardIcon,
  LeftArrowIcon,
  SparklesIcon,
} from "../../../../assets/icons";
import { useAuthStore, useThemeStore } from "../../../../hooks";
import { showToast } from "../../../../utils/toast/toasts";
import styles from "../../../../styles/accountflow.module.css";

const Deployment: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { user, setOnboardingStep } = useAuthStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const slug =
    user?.mcpSlug ||
    user?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "gateway";
  const openApiUrl = `https://mcp.softtech.ai/gateway/${slug}/openapi.json`;
  const sseGatewayUrl = `https://mcp.softtech.ai/gateway/${slug}/sse`;
  const privacyPolicyUrl = `https://softtech.ai/legal/privacy`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!", "info");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartDeployment = () => {
    setOnboardingStep(3);
    navigate({ to: "/deployment_in_progress" });
  };

  return (
    <div className={styles.flowShell}>
      <main className={styles.mcpMain} style={{ padding: "2rem" }}>
        {/* Step 3 Header Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
            paddingBottom: "1.25rem",
            borderBottom: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.08)"}`,
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "999px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <SparklesIcon size={12} color="currentColor" />
              Step 3 • Live Deployment &amp; Gateway
            </span>
          </div>

          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.05)",
              color: colors.TextBody,
              fontWeight: 600,
            }}
          >
            Tenant: <strong>{user?.name || "Corporate"}</strong>
          </span>
        </div>

        <section
          className={`${styles.card} ${styles.resultCard}`}
          style={{ textAlign: "left", padding: "2.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div className={styles.largeIcon} style={{ margin: 0 }}>
              <RocketIcon
                size={36}
                color={colors.TextGradientOne || "#6366f1"}
              />
            </div>
            <div>
              <h2
                className={styles.title}
                style={{ margin: 0, fontSize: "1.75rem" }}
              >
                Deploy to ChatGPT
              </h2>
              <p
                className={styles.subtitle}
                style={{ margin: "0.35rem 0 0 0" }}
              >
                Connect your live Model Context Protocol gateway tunnel directly
                to OpenAI Custom GPTs.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: "1.25rem", margin: "2rem 0" }}>
            {/* OpenAPI Manifest Endpoint */}
            <div
              style={{
                background:
                  "var(--app-bg-secondary, rgba(255, 255, 255, 0.04))",
                border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: "0.75rem",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: colors.TextHeading,
                  }}
                >
                  OpenAPI 3.1 Specification Manifest URL
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(openApiUrl, "openapi")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color:
                      copiedKey === "openapi"
                        ? "#10b981"
                        : colors.TextGradientOne || "#6366f1",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <ClipboardIcon size={14} color="currentColor" />
                  <span>
                    {copiedKey === "openapi" ? "Copied!" : "Copy URL"}
                  </span>
                </button>
              </div>
              <code
                style={{
                  fontSize: "0.85rem",
                  color: colors.TextBody,
                  wordBreak: "break-all",
                  display: "block",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                }}
              >
                {openApiUrl}
              </code>
            </div>

            {/* MCP SSE Live Gateway */}
            <div
              style={{
                background:
                  "var(--app-bg-secondary, rgba(255, 255, 255, 0.04))",
                border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: "0.75rem",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: colors.TextHeading,
                  }}
                >
                  MCP SSE Streaming Server Gateway
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sseGatewayUrl, "sse")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color:
                      copiedKey === "sse"
                        ? "#10b981"
                        : colors.TextGradientOne || "#6366f1",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <ClipboardIcon size={14} color="currentColor" />
                  <span>{copiedKey === "sse" ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>
              <code
                style={{
                  fontSize: "0.85rem",
                  color: colors.TextBody,
                  wordBreak: "break-all",
                  display: "block",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                }}
              >
                {sseGatewayUrl}
              </code>
            </div>

            {/* Privacy Policy */}
            <div
              style={{
                background:
                  "var(--app-bg-secondary, rgba(255, 255, 255, 0.04))",
                border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: "0.75rem",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: colors.TextHeading,
                  }}
                >
                  ChatGPT Action Privacy Policy URL
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(privacyPolicyUrl, "privacy")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color:
                      copiedKey === "privacy"
                        ? "#10b981"
                        : colors.TextGradientOne || "#6366f1",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <ClipboardIcon size={14} color="currentColor" />
                  <span>
                    {copiedKey === "privacy" ? "Copied!" : "Copy URL"}
                  </span>
                </button>
              </div>
              <code
                style={{
                  fontSize: "0.85rem",
                  color: colors.TextBody,
                  wordBreak: "break-all",
                  display: "block",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                }}
              >
                {privacyPolicyUrl}
              </code>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "2.5rem",
              paddingTop: "1.5rem",
              borderTop: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
            }}
          >
            <button
              type="button"
              className={styles.button}
              onClick={() => setOnboardingStep(2)}
              style={{
                width: "auto",
                minHeight: "3rem",
                padding: "0 1.5rem",
                background: "transparent",
                border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.2)"}`,
                color: colors.TextBody,
              }}
            >
              <LeftArrowIcon size={16} color="currentColor" />
              <span>Back to Plans</span>
            </button>

            <button
              className={styles.button}
              onClick={handleStartDeployment}
              type="button"
              style={{ width: "auto", minHeight: "3.2rem", padding: "0 2rem" }}
            >
              <RocketIcon size={18} color={colors.TextOverlay || "#ffffff"} />
              <span>Start Automated Deployment</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Deployment;
