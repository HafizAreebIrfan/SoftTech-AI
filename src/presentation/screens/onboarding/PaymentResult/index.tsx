import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, CloseIcon, RightArrowIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../flowTheme";

const PaymentResult: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <div className={styles.flowShell} style={getAccountFlowThemeVars(colors)}>
      <main className={styles.paymentCanvas}>
        <div className={styles.paymentGrid}>
        <section className={`${styles.card} ${styles.resultCard}`}>
          <div className={styles.largeIcon}>
            <CheckIcon size={48} color={colors.TextGradientOne} />
          </div>
          <h1 className={styles.title}>Payment Successful!</h1>
          <p className={styles.subtitle}>
            Your Interstellar Pro plan is now active. Welcome to the future of AI
            management.
          </p>
          <div style={{ marginTop: "2.5rem" }}>
            <button
              className={styles.button}
              onClick={() => navigate({ to: "/deployment_softtech_ai_refined" })}
              type="button"
            >
              Continue to Deployment <RightArrowIcon size={16} color={colors.TextOverlay} />
            </button>
          </div>
        </section>
        <section className={`${styles.card} ${styles.resultCard} ${styles.failedCard}`}>
          <div className={`${styles.largeIcon} ${styles.errorIcon}`}>
            <CloseIcon size={42} color={colors.WarningText} />
          </div>
          <h1 className={styles.title}>Payment Failed</h1>
          <p className={styles.subtitle}>
            We couldn&apos;t process your payment. Please check your card details
            or bank balance.
          </p>
          <div className={styles.secureBox} style={{ marginTop: "2.5rem", textAlign: "left" }}>
            <span style={{ color: colors.WarningText, fontWeight: 800 }}>!</span>
            <div><strong>Error Code</strong><br /><small>ERR_INSUFFICIENT_FUNDS_ST402</small></div>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <button className={styles.button} type="button">Try Again</button>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
};

export default PaymentResult;
