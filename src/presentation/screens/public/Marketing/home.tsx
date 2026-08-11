import React, { useEffect, useRef } from "react";
import styles from "../../../../styles/home.module.css";
import { useHomeState, useHomeAnimation } from "../../../../hooks";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { Link } from "@tanstack/react-router";
import {
  pricingPlans,
  faqItems,
  industryTemplates,
} from "../../../../hooks/mockData";
import {
  CloseIcon,
  SparklesIcon,
  LockIcon,
  BoltIcon,
  LayoutGridIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ServerIcon,
} from "../../../../assets/icons";

const Homescreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { colors } = useThemeStore();

  const {
    isYearly,
    activeFaqIndex,
    showScrollToTop,
    toggleBillingCycle,
    toggleFaq,
    scrollToTop,
  } = useHomeState();

  // Run the GSAP animations hook
  useHomeAnimation({ containerRef, isYearly });

  return (
    <div ref={containerRef} className={styles.homeWrapper}>
      {/* 3. PINNED SCROLL STORY SECTION */}
      <div id="scroll-track" className={styles.scrollTrack}>
        <div id="pinned-section" className={styles.pinnedSection}>
          {/* Hero text */}
          <div id="hero-text" className={styles.heroText}>
            <div className={styles.badgePill}>
              <SparklesIcon size={14} color={colors.TextHighlightedHeading} />
              One month free for new signups!!
            </div>

            <h1 className={styles.heroHeading}>
              Publish your app to <br />
              <span
                className={`${styles.heroHeadingGradient} ${styles.wavyUnderline} ${styles.wavyWhite}`}
              >
                ChatGPT
              </span>{" "}
              in minutes.
            </h1>

            <p className={styles.heroSubheading}>
              Register your REST APIs and let SoftTech AI handle the logic.
              <br className="hidden md:block" />
              <span className={styles.heroSubheadingUnderline}>
                {" "}
                Zero code written by you.
              </span>
            </p>
          </div>

          {/* Step descriptions */}
          <div id="steps-container" className={styles.stepsContainer}>
            {/* Step 01 */}
            <div className="stepText">
              <div className={styles.stepBadge}>Step 01</div>
              <h2 className={styles.stepHeading}>
                <span
                  className={`${styles.wavyUnderline} ${styles.wavyIndigo}`}
                >
                  Register
                </span>
                <br />
                Endpoints.
              </h2>
              <p className={styles.stepDesc}>
                Input your API base URL and documentation path. We support
                Swagger, OpenAPI, and Postman collections automatically.
              </p>
            </div>

            {/* Step 02 */}
            <div className="stepText">
              <div className={styles.stepBadge}>Step 02</div>
              <h2 className={styles.stepHeading}>
                <span
                  className={`${styles.wavyUnderline} ${styles.wavyPurple}`}
                >
                  Auth
                </span>
                <br />
                Mapping.
              </h2>
              <p className={styles.stepDesc}>
                Configure OAuth 2.0, API Keys, or JWT. Our secure vault handles
                identity propagation and token refreshing automatically.
              </p>
            </div>

            {/* Step 03 */}
            <div className="stepText">
              <div className={styles.stepBadge}>Step 03</div>
              <h2 className={styles.stepHeading}>
                <span className={`${styles.wavyUnderline} ${styles.wavyBlue}`}>
                  Schema
                </span>
                <br />
                Mapping.
              </h2>
              <p className={styles.stepDesc}>
                Confirm your JSON response formatting. We map it to Model
                Context Protocol standards ready for GPT interpretation.
              </p>
            </div>

            {/* Step 04 */}
            <div className="stepText">
              <div className={styles.stepBadge}>Step 04</div>
              <h2 className={styles.stepHeading}>
                Native UI
                <br />
                <span
                  className={`${styles.wavyUnderline} ${styles.wavyEmerald}`}
                >
                  Widgets.
                </span>
              </h2>
              <p className={styles.stepDesc}>
                Render rich interactive cards, forms, and galleries directly
                within the conversation flow. Deep-link securely.
              </p>
            </div>

            {/* Step 05 / Launch */}
            <div className="stepText">
              <div className={styles.stepBadge}>Launch</div>
              <h2 className={styles.stepHeading}>
                One-Click
                <br />
                <span
                  className={`${styles.wavyUnderline} ${styles.wavyFuchsia}`}
                >
                  Deploy.
                </span>
              </h2>
              <p className={styles.stepDesc}>
                Instant publication to the OpenAI ecosystem. We handle the
                technical boilerplate, hosting, and scaling for you.
              </p>
              <Link to="/signup" className={styles.stepBtn}>
                Deploy Server Now
              </Link>
            </div>
          </div>

          {/* Floating tags */}
          <div className={styles.floatingTags}>
            {/* Tag 1 */}
            <div className={`${styles.tagTl} floatingTag`}>
              <div className={styles.floatingTagDot}></div>
              REST API
            </div>
            {/* Tag 2 */}
            <div className={`${styles.tagTr} floatingTag`}>
              <SparklesIcon size={14} color={colors.ButtonGradientOne} />
              Zero Code
            </div>
            {/* Tag 3 */}
            <div className={`${styles.tagBc} floatingTag`}>
              <div className={styles.floatingTagDot}></div>
              MCP Server Ready
            </div>
          </div>

          {/* Interactive Cards Container */}
          <div id="card-container" className={styles.cardContainer}>
            {/* Card 1: Register API Endpoint UI Style */}
            <div className={`cardItem ${styles.cardRegisterForm}`}>
              <div className={styles.cardHeader}>
                <div className={styles.dots}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
                <span className={styles.cardTitle}>Register API Endpoint</span>
              </div>
              <div className={styles.formBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>API Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value="E-Commerce API"
                    disabled
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Base URL</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value="https://api.saas.com/v1"
                    disabled
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Swagger / OpenAPI Spec
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value="https://api.saas.com/swagger.json"
                    disabled
                  />
                </div>
                <button className={styles.formBtn} disabled>
                  Register Endpoint
                </button>
              </div>
            </div>

            {/* Card 2: Security */}
            <div className={`cardItem ${styles.cardVault}`}>
              <div className={styles.vaultBlurGlow}></div>
              <div className={styles.vaultIconCircle}>
                <LockIcon size={40} color={colors.ButtonGradientTwo} />
              </div>
              <h4 className={styles.vaultHeading}>
                Zero-Trust
                <br />
                Vault
              </h4>
              <p className={styles.vaultDesc}>
                Automated token refresh and isolated credential storage.
              </p>
            </div>

            {/* Card 3: Core Translation Engine */}
            <div className={`cardItem ${styles.cardEngine}`}>
              <div className={styles.engineGlow}></div>
              <div className={styles.engineIconSquare}>
                <BoltIcon size={40} color={colors.TextOverlay} />
              </div>
              <h3 className={styles.engineHeading}>SoftTech AI</h3>
              <p className={styles.engineDesc}>
                Standard REST mapped dynamically into MCP context automatically.
              </p>
            </div>

            {/* Card 4: Interactive Widgets */}
            <div className={`cardItem ${styles.cardWidgets}`}>
              <div className={styles.widgetHeader}>
                <LayoutGridIcon size={20} color={colors.RatingIconColor} />
                <span className={styles.widgetHeaderTitle}>
                  Native UI Rendering
                </span>
              </div>
              <div className={styles.widgetCanvas}>
                <div className={styles.msgRow}>
                  <div className={styles.msgAvatar}></div>
                  <div className={styles.msgBubble}>
                    <div className={styles.bubbleLineFull}></div>
                    <div className={styles.bubbleLinePartial}></div>
                  </div>
                </div>
                <div className={styles.interactiveBox}>
                  <div className={styles.widgetProductInfo}>
                    <div className={styles.productThumb}></div>
                    <div className={styles.productTextGroup}>
                      <div className={styles.productTitleLine}></div>
                      <div className={styles.productStatusLine}></div>
                    </div>
                  </div>
                  <button className={styles.widgetBtn}>Checkout Process</button>
                </div>
              </div>
            </div>

            {/* Card 5: Live Status */}
            <div className={`cardItem ${styles.cardLive}`}>
              <div className={styles.liveHeader}>
                <div className={styles.liveIndicatorGroup}>
                  <span className={styles.liveDotWrapper}>
                    <span className={styles.liveDotPing}></span>
                    <span className={styles.liveDot}></span>
                  </span>
                  <span className={styles.liveHeaderText}>Live in ChatGPT</span>
                </div>
                <span className={styles.liveHeaderVersion}>
                  MCP Server v1.0
                </span>
              </div>
              <div className={styles.liveCanvas}>
                <div className={styles.liveGrid}>
                  <div className={styles.liveItemRow}>
                    <span className={styles.liveLabel}>Endpoint URL</span>
                    <span className={styles.liveVal}>saas.softtech.ai</span>
                  </div>
                  <div className={styles.liveDoubleGrid}>
                    <div className={styles.liveGridBox}>
                      <span className={styles.liveBoxLabel}>Gateway</span>
                      <span className={styles.liveBoxValGreen}>CONNECTED</span>
                    </div>
                    <div className={styles.liveGridBox}>
                      <span className={styles.liveBoxLabel}>Active Tools</span>
                      <span className={styles.liveBoxValWhite}>
                        12 Published
                      </span>
                    </div>
                  </div>
                  <Link to="/signup" className={styles.liveDeployBtn}>
                    Deploy Server Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPANY LOGO TICKER SECTION */}
      <section className={styles.logoTickerSection}>
        <div className={styles.tickerHeader}>
          <p className={styles.tickerTitle}>
            Trusted by fast-growing engineering teams
          </p>
        </div>

        <div className={styles.tickerWrapper}>
          <div className={styles.logoOverlayLeft}></div>
          <div className={styles.logoOverlayRight}></div>

          <div className={styles.logoTickerTrack}>
            {/* Set 1 */}
            <div className={styles.logoTickerGroup}>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextHighlightedHeading }}
                ></span>
                OpenAI
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.ButtonGradientOne }}
                ></span>
                Stripe
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.HeaderItemActiveColor }}
                ></span>
                Slack
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.RatingIconColor }}
                ></span>
                Github
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextGradientThree }}
                ></span>
                Twilio
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextGradientTwo }}
                ></span>
                HubSpot
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextGradientOne }}
                ></span>
                Shopify
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.AuthIconColor }}
                ></span>
                Salesforce
              </span>
            </div>
            {/* Set 2 */}
            <div className={styles.logoTickerGroup}>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextHighlightedHeading }}
                ></span>
                OpenAI
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.ButtonGradientOne }}
                ></span>
                Stripe
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.HeaderItemActiveColor }}
                ></span>
                Slack
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.RatingIconColor }}
                ></span>
                Github
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextGradientThree }}
                ></span>
                Twilio
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextGradientTwo }}
                ></span>
                HubSpot
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.TextGradientOne }}
                ></span>
                Shopify
              </span>
              <span className={styles.tickerItem}>
                <span
                  className={styles.tickerBullet}
                  style={{ backgroundColor: colors.AuthIconColor }}
                ></span>
                Salesforce
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLATFORM FEATURES GRID SECTION */}
      <section id="features-section" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>
            Powerful Platform Features
          </span>
          <h2 className={styles.sectionHeading}>
            Everything you need to build production-grade ChatGPT integrations
          </h2>
          <p className={styles.sectionDesc}>
            Convert existing REST documentation into fully-functional Model
            Context Protocol schemas automatically, without managing
            infrastructure.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Card 1 */}
          <div className="featureCard">
            <div className={`${styles.featureIconCircle} ${styles.iconIndigo}`}>
              <ServerIcon size={24} color={colors.TextHighlightedHeading} />
            </div>
            <h3 className={styles.featureTitle}>Automatic MCP</h3>
            <p className={styles.featureDesc}>
              Convert existing REST documentation into fully-functional Model
              Context Protocol schemas automatically.
            </p>
          </div>

          {/* Card 2 */}
          <div className="featureCard">
            <div className={`${styles.featureIconCircle} ${styles.iconPurple}`}>
              <LockIcon size={24} color={colors.ButtonGradientTwo} />
            </div>
            <h3 className={styles.featureTitle}>Enterprise Security</h3>
            <p className={styles.featureDesc}>
              Full support for OAuth2, Vaulted API keys, and strict request
              validation to ensure data privacy.
            </p>
          </div>

          {/* Card 3 */}
          <div className="featureCard">
            <div
              className={`${styles.featureIconCircle} ${styles.iconEmerald}`}
            >
              <BoltIcon size={24} color={colors.RatingIconColor} />
            </div>
            <h3 className={styles.featureTitle}>Edge Deployed</h3>
            <p className={styles.featureDesc}>
              Your servers are deployed to our global edge network ensuring
              sub-50ms latency globally.
            </p>
          </div>
        </div>
      </section>

      {/* 6. TEMPLATES SECTION (STICKY STACKING CARDS) */}
      <section id="industry-stack-section" className={styles.industrySection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Ready-to-run Templates</span>
          <h2 className={styles.sectionHeading}>Built for every industry</h2>
          <p className={styles.sectionDesc}>
            Kickstart your deployment with templates tailormade for standard
            business operations.
          </p>
        </div>

        <div className={styles.industryStackTrack}>
          {industryTemplates.map((template) => {
            const isEcommerce = template.id === "ecommerce";
            const isFintech = template.id === "fintech";
            const isHealthcare = template.id === "healthcare";
            const isTravel = template.id === "travel";

            let themeClass = styles.indigoTheme;
            if (isFintech) themeClass = styles.emeraldTheme;
            if (isHealthcare) themeClass = styles.blueTheme;
            if (isTravel) themeClass = styles.fuchsiaTheme;

            return (
              <div
                key={template.id}
                className={`industryStackCard ${themeClass}`}
              >
                <div
                  className={styles.cardBgImage}
                  style={{ backgroundImage: `url(${template.bgImage})` }}
                ></div>
                <div className={styles.cardBgGradient}></div>

                <div className={styles.cardContent}>
                  <div className={styles.cardTextContent}>
                    <span className={styles.cardCategory}>
                      {template.category}
                    </span>
                    <h3 className={styles.cardTitleStack}>{template.title}</h3>
                    <p className={styles.cardDesc}>{template.description}</p>

                    <div className={styles.cardTags}>
                      {template.tags.map((tag) => (
                        <span key={tag} className={styles.cardTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Template custom mockup layouts */}
                  <div className={styles.templateMockup}>
                    <div>
                      <div className={styles.mockupHeader}>
                        <span className={styles.mockupTitle}>
                          {template.widgetName}
                        </span>
                        <span className={styles.mockupStatus}>
                          {template.widgetStatus}
                        </span>
                      </div>

                      {/* E-Commerce Widget Mockup */}
                      {isEcommerce && (
                        <div style={{ marginTop: "1rem" }}>
                          <div className={styles.mockupRow}>
                            <span className={styles.mockupText}>
                              Cyber Jacket v2
                            </span>
                            <span className={styles.mockupVal}>$129.00</span>
                          </div>
                          <div
                            className={styles.mockupRow}
                            style={{ opacity: 0.6 }}
                          >
                            <span className={styles.mockupText}>
                              Tax & Shipping
                            </span>
                            <span className={styles.mockupVal}>$12.50</span>
                          </div>
                        </div>
                      )}

                      {/* Fintech Widget Mockup */}
                      {isFintech && (
                        <div style={{ marginTop: "1rem" }}>
                          <div
                            className={styles.mockupRow}
                            style={{ alignItems: "baseline" }}
                          >
                            <span
                              className={styles.mockupVal}
                              style={{ fontSize: "1.75rem", fontWeight: 900 }}
                            >
                              $14,250
                            </span>
                            <span
                              style={{
                                color: colors.SuccessBadgeText,
                                fontSize: "0.625rem",
                                fontWeight: 700,
                              }}
                            >
                              +18.5%
                            </span>
                          </div>
                          <span
                            className={styles.mockupText}
                            style={{ fontSize: "0.625rem", display: "block" }}
                          >
                            Monthly Billing Revenue
                          </span>
                          {/* Mini Bar graph */}
                          <div
                            style={{
                              display: "flex",
                              gap: "0.25rem",
                              alignItems: "end",
                              height: "3.5rem",
                              marginTop: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                height: "30%",
                                width: "100%",
                                backgroundColor: colors.BackgroundGradientTwo,
                                borderRadius: "2px",
                              }}
                            ></div>
                            <div
                              style={{
                                height: "45%",
                                width: "100%",
                                backgroundColor: colors.BrandFuchsia,
                                borderRadius: "2px",
                              }}
                            ></div>
                            <div
                              style={{
                                height: "60%",
                                width: "100%",
                                backgroundColor: colors.BrandEmerald,
                                borderRadius: "2px",
                              }}
                            ></div>
                            <div
                              style={{
                                height: "80%",
                                width: "100%",
                                backgroundColor: colors.BrandIndigo,
                                borderRadius: "2px",
                              }}
                            ></div>
                            <div
                              style={{
                                height: "100%",
                                width: "100%",
                                backgroundColor: colors.BrandIndigoHover,
                                borderRadius: "2px",
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Healthcare Scheduler Mockup */}
                      {isHealthcare && (
                        <div style={{ marginTop: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.75rem",
                              alignItems: "center",
                            }}
                          >
                            <div className={styles.ehrIconCircle}>DR</div>
                            <div>
                              <h4
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: colors.TextHeading,
                                }}
                              >
                                Dr. Evelyn Reed
                              </h4>
                              <span
                                className={styles.mockupText}
                                style={{ fontSize: "0.625rem" }}
                              >
                                Neurology Clinic
                              </span>
                            </div>
                          </div>
                          <div className={styles.calendarGrid}>
                            <div className={styles.calendarCellActive}>
                              09:00 AM
                            </div>
                            <div className={styles.calendarCell}>10:30 AM</div>
                            <div className={styles.calendarCell}>01:00 PM</div>
                            <div className={styles.calendarCell}>03:30 PM</div>
                          </div>
                        </div>
                      )}

                      {/* Travel Booking Mockup */}
                      {isTravel && (
                        <div style={{ marginTop: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: "1.125rem",
                                  fontWeight: 900,
                                  color: colors.TextHeading,
                                }}
                              >
                                JFK
                              </span>
                              <span
                                className={styles.mockupText}
                                style={{
                                  fontSize: "0.5625rem",
                                  display: "block",
                                }}
                              >
                                New York
                              </span>
                            </div>
                            <div className={styles.flightLineWrapper}>
                              <span
                                style={{
                                  color: colors.SuccessBadgeText,
                                  fontSize: "0.5625rem",
                                  fontWeight: 700,
                                }}
                              >
                                5h 45m
                              </span>
                              <div className={styles.flightLine}>
                                <div className={styles.flightPlaneDot}></div>
                              </div>
                              <span
                                className={styles.mockupText}
                                style={{ fontSize: "0.5rem" }}
                              >
                                Direct Flight
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  fontSize: "1.125rem",
                                  fontWeight: 900,
                                  color: colors.TextHeading,
                                }}
                              >
                                LHR
                              </span>
                              <span
                                className={styles.mockupText}
                                style={{
                                  fontSize: "0.5625rem",
                                  display: "block",
                                }}
                              >
                                London
                              </span>
                            </div>
                          </div>
                          <div className={styles.flightLogo}>
                            <span style={{ color: colors.TextBody }}>
                              Virgin Atlantic - VS4
                            </span>
                            <span
                              style={{
                                color: colors.TextHeading,
                                fontWeight: 700,
                              }}
                            >
                              $410
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.mockupFooter}>
                      <div className={styles.mockupLine}></div>
                      {isFintech ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className={styles.mockupBtn}
                            style={{
                              width: "50%",
                              backgroundColor: colors.ButtonOverlaySecondary,
                              border: `1px solid ${colors.Border}`,
                              color: colors.TextHeading,
                            }}
                          >
                            Export CSV
                          </button>
                          <button
                            className={styles.mockupBtn}
                            style={{
                              width: "50%",
                              backgroundColor: colors.ButtonGradientTwo,
                              border: `1px solid ${colors.Border}`,
                              color: colors.TextOverlay,
                            }}
                          >
                            Manage billing
                          </button>
                        </div>
                      ) : (
                        <button className={styles.mockupBtn}>
                          {isEcommerce && "Pay with SoftTech AI"}
                          {isHealthcare && "Confirm Appointment"}
                          {isTravel && "Book Flight Ticket"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. PRICING CYCLE TOGGLE & GRID SECTION */}
      <section id="pricing-section" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Fair & Transparent</span>
          <h2 className={styles.sectionHeading}>Simple, Scalable Pricing</h2>
          <p className={styles.sectionDesc}>
            Choose the perfect plan to get your REST APIs running in ChatGPT.
          </p>
        </div>

        {/* Pricing billing toggle */}
        <div className={styles.billingToggleWrapper}>
          <div className={styles.billingToggleContainer}>
            <button
              id="toggle-monthly"
              className={`${styles.billingToggleBtn} ${!isYearly ? styles.billingToggleActive : ""}`}
              onClick={toggleBillingCycle}
            >
              Monthly
            </button>
            <button
              id="toggle-yearly"
              className={`${styles.billingToggleBtn} ${isYearly ? styles.billingToggleActive : ""}`}
              onClick={toggleBillingCycle}
            >
              Yearly
              <span className={styles.saveBadge}>Save 20%</span>
            </button>
            {/* Slide animated overlay background pill */}
            <div
              id="pricing-toggle-slider"
              className={styles.pricingToggleSlider}
            ></div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className={styles.pricingGrid}>
          {pricingPlans.map((plan) => {
            const isPro = plan.name === "Pro";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`${isPro ? styles.pricingCardPro : ""} pricingCard`}
              >
                {isPro && (
                  <div className={styles.popularBadge}>Most Popular</div>
                )}

                <div>
                  <h3
                    className={styles.planName}
                    style={{ marginTop: isPro ? "0.5rem" : "0" }}
                  >
                    {plan.name}
                  </h3>
                  <p className={styles.planDesc}>{plan.description}</p>

                  <div className={styles.planPriceWrapper}>
                    {plan.isCustomPrice ? (
                      <span
                        className={styles.planPrice}
                        style={{ fontSize: "2.25rem" }}
                      >
                        Custom
                      </span>
                    ) : (
                      <>
                        <span className={styles.planPrice}>${price}</span>
                        <span className={styles.planPeriod}>/ month</span>
                      </>
                    )}
                  </div>

                  <div className={styles.pricingDivider}></div>

                  <ul className={styles.planFeatures}>
                    {plan.features.map((feature) => (
                      <li key={feature} className={styles.featureItem}>
                        <span className={styles.featureCheck}>
                          <CheckIcon size={16} color={colors.HeaderIconColor} />
                        </span>
                        {feature}
                      </li>
                    ))}
                    {plan.unsupportedFeatures?.map((feature) => (
                      <li
                        key={feature}
                        className={`${styles.featureItem} ${styles.featureDisabled}`}
                      >
                        <span className={styles.featureCross}>
                          <CloseIcon size={16} color={colors.HeaderIconColor} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/signup"
                  className={isPro ? styles.pricingBtnPro : styles.pricingBtn}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  {plan.ctaText}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS SECTION */}
      <section id="faq-section" className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <span
            className={styles.sectionLabel}
            style={{ color: colors.TextHighlightedHeading }}
          >
            Have Questions?
          </span>
          <h2 className={styles.sectionHeading}>Frequently Asked Questions</h2>
          <p className={styles.sectionDesc}>
            Everything you need to know about setting up and running SoftTech
            AI.
          </p>
        </div>

        <div className={styles.faqContainer}>
          {faqItems.map((item, index) => {
            const isActive = activeFaqIndex === index;

            return (
              <div
                key={index}
                className={`${isActive ? styles.faqItemActive : ""} faqItem`}
              >
                <button
                  className={styles.faqTrigger}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isActive}
                >
                  <span className={styles.faqQuestion}>{item.question}</span>
                  <span
                    className={`${styles.faqChevron} ${isActive ? styles.faqChevronActive : ""}`}
                  >
                    <ChevronDownIcon size={20} color={colors.HeaderIconColor} />
                  </span>
                </button>
                <div
                  className={styles.faqAnswerWrapper}
                  style={{ maxHeight: isActive ? "300px" : "0px" }}
                >
                  <div className={styles.faqAnswer}>{item.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. CTA SECTION */}
      <section id="cta-section" className={styles.ctaSection}>
        <div className={styles.ctaGlowRight}></div>

        <div className={styles.ctaContainer}>
          <div id="cta-block" className={styles.ctaBlock}>
            <div className={styles.ctaIconCircle}>
              <BoltIcon size={40} color={colors.TextHighlightedHeading} />
            </div>

            <h2 className={styles.ctaHeading}>
              Your app, inside ChatGPT.
              <br className="hidden md:block" />
              In <span className={styles.ctaHeadingGradient}>5 minutes.</span>
            </h2>

            <p className={styles.ctaDesc}>
              Deploy your secure OpenAI App SDK ready server at edge latency
              today. Zero maintenance, zero configuration.
            </p>

            <div className={styles.ctaActions}>
              <Link to="/signup" className={styles.ctaPrimaryBtn}>
                Deploy Server Now
              </Link>
              <a href="#" className={styles.ctaSecondaryBtn}>
                Read Documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 10. SCROLL TO TOP BUTTON */}
      <button
        id="scroll-to-top"
        className={`${styles.scrollToTopBtn} ${showScrollToTop ? styles.scrollToTopBtnVisible : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to Top"
      >
        <ChevronUpIcon size={20} color={colors.TextOverlay} />
      </button>
    </div>
  );
};

export default Homescreen;
