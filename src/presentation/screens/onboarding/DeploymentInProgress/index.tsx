import { FC } from "react";
import { CheckIcon, LockIcon, RocketIcon, TerminalIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../flowTheme";

const DeploymentInProgress: FC = () => {
  const { colors } = useThemeStore();

  return (
    <div className={styles.flowShell} style={getAccountFlowThemeVars(colors)}>
      <main className={styles.centered}>
        <section className={styles.deploymentCard}>
          <div className={styles.deploymentHead}>
            <div className={styles.deploymentBadge}>
              <RocketIcon size={32} color={colors.TextOverlay} />
            </div>
            <h1 className={styles.cardTitle} style={{ fontSize: "2rem" }}>
              Deployment in Progress
            </h1>
            <p className={styles.cardText}>
              Initialising Interstellar Protocol. Your API server is being
              provisioned across our global edge network.
            </p>
          </div>

          <div className={styles.deploymentSteps}>
          <div className={styles.timeline}>
            {[
              ["Building Docker container", "Image compiled and verified successfully.", "done"],
              ["Pushing to registry", "Artifacts synchronized with global storage.", "done"],
              ["Deploying MCP server", "65%", "active"],
              ["Configuring SSL/TLS", "Waiting for server readiness...", "pending"],
              ["Registering GPT plugin", "Pending handshake with OpenAI gateway.", "pending"],
              ["Going live", "Propagating DNS records globally.", "pending"],
            ].map(([title, body, status]) => (
              <div className={styles.timelineItem} key={title}>
                <div
                  className={[
                    styles.timelineDot,
                    status === "active" ? styles.timelineDotActive : "",
                    status === "pending" ? styles.timelineDotPending : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {status === "done" && <CheckIcon size={16} color={colors.TextGradientOne} />}
                  {status === "active" && <TerminalIcon size={16} color={colors.TextGradientOne} />}
                  {status === "pending" && <LockIcon size={14} color={colors.TextBody} />}
                </div>
                <div>
                  <h2 className={styles.cardTitle} style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    {title}
                  </h2>
                  {status === "active" ? (
                    <div>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} />
                      </div>
                      <p className={styles.cardText} style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}>{body}</p>
                    </div>
                  ) : (
                    <p className={styles.cardText} style={{ fontSize: "0.8rem" }}>{body}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
          <div className={styles.deploymentFooter}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: colors.TextGradientOne, display: "inline-block" }} />
              <span style={{ color: colors.TextGradientOne, fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Deployment running
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DeploymentInProgress;
