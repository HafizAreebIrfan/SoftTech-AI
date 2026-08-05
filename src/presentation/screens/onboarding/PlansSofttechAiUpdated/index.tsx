import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, RightArrowIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../flowTheme";

const Plans: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  const plans = [
    ["Starter", "Free", ["5,000 API Requests", "Standard Latency", "Email Support"]],
    ["Neural Pro", "$49", ["100,000 API Requests", "Priority Latency", "Advanced Analytics"]],
    ["Enterprise", "Custom", ["Unlimited Requests", "Dedicated Support", "SLA & Compliance"]],
  ];

  return (
    <div className={styles.flowShell} style={getAccountFlowThemeVars(colors)}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>Account Setup</span>
          <h1 className={styles.brand}>SoftTech AI</h1>
        </div>
        <nav className={styles.wizard}>
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotDone}`}><CheckIcon size={16} color={colors.TextGradientOne} /></span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 1</span><span className={styles.wizardLabel}>MCP Test</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotActive}`}>2</span><span className={styles.wizardCopy}><span className={`${styles.wizardKicker} ${styles.wizardKickerActive}`}>Current</span><span className={`${styles.wizardLabel} ${styles.wizardLabelActive}`}>Plan</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={styles.wizardDot}>3</span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 3</span><span className={styles.wizardLabel}>Checkout</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={styles.wizardDot}>4</span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 4</span><span className={styles.wizardLabel}>Deployment</span></span></div>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h2 className={styles.title}>Choose a Plan</h2>
          <p className={styles.subtitle}>
            Scale your intelligence with our precision-engineered computational tiers.
          </p>
        </section>

        <div className={styles.billingToggle}>
          <div className={styles.toggleInner}>
            <button className={styles.toggleActive} type="button">Monthly</button>
            <button className={styles.toggleInactive} type="button">Annual <span>Save 20%</span></button>
          </div>
        </div>

        <section className={styles.grid}>
          {plans.map(([name, price, features], index) => (
            <article className={`${styles.card} ${index === 1 ? styles.highlightCard : ""}`} key={name as string}>
              {index === 1 && <span className={styles.popularBadge}>Most Popular</span>}
              <h3 className={styles.cardTitle}>{name}</h3>
              <div><span className={styles.price}>{price}</span>{index > 0 && <span className={styles.priceSub}>/mo</span>}</div>
              <ul className={styles.list}>
                {(features as string[]).map((feature) => (
                  <li className={styles.listItem} key={feature}>
                    <CheckIcon size={16} color={colors.TextGradientOne} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`${styles.button} ${index === 0 ? styles.secondaryButton : index === 2 ? styles.borderButton : ""}`}
                onClick={() => navigate({ to: "/checkout_softtech_ai_refined" })}
                type="button"
              >
                Select Plan <RightArrowIcon size={16} color={index === 0 ? colors.TextOverlay : colors.TextOverlay} />
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Plans;
