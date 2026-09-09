import React, { FC, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore } from "../../../../hooks";
import {
  useSignupStore,
  parseJsonToRows,
} from "../../../../infrastructure/store/signupStore";
import {
  stepTwoSchema,
  authStrategySchema,
} from "../../../../infrastructure/validation/signupSchemas";
import {
  TrashIcon,
  SlidersIcon,
  ServerIcon,
  KeyIcon,
  LockIcon,
  Plus,
  LeftArrowIcon,
  SparklesIcon,
  BoltIcon,
  CheckIcon,
  ChevronDownIcon,
  ShieldLockIcon,
  HelpIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import styles from "../../../../styles/signup.module.css";
import { PostmanTableEditor } from "../../../components/auth/PostmanTableEditor";
import { ApiImportModal } from "../../../components/auth/ApiImportModal";

const getMethodBadgeStyle = (
  method: string,
  colors: Record<string, string>,
) => {
  switch (method) {
    case "GET":
      return {
        bg: colors.MethodGetBg,
        text: colors.MethodGetText,
        border: colors.MethodGetBorder,
      };
    case "POST":
      return {
        bg: colors.MethodPostBg,
        text: colors.MethodPostText,
        border: colors.MethodPostBorder,
      };
    case "PUT":
      return {
        bg: colors.MethodPutBg,
        text: colors.MethodPutText,
        border: colors.MethodPutBorder,
      };
    case "PATCH":
      return {
        bg: colors.MethodPatchBg,
        text: colors.MethodPatchText,
        border: colors.MethodPatchBorder,
      };
    case "DELETE":
      return {
        bg: colors.MethodDeleteBg,
        text: colors.MethodDeleteText,
        border: colors.MethodDeleteBorder,
      };
    default:
      return {
        bg: colors.MethodGetBg,
        text: colors.MethodGetText,
        border: colors.MethodGetBorder,
      };
  }
};

const SignupStep2: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const {
    companyId,
    apisList,
    updateApiField,
    handleAddApi,
    handleDeleteApi,
    isStepTwoPending,
    handleStepTwoSubmit,
    handleEndpointUrlChange,
    handleDeleteAllApis,
    importApisBatch,
    stepOneData,
    authStrategy,
    setAuthStrategy,
  } = useSignupStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [hasChosenManual, setHasChosenManual] = useState(false);

  const isInitialEmpty =
    apisList.length === 1 &&
    (!apisList[0].apiName || !apisList[0].apiName.trim()) &&
    (!apisList[0].apiEndpoint ||
      apisList[0].apiEndpoint === "https://" ||
      apisList[0].apiEndpoint.trim() === "");

  React.useEffect(() => {
    if (!companyId) {
      showToast("Please complete Step 1 first.", "warning");
      navigate({ to: "/signup/step1" });
    }
  }, [companyId, navigate]);

  const [activeTabs, setActiveTabs] = useState<
    Record<string, "params" | "headers" | "body">
  >({});
  const [showHelpGuide, setShowHelpGuide] = useState<Record<string, boolean>>(
    {},
  );
  const [collapsedApiIds, setCollapsedApiIds] = useState<Set<string>>(new Set());

  const toggleCollapseApi = (id: string) => {
    setCollapsedApiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const industryStr = (stepOneData?.primaryIndustry || "").toLowerCase();

  const isBookingIndustry = Boolean(
    [
      "booking",
      "rental",
      "car rental",
      "vehicle rental",
      "hotel",
      "hospitality",
      "automotive",
      "travel",
      "reservation",
      "appointments",
      "events",
      "flight",
      "airline",
      "tour",
      "rideshare",
    ].some((ind) => industryStr.includes(ind)),
  );

  const isShopOrProductIndustry = Boolean(
    [
      "ecommerce",
      "e-commerce",
      "retail",
      "shopping",
      "buying",
      "shop",
      "store",
      "marketplace",
      "fashion",
      "clothing",
      "apparel",
      "courses",
      "course",
      "education",
      "learning",
      "booking",
      "rental",
      "car rental",
      "automotive",
      "restaurant",
      "food",
      "products",
      "digital goods",
      "electronics",
    ].some((ind) => industryStr.includes(ind)),
  );

  const getActiveTab = (apiId: string): "params" | "headers" | "body" => {
    return activeTabs[apiId] || "params";
  };

  const setActiveTabForApi = (
    apiId: string,
    tab: "params" | "headers" | "body",
  ) => {
    setActiveTabs((prev) => ({ ...prev, [apiId]: tab }));
  };

  const getButtonText = () => {
    if (isStepTwoPending) return "Saving...";
    return "Continue to UI Preferences";
  };

  const handleStepTwoSubmitWithValidation = () => {
    // Validate Auth Strategy
    const authResult = authStrategySchema.safeParse(
      authStrategy || { strategyType: "none" },
    );
    if (!authResult.success) {
      const errorMsg =
        authResult.error.issues[0]?.message ||
        "Please complete authentication strategy fields.";
      showToast(errorMsg, "warning");
      return;
    }

    // Validate APIs List
    const result = stepTwoSchema.safeParse(apisList);
    if (!result.success) {
      const errorMsg =
        result.error.issues[0]?.message || "Please fix API validation errors.";
      showToast(errorMsg, "warning");
      return;
    }

    handleStepTwoSubmit(navigate);
  };

  return (
    <motion.div
      key="signup-step-2"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      className={styles.step2Wrapper}
    >
      <div
        className={styles.signupcard}
        style={{
          background: colors.Headerbackground,
          border: `1px solid ${colors.CardBorder}`,
          borderRadius: "16px",
          boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
        }}
      >
        {/* Header Title & Actions */}
        <div className={styles.step2HeaderContainer}>
          <div className={styles.step2HeaderTextCol}>
            <h2
              className={styles.headerTitle}
              style={{ color: colors.TextHeading }}
            >
              API Configuration
            </h2>
            <p className={styles.headerDesc} style={{ color: colors.TextBody }}>
              Define how your backend communicates with your services. Specify
              endpoints, configure authentication, or import all routes in
              1-click via OpenAPI / Postman.
            </p>
          </div>

          <div className={styles.step2HeaderActions}>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className={styles.step2HeaderImportBtn}
              style={{
                background: `linear-gradient(120deg, ${colors.ButtonGradientOne || "#6366f1"}, ${colors.ButtonGradientTwo || "#8b5cf6"})`,
              }}
            >
              <SparklesIcon size={15} color="#ffffff" />
              <span>1-Click Import (Swagger / Postman)</span>
            </button>

            {apisList.length > 0 && !isInitialEmpty && (
              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete all API connections? This will clear all endpoints from local storage and the database.",
                    )
                  ) {
                    await handleDeleteAllApis();
                    setHasChosenManual(false);
                  }
                }}
                className={styles.step2HeaderDeleteAllBtn}
                title="Delete all API connections"
              >
                <TrashIcon size={13} color="currentColor" />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Authentication Strategy & Gateways */}
        <div
          className={styles.apiBlock}
          style={{
            background: colors.Background,
            border: `1px solid ${colors.CardBorder}`,
            marginBottom: "1.5rem",
          }}
        >
          <div
            className={styles.apiBlockHeader}
            style={{
              borderBottom: `1px solid ${colors.CardBorder}`,
              background: "rgba(99, 102, 241, 0.04)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldLockIcon size={16} color={colors.BrandIndigo} />
              </div>
              <div>
                <span
                  className={styles.apiBlockTitle}
                  style={{
                    color: colors.TextHighlightedHeading,
                    fontSize: "0.9375rem",
                  }}
                >
                  Global Authentication Strategy
                </span>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: colors.TextBody,
                    marginTop: "0.125rem",
                  }}
                >
                  Configure how ChatGPT, AI agents, and SoftTech AI authenticate
                  with your backend APIs.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.apiBlockBody} style={{ gap: "1rem" }}>
            {/* Strategy Type Selector */}
            <div>
              <label
                className={styles.fieldLabel}
                style={{ color: colors.TextBody, marginBottom: "0.5rem" }}
              >
                Authentication Strategy{" "}
                <span style={{ color: colors.WarningText }}>*</span>
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.625rem",
                }}
              >
                {[
                  {
                    type: "none" as const,
                    title: "No Auth / Public",
                    desc: "Open public endpoints",
                    icon: SparklesIcon,
                  },
                  {
                    type: "api_key" as const,
                    title: "API Key",
                    desc: "Header / Query Key",
                    icon: KeyIcon,
                  },
                  {
                    type: "custom_header" as const,
                    title: "Custom Header",
                    desc: "Static auth token",
                    icon: LockIcon,
                  },
                  {
                    type: "oauth2" as const,
                    title: "User OAuth 2.0",
                    desc: "OpenAI ChatGPT Standard",
                    icon: ShieldLockIcon,
                  },
                ].map((strat) => {
                  const isSelected =
                    (authStrategy?.strategyType || "none") === strat.type;
                  const IconComp = strat.icon;
                  return (
                    <button
                      key={strat.type}
                      type="button"
                      onClick={() =>
                        setAuthStrategy({ strategyType: strat.type })
                      }
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        padding: "0.75rem 0.875rem",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        textAlign: "left",
                        background: isSelected
                          ? "rgba(99, 102, 241, 0.12)"
                          : colors.BackgroundSecondary,
                        border: `1px solid ${isSelected ? colors.CardActiveBorder : colors.CardBorder}`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          width: "100%",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <IconComp
                          size={15}
                          color={
                            isSelected ? colors.BrandIndigo : colors.IconColor
                          }
                        />
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            color: isSelected
                              ? colors.TextHeading
                              : colors.TextBody,
                          }}
                        >
                          {strat.title}
                        </span>
                        {isSelected && (
                          <span style={{ marginLeft: "auto" }}>
                            <CheckIcon size={14} color={colors.BrandIndigo} />
                          </span>
                        )}
                      </div>
                      <span
                        style={{ fontSize: "0.7rem", color: colors.TextBody }}
                      >
                        {strat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Strategy Specific Configs */}
            {(authStrategy?.strategyType || "none") === "api_key" && (
              <div className={styles.authInputGrid}>
                <div>
                  <label
                    className={styles.fieldLabel}
                    style={{ color: colors.TextBody }}
                  >
                    Header / Parameter Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. X-API-Key or Authorization"
                    value={authStrategy.authHeader || ""}
                    onChange={(e) =>
                      setAuthStrategy({ authHeader: e.target.value })
                    }
                    className={styles.urlInput}
                    style={{
                      background: colors.BackgroundSecondary,
                      border: `1px solid ${colors.CardBorder}`,
                      borderRadius: "0.5rem",
                      color: colors.TextHeading,
                      padding: "0.5rem 0.75rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    className={styles.fieldLabel}
                    style={{ color: colors.TextBody }}
                  >
                    API Key Value
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API Key secret"
                    value={authStrategy.apiKey || ""}
                    onChange={(e) =>
                      setAuthStrategy({ apiKey: e.target.value })
                    }
                    className={styles.urlInput}
                    style={{
                      background: colors.BackgroundSecondary,
                      border: `1px solid ${colors.CardBorder}`,
                      borderRadius: "0.5rem",
                      color: colors.TextHeading,
                      padding: "0.5rem 0.75rem",
                    }}
                  />
                </div>
              </div>
            )}

            {authStrategy?.strategyType === "custom_header" && (
              <div className={styles.authInputGrid}>
                <div>
                  <label
                    className={styles.fieldLabel}
                    style={{ color: colors.TextBody }}
                  >
                    Custom Header Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. X-Organization-Id or X-Auth-Token"
                    value={authStrategy.authHeader || ""}
                    onChange={(e) =>
                      setAuthStrategy({ authHeader: e.target.value })
                    }
                    className={styles.urlInput}
                    style={{
                      background: colors.BackgroundSecondary,
                      border: `1px solid ${colors.CardBorder}`,
                      borderRadius: "0.5rem",
                      color: colors.TextHeading,
                      padding: "0.5rem 0.75rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    className={styles.fieldLabel}
                    style={{ color: colors.TextBody }}
                  >
                    Header Value
                  </label>
                  <input
                    type="password"
                    placeholder="Enter custom header token"
                    value={authStrategy.apiKey || ""}
                    onChange={(e) =>
                      setAuthStrategy({ apiKey: e.target.value })
                    }
                    className={styles.urlInput}
                    style={{
                      background: colors.BackgroundSecondary,
                      border: `1px solid ${colors.CardBorder}`,
                      borderRadius: "0.5rem",
                      color: colors.TextHeading,
                      padding: "0.5rem 0.75rem",
                    }}
                  />
                </div>
              </div>
            )}

            {authStrategy?.strategyType === "oauth2" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                }}
              >
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: `1px solid ${colors.CardActiveBorder}`,
                    color: colors.TextHeading,
                    fontSize: "0.8125rem",
                    lineHeight: 1.4,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <SparklesIcon size={16} color={colors.BrandIndigo} />
                  <div>
                    <strong>
                      OpenAI ChatGPT OAuth Discovery Compliant (RFC 9728)
                    </strong>
                    <p
                      style={{
                        margin: "0.25rem 0 0 0",
                        color: colors.TextBody,
                        fontSize: "0.75rem",
                      }}
                    >
                      SoftTech AI automatically hosts Protected Resource
                      Metadata at{" "}
                      <code>/.well-known/oauth-protected-resource</code>. When
                      users interact with protected tools, ChatGPT prompts them
                      to log in via your website and dynamically forwards their
                      authenticated Bearer token.
                    </p>
                  </div>
                </div>

                <div className={styles.authInputGrid}>
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      Authorization Server URL{" "}
                      <span style={{ color: colors.WarningText }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://carrentalprostudio.com"
                      value={authStrategy.authorizationServer || ""}
                      onChange={(e) =>
                        setAuthStrategy({ authorizationServer: e.target.value })
                      }
                      className={styles.urlInput}
                      style={{
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "0.5rem",
                        color: colors.TextHeading,
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      OAuth Client ID{" "}
                      <span style={{ color: colors.WarningText }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. chatgpt-connector or carrental-app"
                      value={authStrategy.clientId || ""}
                      onChange={(e) =>
                        setAuthStrategy({ clientId: e.target.value })
                      }
                      className={styles.urlInput}
                      style={{
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "0.5rem",
                        color: colors.TextHeading,
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.authInputGrid}>
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      Authorization / Login URL{" "}
                      <span style={{ color: colors.WarningText }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://carrentalprostudio.com/oauth/authorize"
                      value={authStrategy.authorizationEndpoint || ""}
                      onChange={(e) =>
                        setAuthStrategy({
                          authorizationEndpoint: e.target.value,
                        })
                      }
                      className={styles.urlInput}
                      style={{
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "0.5rem",
                        color: colors.TextHeading,
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      Token Endpoint URL{" "}
                      <span style={{ color: colors.WarningText }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://carrentalprostudio.com/api/oauth/token"
                      value={authStrategy.tokenEndpoint || ""}
                      onChange={(e) =>
                        setAuthStrategy({ tokenEndpoint: e.target.value })
                      }
                      className={styles.urlInput}
                      style={{
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "0.5rem",
                        color: colors.TextHeading,
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.authInputGrid}>
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      OAuth Client Secret (Optional / PKCE)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for public PKCE clients"
                      value={authStrategy.clientSecret || ""}
                      onChange={(e) =>
                        setAuthStrategy({ clientSecret: e.target.value })
                      }
                      className={styles.urlInput}
                      style={{
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "0.5rem",
                        color: colors.TextHeading,
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      Supported Scopes (Comma or space separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. read, write, booking"
                      value={
                        Array.isArray(authStrategy.scopes)
                          ? authStrategy.scopes.join(", ")
                          : ""
                      }
                      onChange={(e) =>
                        setAuthStrategy({
                          scopes: e.target.value
                            .split(/[\s,]+/)
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className={styles.urlInput}
                      style={{
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "0.5rem",
                        color: colors.TextHeading,
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Global Integration & Streaming Options */}
            <div
              style={{
                marginTop: "0.875rem",
                paddingTop: "0.875rem",
                borderTop: `1px dashed ${colors.CardBorder}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  <BoltIcon size={14} color={colors.BrandIndigo} />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: colors.TextHeading,
                    }}
                  >
                    Global Platform Gateways & Redirect URLs (Optional)
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: colors.TextBody }}>
                  Global settings for AI agents, ChatGPT, and widgets
                </span>
              </div>

              {/* 1. Global WebSocket / Live Stream URL */}
              <div>
                <label
                  className={styles.fieldLabel}
                  style={{ color: colors.TextBody, marginBottom: "0.375rem" }}
                >
                  Global WebSocket / Live Stream URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. wss://api.company.com/stream or https://api.company.com/events"
                  value={authStrategy?.globalStreamUrl || ""}
                  onChange={(e) =>
                    setAuthStrategy({ globalStreamUrl: e.target.value })
                  }
                  className={styles.urlInput}
                  style={{
                    background: colors.BackgroundSecondary,
                    border: `1px solid ${colors.CardBorder}`,
                    borderRadius: "0.5rem",
                    color: colors.TextHeading,
                    padding: "0.5rem 0.75rem",
                  }}
                />
              </div>

              {/* 2. Direct Checkout / Booking URL Redirect (for Booking / Rental / Hotel / Travel / Automotive industries) */}
              {isBookingIndustry && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: colors.BackgroundSecondary,
                    border: `1px solid ${colors.CardBorder}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="global-checkout-checkbox"
                      checked={Boolean(authStrategy?.hasGlobalCheckout)}
                      onChange={(e) =>
                        setAuthStrategy({
                          hasGlobalCheckout: e.target.checked,
                        })
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: colors.BrandIndigo,
                      }}
                    />
                    <label
                      htmlFor="global-checkout-checkbox"
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: colors.TextHeading,
                        cursor: "pointer",
                        margin: 0,
                      }}
                    >
                      Enable Checkout / Booking Redirect URL
                    </label>
                  </div>

                  {authStrategy?.hasGlobalCheckout && (
                    <div
                      style={{
                        marginTop: "0.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                      }}
                    >
                      <label
                        className={styles.fieldLabel}
                        style={{ color: colors.TextBody, marginBottom: 0 }}
                      >
                        Checkout / Booking URL Template
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="e.g. https://carrental.pro/book?carId={carId}&pickupLocationId={pickupLocationId}&dropoffLocationId={dropoffLocationId}&pickupDate={pickupDate}&dropoffDate={dropoffDate}&insuranceTier={insuranceTier}"
                          value={authStrategy?.globalCheckoutUrl || ""}
                          onChange={(e) =>
                            setAuthStrategy({
                              globalCheckoutUrl: e.target.value,
                            })
                          }
                          className={styles.urlInput}
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                            borderRadius: "0.5rem",
                            color: colors.TextHeading,
                            padding: "0.5rem 0.75rem",
                            fontFamily: "monospace",
                            fontSize: "0.8125rem",
                          }}
                        />

                        {/* Parameter helper badges */}
                        <div
                          style={{
                            background: colors.Card,
                            border: `1px solid ${colors.CardBorder}`,
                            borderRadius: "0.5rem",
                            padding: "0.625rem 0.75rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: colors.TextHeading,
                              }}
                            >
                              Supported Template Parameters (click to insert):
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.375rem",
                            }}
                          >
                            {[
                              { tag: "{id}", label: "Item / Car / Product ID" },
                              { tag: "{carId}", label: "Car ID" },
                              { tag: "{pickupLocationId}", label: "Pickup Location ID" },
                              { tag: "{dropoffLocationId}", label: "Drop-off Location ID" },
                              { tag: "{pickupDate}", label: "Pickup Date (YYYY-MM-DD)" },
                              { tag: "{dropoffDate}", label: "Drop-off Date (YYYY-MM-DD)" },
                              { tag: "{insuranceTier}", label: "Insurance (BASIC, STANDARD, PREMIUM)" },
                              { tag: "{quantity}", label: "Quantity / Duration (days)" },
                              { tag: "{price}", label: "Price / Daily Rate" },
                              { tag: "{total}", label: "Total Amount" },
                              { tag: "{slug}", label: "URL Slug" },
                            ].map((p) => (
                              <button
                                key={p.tag}
                                type="button"
                                title={`Click to add ${p.tag} (${p.label})`}
                                onClick={() => {
                                  const cur = authStrategy?.globalCheckoutUrl || "";
                                  const separator = cur.includes("?")
                                    ? cur.endsWith("?") || cur.endsWith("&")
                                      ? ""
                                      : "&"
                                    : "?";
                                  const paramKey = p.tag.replace(/[{}]/g, "");
                                  const toAdd = cur
                                    ? cur.endsWith("=")
                                      ? p.tag
                                      : `${separator}${paramKey}=${p.tag}`
                                    : `https://yourcompany.com/book?${paramKey}=${p.tag}`;
                                  setAuthStrategy({
                                    globalCheckoutUrl: cur ? `${cur}${toAdd}` : toAdd,
                                  });
                                }}
                                style={{
                                  background: colors.BackgroundSecondary,
                                  border: `1px solid ${colors.CardBorder}`,
                                  borderRadius: "0.375rem",
                                  padding: "0.25rem 0.5rem",
                                  fontSize: "0.7rem",
                                  color: colors.BrandIndigo,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                <code>{p.tag}</code>
                                <span style={{ color: colors.TextBody, fontSize: "0.65rem" }}>
                                  ({p.label})
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Quick Preset Templates */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginTop: "0.25rem",
                              paddingTop: "0.375rem",
                              borderTop: `1px solid ${colors.CardBorder}`,
                            }}
                          >
                            <span style={{ fontSize: "0.7rem", color: colors.TextBody }}>
                              Quick Presets:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAuthStrategy({
                                  globalCheckoutUrl:
                                    "https://yourcarrental.com/book?carId={carId}&pickupLocationId={pickupLocationId}&dropoffLocationId={dropoffLocationId}&pickupDate={pickupDate}&dropoffDate={dropoffDate}&insuranceTier={insuranceTier}",
                                })
                              }
                              style={{
                                background: "transparent",
                                border: `1px solid ${colors.BrandIndigo}`,
                                borderRadius: "0.25rem",
                                padding: "0.2rem 0.4rem",
                                fontSize: "0.68rem",
                                color: colors.BrandIndigo,
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              Car Rental / Booking URL
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAuthStrategy({
                                  globalCheckoutUrl:
                                    "https://yourstore.com/checkout?productId={id}&quantity={quantity}&price={price}",
                                })
                              }
                              style={{
                                background: "transparent",
                                border: `1px solid ${colors.CardBorder}`,
                                borderRadius: "0.25rem",
                                padding: "0.2rem 0.4rem",
                                fontSize: "0.68rem",
                                color: colors.TextBody,
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              E-Commerce Checkout URL
                            </button>
                          </div>

                          {/* Parameter Format & Validation Reference Table */}
                          <div
                            style={{
                              marginTop: "0.5rem",
                              background: colors.BackgroundSecondary,
                              border: `1px solid ${colors.CardBorder}`,
                              borderRadius: "0.375rem",
                              padding: "0.5rem 0.75rem",
                              fontSize: "0.68rem",
                              color: colors.TextBody,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                color: colors.TextHeading,
                                marginBottom: "0.375rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                              }}
                            >
                              <span>ℹ️ Parameter Data Types & Validation Guide:</span>
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1.2fr 1fr 2.5fr",
                                gap: "0.375rem 0.5rem",
                                lineHeight: "1.35",
                              }}
                            >
                              <span style={{ fontWeight: 600, color: colors.TextHeading }}>Token</span>
                              <span style={{ fontWeight: 600, color: colors.TextHeading }}>Type</span>
                              <span style={{ fontWeight: 600, color: colors.TextHeading }}>Description & Validation</span>

                              <code>{"{carId}"} / {"{id}"}</code>
                              <span>String</span>
                              <span>Unique item/vehicle ID (e.g. <code>cmtjtc945...</code>).</span>

                              <code>{"{pickupLocationId}"}</code>
                              <span>String</span>
                              <span>Pickup branch ID (e.g. <code>cmtjtc4rg...</code>). Validated by booking APIs.</span>

                              <code>{"{dropoffLocationId}"}</code>
                              <span>String</span>
                              <span>Drop-off branch ID. Will use selected branch or same as pickup.</span>

                              <code>{"{pickupDate}"}</code>
                              <span>ISO / Date</span>
                              <span>Booking start date (e.g. <code>2026-09-09T00:00:00.000Z</code> or <code>YYYY-MM-DD</code>).</span>

                              <code>{"{dropoffDate}"}</code>
                              <span>ISO / Date</span>
                              <span>Booking return date (e.g. <code>2026-09-11T00:00:00.000Z</code> or <code>YYYY-MM-DD</code>).</span>

                              <code>{"{insuranceTier}"}</code>
                              <span>String Enum</span>
                              <span>Selected tier: <code>BASIC</code>, <code>STANDARD</code>, or <code>PREMIUM</code>.</span>

                              <code>{"{quantity}"}</code>
                              <span>Number</span>
                              <span>Total days (for rentals) or item quantity.</span>

                              <code>{"{total}"}</code>
                              <span>Number</span>
                              <span>Calculated total order/rental amount in company currency.</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", fontStyle: "italic", fontSize: "0.65rem", color: (colors as any).TextMuted || colors.TextBody }}>
                              * You can map these tokens to any query parameter required by your system, e.g. <code>pickup_loc={"{"}pickupLocationId{"}"}&vehicle_id={"{"}carId{"}"}</code>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Shop & Product Page URLs (for Shopping / Buying / Courses / Ecommerce / Retail / Marketplace industries) */}
              {isShopOrProductIndustry && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: colors.BackgroundSecondary,
                    border: `1px solid ${colors.CardBorder}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="global-product-pages-checkbox"
                      checked={Boolean(authStrategy?.hasProductPages)}
                      onChange={(e) =>
                        setAuthStrategy({
                          hasProductPages: e.target.checked,
                        })
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: colors.BrandIndigo,
                      }}
                    />
                    <label
                      htmlFor="global-product-pages-checkbox"
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: colors.TextHeading,
                        cursor: "pointer",
                        margin: 0,
                      }}
                    >
                      Enable Shop / Catalog & Single Product Page URLs
                    </label>
                  </div>

                  {authStrategy?.hasProductPages && (
                    <div
                      className={styles.authInputGrid}
                      style={{ marginTop: "0.25rem" }}
                    >
                      <div>
                        <label
                          className={styles.fieldLabel}
                          style={{
                            color: colors.TextBody,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Shop / Catalog URL
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://yourstore.com/shop or https://courses.com/catalog"
                          value={authStrategy?.shopCatalogUrl || ""}
                          onChange={(e) =>
                            setAuthStrategy({
                              shopCatalogUrl: e.target.value,
                            })
                          }
                          className={styles.urlInput}
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                            borderRadius: "0.5rem",
                            color: colors.TextHeading,
                            padding: "0.5rem 0.75rem",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className={styles.fieldLabel}
                          style={{
                            color: colors.TextBody,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Single Product / Item URL Template
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://yourstore.com/product/{id} or https://courses.com/course/{slug}"
                          value={authStrategy?.productItemUrlTemplate || ""}
                          onChange={(e) =>
                            setAuthStrategy({
                              productItemUrlTemplate: e.target.value,
                            })
                          }
                          className={styles.urlInput}
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                            borderRadius: "0.5rem",
                            color: colors.TextHeading,
                            padding: "0.5rem 0.75rem",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Card when initial/empty and manual not chosen yet */}
        {isInitialEmpty && !hasChosenManual && (
          <div
            className={styles.step2HeroCard}
            style={
              {
                "--hero-border": colors.CardBorder,
                "--hero-bg": colors.BackgroundSecondary,
              } as React.CSSProperties
            }
          >
            <div className={styles.heroIconBg}>
              <SparklesIcon size={28} color={colors.BrandIndigo} />
            </div>
            <h3
              className={styles.heroTitle}
              style={{ color: colors.TextHeading }}
            >
              Fast-Track: 1-Click API Import
            </h3>
            <p className={styles.heroDesc} style={{ color: colors.TextBody }}>
              Have an OpenAPI 3.0 / Swagger specification or a Postman
              collection? Import all your routes, headers, parameters, and
              sample payloads in seconds.
            </p>

            <div className={styles.heroActionGroup}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className={styles.heroPrimaryBtn}
                style={{
                  background: `linear-gradient(120deg, ${colors.ButtonGradientOne || "#6366f1"}, ${colors.ButtonGradientTwo || "#8b5cf6"})`,
                }}
              >
                <SparklesIcon size={18} color="#ffffff" />
                <span>1-Click Import (Swagger / Postman)</span>
              </button>

              <div
                className={styles.heroOrDivider}
                style={{ color: colors.TextBody }}
              >
                <span>OR</span>
              </div>

              <button
                type="button"
                onClick={() => setHasChosenManual(true)}
                className={styles.heroSecondaryBtn}
                style={{
                  color: colors.TextHeading,
                  borderColor: colors.CardBorder,
                }}
              >
                <SlidersIcon size={16} color={colors.BrandIndigo} />
                <span>Configure Endpoints Manually</span>
              </button>
            </div>
          </div>
        )}

        {/* Connected APIs List */}
        {apisList.map((api, index) => {
          const methodColors = getMethodBadgeStyle(
            api.apiMethod || "GET",
            colors,
          );
          const activeTab = getActiveTab(api.id);
          const isCollapsed = collapsedApiIds.has(api.id);

          return (
            <div
              key={api.id}
              className={styles.apiBlock}
              style={{
                background: colors.Background,
                border: `1px solid ${colors.CardBorder}`,
                borderRadius: "0.75rem",
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              {/* Top Block Header (Clickable Collapsible Bar) */}
              <div
                className={styles.apiBlockHeader}
                onClick={() => toggleCollapseApi(api.id)}
                style={{
                  borderBottom: isCollapsed
                    ? "none"
                    : `1px solid ${colors.CardBorder}`,
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  background: isCollapsed
                    ? colors.BackgroundSecondary
                    : colors.Background,
                  transition: "background 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      transform: isCollapsed
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronDownIcon size={15} color={colors.IconColor} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "0.25rem",
                      background: methodColors.bg,
                      color: methodColors.text,
                      border: `1px solid ${methodColors.border}`,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {api.apiMethod || "GET"}
                  </span>
                  <span
                    className={styles.apiBlockTitle}
                    style={{
                      color: colors.TextHighlightedHeading,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "280px",
                    }}
                  >
                    {api.apiName?.trim()
                      ? api.apiName
                      : `API #${index + 1} (Untitled)`}
                  </span>
                  {api.apiEndpoint && api.apiEndpoint !== "https://" && (
                    <span
                      style={{
                        color: colors.TextBody,
                        opacity: 0.65,
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "320px",
                      }}
                    >
                      {api.apiEndpoint.replace(/^https?:\/\/[^\/]+/, "") ||
                        api.apiEndpoint}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {apisList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteApi(api.id)}
                      className={styles.deleteBtn}
                    >
                      <TrashIcon size={13} color="currentColor" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className={styles.apiBlockBody}>
                  {/* Section 1: API Name */}
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{ color: colors.TextBody }}
                    >
                      API Name{" "}
                      <span style={{ color: colors.WarningText }}>*</span>
                    </label>
                    <div className={styles.inputRelative}>
                      <span className={styles.inputIconLeft}>
                        <SlidersIcon size={14} color={colors.IconColor} />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Order / Checkout API"
                        value={api.apiName}
                        onChange={(e) =>
                          updateApiField(api.id, "apiName", e.target.value)
                        }
                        className={styles.inputWithIcon}
                        style={{
                          background: colors.BackgroundSecondary,
                          border: `1px solid ${colors.CardBorder}`,
                          color: colors.TextHeading,
                        }}
                      />
                    </div>
                  </div>

                  {/* Section 2: HTTP Method & Postman Endpoint URL Bar */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <div className={styles.endpointHeader}>
                      <label
                        className={styles.fieldLabel}
                        style={{ color: colors.TextBody, marginBottom: 0 }}
                      >
                        HTTP Method & Endpoint{" "}
                        <span style={{ color: colors.WarningText }}>*</span>
                      </label>
                    </div>

                    {/* Postman URL Request Bar */}
                    <div
                      className={styles.requestBar}
                      style={{
                        background: colors.BackgroundSecondary,
                        borderColor: colors.CardBorder,
                      }}
                    >
                      {/* Method Selector Badge */}
                      <div
                        className={styles.methodSelectWrapper}
                        style={{ borderColor: colors.CardBorder }}
                      >
                        <select
                          value={api.apiMethod}
                          onChange={(e) => {
                            const newMethod = e.target.value as any;
                            updateApiField(api.id, "apiMethod", newMethod);
                            if (
                              (newMethod === "GET" || newMethod === "DELETE") &&
                              getActiveTab(api.id) === "body"
                            ) {
                              setActiveTabForApi(api.id, "params");
                            }
                          }}
                          className={styles.methodSelect}
                          style={{
                            color: colors.TextBody,
                            backgroundColor: colors.Background,
                          }}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                        <span className={styles.selectArrow}>
                          <ChevronDownIcon size={12} color={colors.TextBody} />
                        </span>
                      </div>

                      {/* Protocol Prefix */}
                      <div
                        className={styles.protocolPrefix}
                        style={{
                          background: colors.Background,
                          color: colors.TextBody,
                        }}
                      >
                        <ServerIcon size={13} color={colors.IconColor} />
                        <span>https://</span>
                      </div>

                      {/* Endpoint URL Input */}
                      <div className={styles.urlInputWrapper}>
                        <input
                          type="text"
                          placeholder="api.domain.com/v1/forecast.json"
                          value={(api.apiEndpoint || "").replace(
                            /^https?:\/\//,
                            "",
                          )}
                          onChange={(e) =>
                            handleEndpointUrlChange(api.id, e.target.value)
                          }
                          className={styles.urlInput}
                          style={{ color: colors.TextHeading }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Audience Toggle */}
                  <div>
                    <label
                      className={styles.fieldLabel}
                      style={{
                        color: colors.TextBody,
                        marginBottom: "0.375rem",
                        display: "block",
                      }}
                    >
                      Target Audience
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {(["customer", "admin"] as const).map((aud) => (
                        <button
                          key={aud}
                          type="button"
                          onClick={() =>
                            updateApiField(api.id, "audience", aud)
                          }
                          style={{
                            padding: "0.375rem 0.75rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "capitalize",
                            background:
                              (api.audience || "customer") === aud
                                ? "rgba(59, 130, 246, 0.2)"
                                : colors.BackgroundSecondary,
                            border: `1px solid ${
                              (api.audience || "customer") === aud
                                ? colors.CardActiveBorder
                                : colors.CardBorder
                            }`,
                            color:
                              (api.audience || "customer") === aud
                                ? colors.TextHeading
                                : colors.TextBody,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {aud}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Request Tabs (Params, Headers, Body) */}
                  <div className={styles.configGrid}>
                    <div className={styles.requestCol}>
                      {/* Postman Tab Bar */}
                      <div
                        className={styles.tabBar}
                        style={{ borderColor: colors.CardBorder }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveTabForApi(api.id, "params")}
                          className={`${styles.tabBtn} ${
                            activeTab === "params" ? styles.tabActive : ""
                          }`}
                          style={{
                            color:
                              activeTab === "params"
                                ? colors.TextOverlay
                                : colors.TextBody,
                            borderColor:
                              activeTab === "params"
                                ? colors.CardActiveBorder
                                : "transparent",
                          }}
                        >
                          <span>Params</span>
                          <span
                            className={styles.tabBadge}
                            style={{
                              background: colors.BackgroundSecondary,
                              color: colors.TextBody,
                            }}
                          >
                            {
                              parseJsonToRows(api.apiQueryParams).filter((r) =>
                                r.key.trim(),
                              ).length
                            }
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTabForApi(api.id, "headers")}
                          className={`${styles.tabBtn} ${
                            activeTab === "headers" ? styles.tabActive : ""
                          }`}
                          style={{
                            color:
                              activeTab === "headers"
                                ? colors.TextHeading
                                : colors.TextBody,
                            borderColor:
                              activeTab === "headers"
                                ? colors.CardActiveBorder
                                : "transparent",
                          }}
                        >
                          <span>Headers</span>
                          <span
                            className={styles.tabBadge}
                            style={{
                              background: colors.BackgroundSecondary,
                              color: colors.TextBody,
                            }}
                          >
                            {
                              parseJsonToRows(api.apiHeaders).filter((r) =>
                                r.key.trim(),
                              ).length
                            }
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTabForApi(api.id, "body")}
                          disabled={
                            api.apiMethod === "GET" || api.apiMethod === "DELETE"
                          }
                          className={`${styles.tabBtn} ${
                            activeTab === "body" ? styles.tabActive : ""
                          }`}
                          style={{
                            color:
                              api.apiMethod === "GET" ||
                              api.apiMethod === "DELETE"
                                ? colors.TextBody
                                : activeTab === "body"
                                  ? colors.TextHeading
                                  : colors.TextBody,
                            borderColor:
                              activeTab === "body"
                                ? colors.CardActiveBorder
                                : "transparent",
                            opacity:
                              api.apiMethod === "GET" ||
                              api.apiMethod === "DELETE"
                                ? 0.4
                                : 1,
                            cursor:
                              api.apiMethod === "GET" ||
                              api.apiMethod === "DELETE"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <span>Body</span>
                          <span className={styles.jsonBodyPill}>JSON</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShowHelpGuide((prev) => ({
                              ...prev,
                              [api.id]: !prev[api.id],
                            }))
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.375rem",
                            background: showHelpGuide[api.id]
                              ? "rgba(99, 102, 241, 0.2)"
                              : "transparent",
                            border: `1px solid ${
                              showHelpGuide[api.id]
                                ? colors.CardActiveBorder
                                : colors.CardBorder
                            }`,
                            color: colors.TextHeading,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            marginLeft: "auto",
                          }}
                          title="Toggle tab guide"
                        >
                          <HelpIcon size={14} color={colors.BrandIndigo} />
                          <span>Help</span>
                        </button>
                      </div>

                      {showHelpGuide[api.id] && (
                        <div
                          style={{
                            margin: "0.5rem 0",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            background: colors.BackgroundSecondary,
                            border: `1px solid ${colors.CardActiveBorder}`,
                            color: colors.TextHeading,
                            fontSize: "0.8125rem",
                            lineHeight: 1.4,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.5rem",
                          }}
                        >
                          <span style={{ flexShrink: 0, marginTop: "2px" }}>
                            <HelpIcon size={16} color={colors.BrandIndigo} />
                          </span>
                          <div>
                            <strong>
                              {activeTab === "params" && "Params Tab Guide"}
                              {activeTab === "headers" && "Headers Tab Guide"}
                              {activeTab === "body" && "Body Tab Guide"}
                            </strong>
                            <p
                              style={{
                                margin: "0.25rem 0 0 0",
                                color: colors.TextBody,
                                fontSize: "0.75rem",
                              }}
                            >
                              {activeTab === "params" &&
                                "Query parameters are appended to your URL endpoint (e.g. ?q=search&limit=10). Toggle 'Dynamic (AI)' so ChatGPT can automatically supply values based on user chat queries."}
                              {activeTab === "headers" &&
                                "Specify custom HTTP headers sent with every request (e.g. Accept-Language, X-Client-Version)."}
                              {activeTab === "body" &&
                                "Define the JSON request payload expected by your POST, PUT, or PATCH endpoints. GET and DELETE endpoints do not take request bodies."}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tab Content */}
                      <div style={{ paddingTop: "0.25rem" }}>
                        {activeTab === "params" && (
                          <PostmanTableEditor
                            api={api}
                            field="apiQueryParams"
                            title="Query & Path Parameters"
                            description="Parameters added here are automatically appended to your endpoint. Toggle 'Dynamic (AI)' to let ChatGPT supply parameters at runtime based on user chat queries."
                            showDynamicToggle={true}
                            colors={colors}
                            updateApiField={updateApiField}
                            stepOneData={stepOneData}
                          />
                        )}

                        {activeTab === "headers" && (
                          <PostmanTableEditor
                            api={api}
                            field="apiHeaders"
                            title="Custom HTTP Headers"
                            description="Add custom headers sent with every request (e.g. Accept-Language, X-User-Id, custom metadata)."
                            showDynamicToggle={false}
                            colors={colors}
                            updateApiField={updateApiField}
                          />
                        )}

                        {activeTab === "body" &&
                          (api.apiMethod === "POST" ||
                          api.apiMethod === "PUT" ||
                          api.apiMethod === "PATCH" ? (
                            <PostmanTableEditor
                              api={api}
                              field="apiRequestBody"
                              title="Request Body Parameters (JSON)"
                              description="Define the JSON payload or body fields expected by this POST/PUT/PATCH endpoint."
                              showDynamicToggle={true}
                              colors={colors}
                              updateApiField={updateApiField}
                              stepOneData={stepOneData}
                            />
                          ) : (
                            <div
                              style={{
                                padding: "1.5rem",
                                textAlign: "center",
                                color: colors.TextBody,
                                fontSize: "0.8125rem",
                              }}
                            >
                              GET and DELETE endpoints do not take request bodies.
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Another API Endpoint Button */}
        <div className={styles.addApiBtnGroup}>
          <button
            type="button"
            onClick={handleAddApi}
            className={`${styles.btnAddApi} ${styles.btnAddApiFlex}`}
          >
            <div className={styles.addIconBg}>
              <Plus size={14} color={colors.BrandIndigo} />
            </div>
            <span className={styles.addApiText}>Add Another API Endpoint</span>
          </button>
        </div>

        {/* Footer Action Bar */}
        <div className={styles.footerActionBar}>
          <button
            onClick={() => navigate({ to: "/signup/step1" })}
            className={styles.backBtn}
          >
            <LeftArrowIcon size={14} color={colors.IconColor} /> Back to Step 1
          </button>

          <div className={styles.stepIndicatorGroup}>
            <span
              className={styles.stepText}
              style={{ color: colors.TextBody }}
            >
              Step 2 of 3
            </span>
            <button
              onClick={handleStepTwoSubmitWithValidation}
              className={styles.btn}
              style={{
                background: isStepTwoPending
                  ? colors.Background
                  : `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                color: isStepTwoPending ? colors.TextBody : "#ffffff",
                border: isStepTwoPending
                  ? `1px solid ${colors.CardBorder}`
                  : "none",
                cursor: isStepTwoPending ? "not-allowed" : "pointer",
                opacity: 1,
              }}
              disabled={isStepTwoPending}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>

      {/* OpenAPI / Postman Importer Modal */}
      <ApiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        hasExistingManualApis={apisList.some(
          (a) =>
            (a.apiName && a.apiName.trim().length > 0) ||
            (a.apiEndpoint &&
              a.apiEndpoint !== "https://" &&
              a.apiEndpoint.trim().length > 8),
        )}
        onImport={(apis, mode) => {
          importApisBatch(apis, mode);
          setHasChosenManual(true);
        }}
      />
    </motion.div>
  );
};

export default SignupStep2;
