import { CSSProperties, FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  HelpIcon,
  MoonIcon,
  RocketIcon,
  SparklesIcon,
} from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../flowTheme";

const hotels = [
  {
    name: "Pearl Continental Suites",
    price: "Rs. 4,850",
    rating: "4.8",
    bg: "linear-gradient(135deg, #d9c6a5, #8aa0b8 42%, #ece8df)",
  },
  {
    name: "Avari Executive Hub",
    price: "Rs. 4,200",
    rating: "4.5",
    bg: "linear-gradient(135deg, #2f241c, #b56b35 52%, #201713)",
  },
  {
    name: "Regent Plaza Oasis",
    price: "Rs. 3,900",
    rating: "4.2",
    bg: "linear-gradient(135deg, #111318, #4b4c4c 50%, #0c0d0f)",
  },
  {
    name: "Ramada Residency",
    price: "Rs. 4,999",
    rating: "",
    bg: "linear-gradient(135deg, #242436, #171723)",
  },
];

const McpSimulation: FC = () => {
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
          <div className={styles.wizardItem}>
            <span className={`${styles.wizardDot} ${styles.wizardDotActive}`}>1</span>
            <span className={styles.wizardCopy}>
              <span className={`${styles.wizardKicker} ${styles.wizardKickerActive}`}>
                Current
              </span>
              <span className={`${styles.wizardLabel} ${styles.wizardLabelActive}`}>
                MCP Test
              </span>
            </span>
          </div>
          <span className={styles.wizardLine} />
          {["Plan", "Checkout", "Deployment"].map((step, index) => (
            <div className={styles.wizardItem} key={step}>
              <span className={styles.wizardDot}>{index + 2}</span>
              <span className={styles.wizardCopy}>
                <span className={styles.wizardKicker}>Step {index + 2}</span>
                <span className={styles.wizardLabel}>{step}</span>
              </span>
              {index < 2 && <span className={styles.wizardLine} />}
            </div>
          ))}
          <div className={styles.wizardActions}>
            <HelpIcon size={20} color={colors.TextBody} />
            <MoonIcon size={20} color={colors.TextBody} />
          </div>
        </nav>
      </header>

      <main className={styles.mcpMain}>
        <section className={styles.mcpHero}>
          <div>
            <h2 className={styles.title}>MCP Simulation</h2>
            <p className={styles.subtitle} style={{ margin: 0, textAlign: "left" }}>
              Validate Model Context Protocol responses and ChatGPT widget
              rendering in a sandboxed environment.
            </p>
          </div>
          <div className={styles.mcpStatus}>
            <span className={styles.readyDot} />
            System Ready
          </div>
        </section>

        <section className={styles.mcpTopGrid}>
          <div className={styles.mcpPanel}>
            <h3 className={styles.cardTitle}>Test Prompt</h3>
            <div className={styles.promptBox}>
              e.g. &quot;Show me hotels in Karachi under 5000 PKR per night for 2 adults&quot;
              <span className={styles.contextLabel}>MCP Context</span>
            </div>
            <button
              className={styles.button}
              onClick={() => navigate({ to: "/plans_softtech_ai_updated" })}
              type="button"
            >
              <RocketIcon size={20} color={colors.TextOverlay} />
              Run Simulation
            </button>
          </div>

          <div className={styles.executionLog}>
            <div className={styles.logHeader}>
              <span>{"{}"} Execution Log</span>
              <span>v4.0.2-stable</span>
            </div>
            <div className={styles.logLines}>
              <span>[10:42:01] Initializing MCP Engine...</span>
              <span className={styles.logSuccess}>
                [10:42:02] SUCCESS: Connection established to SoftTech-AI-Core.
              </span>
              <span className={styles.logInfo}>
                [10:42:05] PARSING: User intent identified as [LOCATION_SEARCH].
              </span>
              <span className={styles.logWarn}>
                [10:42:06] WARN: Rate limit approaching (82% capacity).
              </span>
              <span>[10:42:08] Fetching hotel data for entity: Karachi...</span>
              <span className={styles.logError}>
                [10:42:10] ERROR: External API timeout on node [WH-556-01].
              </span>
            </div>
          </div>
        </section>

        <section className={styles.widgetPreview}>
          <div className={styles.widgetChrome}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div className={styles.trafficLights}>
                <span style={{ background: "#c94f65" }} />
                <span style={{ background: "#c98839" }} />
                <span style={{ background: colors.BrandEmerald }} />
              </div>
              <span style={{ color: colors.TextBody, fontWeight: 700 }}>
                ChatGPT Widget Preview
              </span>
            </div>
            <span style={{ color: colors.TextGradientOne, fontSize: 12, fontWeight: 800 }}>
              LIVE
            </span>
          </div>

          <div className={styles.previewBody}>
            <div style={{ textAlign: "center" }}>
              <h3 className={styles.cardTitle} style={{ fontSize: "1.8rem" }}>
                Found the best matches for you
              </h3>
              <p className={styles.cardText}>
                Based on your query for Karachi stays under 5000 PKR.
              </p>
            </div>
            <div className={styles.hotelGrid}>
              {hotels.map((hotel) => (
                <article className={styles.hotelCard} key={hotel.name}>
                  <div
                    className={styles.hotelImage}
                    style={{ "--hotel-bg": hotel.bg } as CSSProperties}
                  >
                    {hotel.rating && <span className={styles.rating}>* {hotel.rating}</span>}
                    {!hotel.rating && (
                      <SparklesIcon
                        size={34}
                        color={colors.FooterText}
                      />
                    )}
                  </div>
                  <div className={styles.hotelContent}>
                    <h4 className={styles.hotelName}>{hotel.name}</h4>
                    <div>
                      <span className={styles.hotelPrice}>{hotel.price}</span>{" "}
                      <span className={styles.hotelNight}>/ night</span>
                    </div>
                    <button className={styles.button} style={{ marginTop: "1.25rem", minHeight: "2.75rem" }} type="button">
                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default McpSimulation;
