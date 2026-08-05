import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, LockIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../flowTheme";

const Checkout: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <div className={styles.flowShell} style={getAccountFlowThemeVars(colors)}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>Account Setup</span>
          <h1 className={styles.brand}>SoftTech AI</h1>
        </div>
        <nav className={styles.wizard}>
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotDone}`}><CheckIcon size={16} color={colors.TextGradientOne} /></span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 1</span><span className={styles.wizardLabel}>Plans</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotActive}`}>2</span><span className={styles.wizardCopy}><span className={`${styles.wizardKicker} ${styles.wizardKickerActive}`}>Current</span><span className={`${styles.wizardLabel} ${styles.wizardLabelActive}`}>Checkout</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={styles.wizardDot}>3</span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 3</span><span className={styles.wizardLabel}>Deployment</span></span></div>
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h2 className={styles.title}>Checkout</h2>
          <p className={styles.subtitle}>Finalize your premium AI integration deployment.</p>
        </section>
        <section className={styles.checkoutGrid}>
          <div className={`${styles.card} ${styles.checkoutPrimary}`}>
            <h3 className={styles.cardTitle}>Payment Details</h3>
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                navigate({ to: "/payment_result_softtech_ai_updated" });
              }}
            >
              {["Cardholder Name", "Card Number"].map((label) => (
                <label className={styles.field} key={label}>
                  <span className={styles.label}>{label}</span>
                  <input className={styles.input} placeholder={label} type={label === "CVV" ? "password" : "text"} />
                </label>
              ))}
              <div className={styles.formSplit}>
                {["Expiry Date", "CVV"].map((label) => (
                  <label className={styles.field} key={label}>
                    <span className={styles.label}>{label}</span>
                    <input className={styles.input} placeholder={label === "CVV" ? "***" : "MM/YY"} type={label === "CVV" ? "password" : "text"} />
                  </label>
                ))}
              </div>
              <button className={styles.button} type="submit">
                <LockIcon size={16} color={colors.TextOverlay} /> Complete Purchase
              </button>
            </form>
          </div>
          <aside className={`${styles.card} ${styles.checkoutSummary}`}>
            <h3 className={styles.cardTitle}>Order Summary</h3>
            <div className={styles.summaryRow}><span>Neural Pro Plan<br /><small>Billed monthly</small></span><strong className={styles.summaryStrong}>$49.00</strong></div>
            <div className={styles.summaryRow}><span>Platform Fee</span><strong className={styles.summaryStrong}>$0.00</strong></div>
            <div className={styles.summaryRow}><span>Cloud Sync Tax</span><strong className={styles.summaryStrong}>$2.45</strong></div>
            <div className={styles.summaryRow}><span>Total Due</span><strong className={styles.summaryStrong}>$51.45</strong></div>
            <div className={styles.secureBox}>
              <CheckIcon size={18} color={colors.TextGradientOne} />
              <div><strong>Secure Connection</strong><br /><small>256-bit SSL encrypted transaction</small></div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Checkout;
