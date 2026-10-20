import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, LeftArrowIcon, LockIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { showToast } from "../../../../utils";

const Checkout: FC<{
  stepView: any;
  setStepView: (stepView: any) => void;
  selectedPlan: string;
  isProcessingPayment: boolean;
  setIsProcessingPayment: (isProcessingPayment: boolean) => void;
  cardholderName: string;
  setCardholderName: (cardholderName: string) => void;
  cardNumber: string;
  setCardNumber: (cardNumber: string) => void;
  expiryDate: string;
  setExpiryDate: (expiryDate: string) => void;
  cvv: string;
  setCvv: (cvv: string) => void;
  planBasePrice: number;
  taxAmount: number;
  totalAmount: number;
  isAnnual: boolean;
}> = ({
  stepView,
  setStepView,
  selectedPlan,
  isProcessingPayment,
  setIsProcessingPayment,
  cardholderName,
  setCardholderName,
  cardNumber,
  setCardNumber,
  expiryDate,
  setExpiryDate,
  cvv,
  setCvv,
  planBasePrice,
  taxAmount,
  totalAmount,
  isAnnual,
}) => {
  const { colors } = useThemeStore();
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setStepView("payment-success");
      showToast(
        `Payment verified! Computational tier "${selectedPlan}" provisioned.`,
        "success",
      );
    }, 700);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 className={styles.title} style={{ margin: 0 }}>
            Checkout &amp; Provisioning
          </h2>
          <p className={styles.subtitle} style={{ marginTop: "0.4rem" }}>
            Finalize subscription for your selected computational tier.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStepView("plans")}
          style={{
            background: "transparent",
            border: `1px solid ${colors.Border || "rgba(255,255,255,0.2)"}`,
            color: colors.TextBody,
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <LeftArrowIcon size={14} color="currentColor" />
          <span>Change Plan (Selected: {selectedPlan})</span>
        </button>
      </div>

      <section className={styles.checkoutGrid}>
        {/* Payment Details Form */}
        <div className={`${styles.card} ${styles.checkoutPrimary}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>
              Payment Details
            </h3>
            <div
              style={{
                display: "flex",
                gap: "0.4rem",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: colors.TextBody,
              }}
            >
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                VISA
              </span>
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                MC
              </span>
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                AMEX
              </span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleCheckoutSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Cardholder Name</span>
              <input
                className={styles.input}
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Corporate Name or Cardholder"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Card Number</span>
              <input
                className={styles.input}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 •••• •••• 4242"
                required
              />
            </label>

            <div className={styles.formSplit}>
              <label className={styles.field}>
                <span className={styles.label}>Expiry Date</span>
                <input
                  className={styles.input}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>CVV</span>
                <input
                  className={styles.input}
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="•••"
                  maxLength={4}
                  required
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
                color: colors.TextBody,
                marginTop: "0.5rem",
              }}
            >
              <LockIcon size={14} color="#10b981" />
              <span>
                256-bit SSL encrypted. Payment tokens are securely stored with
                PCI-DSS compliance.
              </span>
            </div>

            <button
              className={styles.button}
              type="submit"
              disabled={isProcessingPayment}
              style={{
                marginTop: "1.25rem",
                opacity: isProcessingPayment ? 0.7 : 1,
              }}
            >
              <LockIcon size={16} color={colors.TextOverlay || "#ffffff"} />
              <span>
                {isProcessingPayment
                  ? "Verifying Payment & Provisioning..."
                  : `Pay $${totalAmount.toFixed(2)} & Activate Plan`}
              </span>
            </button>
          </form>
        </div>

        {/* Order Summary Aside */}
        <aside className={`${styles.card} ${styles.checkoutSummary}`}>
          <h3 className={styles.cardTitle} style={{ marginBottom: "1.5rem" }}>
            Order Summary
          </h3>

          <div className={styles.summaryRow}>
            <span>
              <strong>{selectedPlan} Plan</strong>
              <br />
              <small style={{ color: colors.TextBody }}>
                {isAnnual ? "Billed annually" : "Billed monthly"}
              </small>
            </span>
            <strong className={styles.summaryStrong}>
              ${planBasePrice.toFixed(2)}
            </strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Edge MCP Routing Tunnel</span>
            <strong
              className={styles.summaryStrong}
              style={{ color: "#10b981" }}
            >
              Free
            </strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Cloud Gateway Sync Tax</span>
            <strong className={styles.summaryStrong}>
              ${taxAmount.toFixed(2)}
            </strong>
          </div>

          <div
            className={styles.summaryRow}
            style={{
              borderTop: `2px solid ${colors.Border || "rgba(255,255,255,0.15)"}`,
              marginTop: "0.5rem",
              paddingTop: "1.25rem",
            }}
          >
            <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              Total Due Today
            </span>
            <strong
              className={styles.summaryStrong}
              style={{
                fontSize: "1.25rem",
                color: colors.TextGradientOne || "#6366f1",
              }}
            >
              ${totalAmount.toFixed(2)}
            </strong>
          </div>

          <div className={styles.secureBox} style={{ marginTop: "2rem" }}>
            <CheckIcon size={18} color={colors.TextGradientOne || "#10b981"} />
            <div>
              <strong>Instant Activation</strong>
              <br />
              <small style={{ color: colors.TextBody }}>
                Access credentials and ChatGPT deployment immediately.
              </small>
            </div>
          </div>
        </aside>
      </section>

      {/* Bottom Actions Row */}
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
        <button
          type="button"
          className={styles.button}
          onClick={() => setStepView("plans")}
          style={{
            width: "auto",
            minHeight: "3rem",
            padding: "0 1.5rem",
            background: "transparent",
            border: `1px solid ${colors.Border || "rgba(255,255,255,0.2)"}`,
            color: colors.TextBody,
          }}
        >
          <LeftArrowIcon size={16} color="currentColor" />
          <span>Back to Plans</span>
        </button>
      </div>
    </div>
  );
};

export default Checkout;
