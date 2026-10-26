import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, RightArrowIcon } from "../../../../assets/icons";
import { useAuthStore, useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { showToast } from "../../../../utils";

const PaymentResult: FC<{
  selectedPlan: string;
  isAnnual: boolean;
  totalAmount: number;
  isEmbeddedInDashboard?: boolean;
}> = ({
  selectedPlan,
  isAnnual,
  totalAmount,
  isEmbeddedInDashboard = false,
}) => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { setOnboardingStep } = useAuthStore();
  const handleContinueToDeployment = () => {
    setOnboardingStep(3);
    showToast("Plan activated! Moving to ChatGPT Deployment.", "success");
    navigate({
      to: isEmbeddedInDashboard
        ? "/onboarding_dashboard/deploy"
        : "/deployment",
    });
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
      <section
        className={`${styles.card} ${styles.resultCard}`}
        style={{ padding: "3rem 2.5rem" }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.15)",
            border: "2px solid #10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem auto",
          }}
        >
          <CheckIcon size={40} color="#10b981" />
        </div>

        <h2
          className={styles.title}
          style={{
            fontSize: "1.75rem",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          Payment Successful &amp; Provisioned!
        </h2>

        <p
          className={styles.subtitle}
          style={{
            textAlign: "center !important" as any,
            margin: "0 auto 2rem auto",
          }}
        >
          Your computational tier <strong>{selectedPlan}</strong> is now active.
          Edge MCP routing and OpenAPI action manifests are ready to connect to
          ChatGPT.
        </p>

        {/* Receipt Summary Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.1)"}`,
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "0.75rem",
            }}
          >
            <span style={{ color: colors.TextBody, fontSize: "0.85rem" }}>
              Transaction Reference
            </span>
            <span
              style={{
                color: colors.TextHeading,
                fontWeight: 700,
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            >
              #ST-984210
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "0.75rem",
            }}
          >
            <span style={{ color: colors.TextBody, fontSize: "0.85rem" }}>
              Plan Activated
            </span>
            <span
              style={{
                color: colors.TextGradientOne || "#6366f1",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              {selectedPlan} ({isAnnual ? "Annual" : "Monthly"})
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "0.75rem",
            }}
          >
            <span style={{ color: colors.TextBody, fontSize: "0.85rem" }}>
              Amount Charged
            </span>
            <span
              style={{
                color: colors.TextHeading,
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              ${totalAmount.toFixed(2)} USD
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: colors.TextBody, fontSize: "0.85rem" }}>
              Gateway Status
            </span>
            <span
              style={{
                color: "#10b981",
                fontWeight: 800,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              ACTIVE &amp; READY
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            className={styles.button}
            onClick={handleContinueToDeployment}
            style={{
              minHeight: "3.5rem",
              fontSize: "1rem",
              fontWeight: 800,
            }}
          >
            <span>Continue to ChatGPT Deployment</span>
            <RightArrowIcon size={18} color={colors.TextOverlay || "#ffffff"} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PaymentResult;
