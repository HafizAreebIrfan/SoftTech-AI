import { FC, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  LockIcon,
  RocketIcon,
  TerminalIcon,
  RightArrowIcon,
} from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";

const DeploymentInProgress: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const steps = [
    {
      title: "Building Docker container",
      body: "Image compiled and verified successfully.",
    },
    {
      title: "Pushing to registry",
      body: "Artifacts synchronized with global edge storage.",
    },
    {
      title: "Deploying MCP server",
      body: "Edge cluster container initialized.",
    },
    {
      title: "Configuring SSL/TLS",
      body: "Certificates verified and secured.",
    },
    {
      title: "Registering GPT plugin",
      body: "OpenAI manifest handshake completed.",
    },
    { title: "Going live", body: "Propagating DNS records globally." },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            navigate({ to: "/integration-success" });
          }, 800);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(timer);
  }, [navigate, steps.length]);

  return (
    <div className={styles.flowShell}>
      <main
        className={styles.centered}
        style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem" }}
      >
        <section className={styles.deploymentCard}>
          <div className={styles.deploymentHead}>
            <div className={styles.deploymentBadge}>
              <RocketIcon size={32} color={colors.TextOverlay} />
            </div>
            <h1 className={styles.cardTitle} style={{ fontSize: "2rem" }}>
              Deployment in Progress
            </h1>
            <p className={styles.cardText}>
              Initializing Model Context Protocol bridge. Your API server is
              being provisioned across our global edge network.
            </p>
          </div>

          <div className={styles.deploymentSteps}>
            <div className={styles.timeline}>
              {steps.map((step, idx) => {
                const isDone = idx < activeStepIndex;
                const isActive = idx === activeStepIndex;
                const isPending = idx > activeStepIndex;

                return (
                  <div className={styles.timelineItem} key={step.title}>
                    <div
                      className={[
                        styles.timelineDot,
                        isActive ? styles.timelineDotActive : "",
                        isPending ? styles.timelineDotPending : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {isDone && (
                        <CheckIcon size={16} color={colors.TextGradientOne} />
                      )}
                      {isActive && (
                        <TerminalIcon
                          size={16}
                          color={colors.TextGradientOne}
                        />
                      )}
                      {isPending && (
                        <LockIcon size={14} color={colors.TextBody} />
                      )}
                    </div>
                    <div>
                      <h2
                        className={styles.cardTitle}
                        style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}
                      >
                        {step.title}
                      </h2>
                      {isActive ? (
                        <div>
                          <div className={styles.progressTrack}>
                            <div
                              className={styles.progressFill}
                              style={{ width: "80%" }}
                            />
                          </div>
                          <p
                            className={styles.cardText}
                            style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
                          >
                            {step.body}
                          </p>
                        </div>
                      ) : (
                        <p
                          className={styles.cardText}
                          style={{ fontSize: "0.8rem" }}
                        >
                          {step.body}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={styles.deploymentFooter}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: colors.TextGradientOne,
                  display: "inline-block",
                  boxShadow: `0 0 10px ${colors.TextGradientOne}`,
                }}
              />
              <span
                style={{
                  color: colors.TextGradientOne,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {activeStepIndex >= steps.length - 1
                  ? "Deployment Finalizing..."
                  : "Deployment Running..."}
              </span>
            </div>

            <button
              type="button"
              className={styles.button}
              onClick={() => navigate({ to: "/integration-success" })}
              style={{
                width: "auto",
                minHeight: "2.5rem",
                padding: "0 1.25rem",
                fontSize: "0.85rem",
              }}
            >
              <span>Skip Wait</span>
              <RightArrowIcon size={14} color={colors.TextOverlay} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DeploymentInProgress;
