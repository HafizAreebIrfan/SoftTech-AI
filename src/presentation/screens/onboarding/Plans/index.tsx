import { FC, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  RightArrowIcon,
  LeftArrowIcon,
  SparklesIcon,
} from "../../../../assets/icons";
import { useAuthStore, useThemeStore } from "../../../../hooks";
import { showToast } from "../../../../utils/toast/toasts";
import styles from "../../../../styles/accountflow.module.css";
import Checkout from "../Checkout";
import PaymentResult from "../PaymentResult";

type Step2View = "plans" | "checkout" | "payment-success";

const Plans: FC<{ isEmbeddedInDashboard?: boolean }> = ({
  isEmbeddedInDashboard = false,
}) => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { user, setOnboardingStep } = useAuthStore();

  const [stepView, setStepView] = useState<Step2View>("plans");
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("Neural Pro");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Checkout form fields
  const [cardholderName, setCardholderName] = useState(
    user?.name || "Corporate Account",
  );
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiryDate, setExpiryDate] = useState("12/28");
  const [cvv, setCvv] = useState("842");

  const plans = [
    {
      name: "Starter",
      monthly: "$0",
      annual: "$0",
      monthlyNum: 0,
      annualNum: 0,
      features: [
        "5,000 API Requests",
        "Standard Latency (150ms)",
        "1 MCP Bridge Tunnel",
        "Community Support",
      ],
    },
    {
      name: "Neural Pro",
      monthly: "$49",
      annual: "$39",
      monthlyNum: 49,
      annualNum: 39,
      features: [
        "100,000 API Requests",
        "Edge Accelerated (<20ms)",
        "Unlimited MCP Tools",
        "Real-time Telemetry Logs",
        "24/7 Priority Support",
      ],
    },
    {
      name: "Enterprise",
      monthly: "Custom",
      annual: "Custom",
      monthlyNum: 299,
      annualNum: 249,
      features: [
        "Unlimited API Requests",
        "Dedicated VPC Container",
        "99.99% Uptime SLA",
        "Custom OAuth2 Identity",
        "Dedicated Solutions Architect",
      ],
    },
  ];

  const currentPlanObj = plans.find((p) => p.name === selectedPlan) || plans[1];
  const planBasePrice = isAnnual
    ? currentPlanObj.annualNum
    : currentPlanObj.monthlyNum;
  const taxAmount = planBasePrice > 0 ? 2.45 : 0;
  const totalAmount = planBasePrice + taxAmount;

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setStepView("checkout");
  };

  return (
    <div className={styles.flowShell}>
      <main className={styles.mcpMain} style={{ padding: "2rem" }}>
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
                background: "rgba(99, 102, 241, 0.15)",
                color: colors.TextGradientOne || "#818cf8",
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <SparklesIcon size={12} color="currentColor" />
              Step 2 • Computational Capacity
            </span>
          </div>

          {/* Sub-steps Indicator Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.04)",
              padding: "0.25rem 0.5rem",
              borderRadius: "999px",
              border: `1px solid ${colors.Border || "rgba(255, 255, 255, 0.08)"}`,
            }}
          >
            <button
              type="button"
              onClick={() => setStepView("plans")}
              style={{
                border: "none",
                background:
                  stepView === "plans"
                    ? "rgba(255, 255, 255, 0.15)"
                    : "transparent",
                color:
                  stepView === "plans" ? colors.TextHeading : colors.TextBody,
                fontSize: "0.75rem",
                fontWeight: stepView === "plans" ? 800 : 600,
                padding: "0.3rem 0.7rem",
                borderRadius: "999px",
                cursor: "pointer",
              }}
            >
              1. Plans {stepView !== "plans" && "✓"}
            </button>
            <span
              style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "0.75rem" }}
            >
              •
            </span>
            <button
              type="button"
              onClick={() => setStepView("checkout")}
              style={{
                border: "none",
                background:
                  stepView === "checkout"
                    ? "rgba(255, 255, 255, 0.15)"
                    : "transparent",
                color:
                  stepView === "checkout"
                    ? colors.TextHeading
                    : colors.TextBody,
                fontSize: "0.75rem",
                fontWeight: stepView === "checkout" ? 800 : 600,
                padding: "0.3rem 0.7rem",
                borderRadius: "999px",
                cursor: "pointer",
              }}
            >
              2. Checkout {stepView === "payment-success" && "✓"}
            </button>
            <span
              style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "0.75rem" }}
            >
              •
            </span>
            <button
              type="button"
              onClick={() => setStepView("payment-success")}
              disabled={stepView !== "payment-success"}
              style={{
                border: "none",
                background:
                  stepView === "payment-success"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "transparent",
                color:
                  stepView === "payment-success" ? "#10b981" : colors.TextBody,
                fontSize: "0.75rem",
                fontWeight: stepView === "payment-success" ? 800 : 600,
                padding: "0.3rem 0.7rem",
                borderRadius: "999px",
                cursor: stepView === "payment-success" ? "pointer" : "default",
                opacity: stepView === "payment-success" ? 1 : 0.5,
              }}
            >
              3. Verification
            </button>
          </div>
        </div>

        {stepView === "plans" && (
          <div>
            <section className={styles.hero} style={{ marginBottom: "2rem" }}>
              <h2 className={styles.title} style={{ margin: 0 }}>
                Choose a Plan
              </h2>
              <p className={styles.subtitle} style={{ marginTop: "0.5rem" }}>
                Scale your API intelligence layer with our precision-engineered
                computational tiers.
              </p>
            </section>

            {/* Billing Toggle */}
            <div
              className={styles.billingToggle}
              style={{ marginBottom: "2.5rem" }}
            >
              <div className={styles.toggleInner}>
                <button
                  className={
                    !isAnnual ? styles.toggleActive : styles.toggleInactive
                  }
                  onClick={() => setIsAnnual(false)}
                  type="button"
                >
                  Monthly
                </button>
                <button
                  className={
                    isAnnual ? styles.toggleActive : styles.toggleInactive
                  }
                  onClick={() => setIsAnnual(true)}
                  type="button"
                >
                  Annual <span>Save 20%</span>
                </button>
              </div>
            </div>

            {/* Plans 3-Card Grid */}
            <section className={styles.grid}>
              {plans.map((plan, index) => {
                const price = isAnnual ? plan.annual : plan.monthly;
                const isSelected = selectedPlan === plan.name;

                return (
                  <article
                    className={`${styles.card} ${
                      index === 1 ? styles.highlightCard : ""
                    }`}
                    key={plan.name}
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected
                        ? colors.TextGradientOne || "#6366f1"
                        : undefined,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    onClick={() => setSelectedPlan(plan.name)}
                  >
                    <div>
                      {index === 1 && (
                        <div className={styles.popularBadge}>POPULAR</div>
                      )}
                      <h3 className={styles.cardTitle}>{plan.name}</h3>
                      <div>
                        <span className={styles.price}>{price}</span>
                        {price !== "Custom" && price !== "$0" && (
                          <span className={styles.priceSub}>/mo</span>
                        )}
                      </div>
                      <ul className={styles.list}>
                        {plan.features.map((feature) => (
                          <li className={styles.listItem} key={feature}>
                            <CheckIcon
                              size={16}
                              color={colors.TextGradientOne || "#6366f1"}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      className={`${styles.button} ${
                        index === 0
                          ? styles.secondaryButton
                          : index === 2
                            ? styles.borderButton
                            : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan.name);
                      }}
                      type="button"
                      style={{ marginTop: "1.5rem" }}
                    >
                      <span>Select {plan.name}</span>
                      <RightArrowIcon
                        size={16}
                        color={colors.TextOverlay || "#ffffff"}
                      />
                    </button>
                  </article>
                );
              })}
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
                onClick={() => {
                  setOnboardingStep(1);
                  if (isEmbeddedInDashboard) {
                    navigate({ to: "/onboarding_dashboard/mcp" });
                  }
                }}
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
                <span>Back to MCP Simulation</span>
              </button>

              <button
                type="button"
                className={styles.button}
                onClick={() => setStepView("checkout")}
                style={{
                  width: "auto",
                  minHeight: "3rem",
                  padding: "0 2rem",
                }}
              >
                <span>Continue to Checkout</span>
                <RightArrowIcon
                  size={16}
                  color={colors.TextOverlay || "#ffffff"}
                />
              </button>
            </div>
          </div>
        )}

        {stepView === "checkout" && (
          <Checkout
            stepView={stepView}
            setStepView={setStepView}
            selectedPlan={selectedPlan}
            isProcessingPayment={isProcessingPayment}
            setIsProcessingPayment={setIsProcessingPayment}
            cardholderName={cardholderName}
            setCardholderName={setCardholderName}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            expiryDate={expiryDate}
            setExpiryDate={setExpiryDate}
            cvv={cvv}
            setCvv={setCvv}
            planBasePrice={planBasePrice}
            taxAmount={taxAmount}
            totalAmount={totalAmount}
            isAnnual={isAnnual}
          />
        )}

        {stepView === "payment-success" && (
          <PaymentResult
            selectedPlan={selectedPlan}
            isAnnual={isAnnual}
            totalAmount={totalAmount}
            isEmbeddedInDashboard={isEmbeddedInDashboard}
          />
        )}
      </main>
    </div>
  );
};

export default Plans;
