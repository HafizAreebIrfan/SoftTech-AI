import React, { FC, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore } from "../../../../hooks";
import {
  useSignupStore,
  parseJsonToRows,
} from "../../../../infrastructure/store/signupStore";
import { stepTwoSchema } from "../../../../infrastructure/validation/signupSchemas";
import {
  DatabaseIcon,
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
  EyeIcon,
  ChevronDownIcon,
  SpinnerIcon,
  ShieldLockIcon,
  XMarkIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import styles from "../../../../styles/signup.module.css";
import { PostmanTableEditor } from "../../../components/auth/PostmanTableEditor";

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
    apisList,
    updateApiField,
    handleAddApi,
    handleDeleteApi,
    apiTestStates,
    isStepTwoPending,
    handleTestApi,
    handleStepTwoSubmit,
    handleEndpointUrlChange,
    stepOneData,
  } = useSignupStore();

  const [activeTabs, setActiveTabs] = useState<
    Record<string, "params" | "auth" | "headers" | "body">
  >({});
  const [showApiKeyMask, setShowApiKeyMask] = useState<Record<string, boolean>>(
    {},
  );

  const getActiveTab = (
    apiId: string,
  ): "params" | "auth" | "headers" | "body" => {
    return activeTabs[apiId] || "params";
  };

  const setActiveTabForApi = (
    apiId: string,
    tab: "params" | "auth" | "headers" | "body",
  ) => {
    setActiveTabs((prev) => ({ ...prev, [apiId]: tab }));
  };

  const allApisTestedSuccessfully = apisList.every(
    (api) => apiTestStates[api.id]?.status === "success",
  );

  const anyApiHasError = apisList.some(
    (api) => apiTestStates[api.id]?.status === "error",
  );

  const getButtonText = () => {
    if (isStepTwoPending) return "Saving & Generating AI Schemas...";
    if (anyApiHasError) return "Fix API Errors to Continue";
    if (!allApisTestedSuccessfully) return "Test APIs to Continue";
    return "Continue";
  };

  const handleStepTwoSubmitWithValidation = () => {
    const result = stepTwoSchema.safeParse(apisList);
    if (!result.success) {
      const errorMsg =
        result.error.issues[0]?.message || "Please fix validation errors.";
      showToast(errorMsg, "warning");
      return;
    }

    if (!allApisTestedSuccessfully) {
      showToast(
        "Please test all API configurations successfully before continuing.",
        "warning",
      );
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
          background: colors.BackgroundSecondary,
          border: `1px solid ${colors.CardBorder}`,
          borderLeft: `4px solid ${colors.CardActiveBorder}`,
          boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
        }}
      >
        {/* Header Title */}
        <div className={styles.headerWrapper}>
          <h2
            className={styles.headerTitle}
            style={{ color: colors.TextHeading }}
          >
            API Configuration
          </h2>
          <p className={styles.headerDesc} style={{ color: colors.TextBody }}>
            Define how your backend communicates with your services. Specify
            endpoints without query parameters, configure authentication
            protocols, and let our AI automatically generate your schema.
          </p>
        </div>

        {apisList.map((api, index) => {
          const methodColors = getMethodBadgeStyle(
            api.apiMethod || "GET",
            colors,
          );
          const activeTab = getActiveTab(api.id);

          return (
            <div
              key={api.id}
              className={styles.apiBlock}
              style={{
                background: colors.Background,
                border: `1px solid ${colors.CardBorder}`,
              }}
            >
              {/* Top Block Header */}
              <div
                className={styles.apiBlockHeader}
                style={{
                  borderBottom: `1px solid ${colors.CardBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <DatabaseIcon size={16} color={colors.IconColor} />
                  <span
                    className={styles.apiBlockTitle}
                    style={{ color: colors.TextHighlightedHeading }}
                  >
                    API Connection #{index + 1} {index === 0}
                  </span>
                </div>
                {apisList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteApi(api.id)}
                    className={styles.deleteBtn}
                  >
                    <TrashIcon size={13} color={colors.DeleteAPIButtonText} />
                    <span>Delete API</span>
                  </button>
                )}
              </div>

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

                {/* Section 1.5: Platform Type & Checkout Redirect Configuration */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <div>
                    <label className={styles.fieldLabel} style={{ color: colors.TextBody }}>
                      Target Platform Type
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {[
                        { label: "Web Application", value: "web" },
                        { label: "Mobile App Only", value: "mobile" },
                        { label: "Both (Web & Mobile)", value: "both" },
                      ].map((platform) => (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() => updateApiField(api.id, "platformType", platform.value)}
                          style={{
                            flex: 1,
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            border: `1px solid ${
                              (api.platformType || "web") === platform.value
                                ? colors.CardActiveBorder
                                : colors.CardBorder
                            }`,
                            background:
                              (api.platformType || "web") === platform.value
                                ? "rgba(99, 102, 241, 0.12)"
                                : colors.BackgroundSecondary,
                            color:
                              (api.platformType || "web") === platform.value
                                ? "#818cf8"
                                : colors.TextBody,
                            cursor: "pointer",
                          }}
                        >
                          {platform.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Web Checkout URL Input */}
                  {((api.platformType || "web") === "web" || (api.platformType || "web") === "both") && (
                    <div>
                      <label className={styles.fieldLabel} style={{ color: colors.TextBody }}>
                        Official Web Checkout URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://cardetailerzzexpress.com/order/checkout"
                        value={api.webCheckoutUrl || api.apiCheckoutTemplate || ""}
                        onChange={(e) => updateApiField(api.id, "webCheckoutUrl", e.target.value)}
                        className={styles.urlInput}
                        style={{
                          width: "100%",
                          background: colors.BackgroundSecondary,
                          border: `1px solid ${colors.CardBorder}`,
                          borderRadius: "0.375rem",
                          color: colors.TextHeading,
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.8125rem",
                        }}
                      />
                    </div>
                  )}

                  {/* Mobile Deep Link Input */}
                  {((api.platformType || "web") === "mobile" || (api.platformType || "web") === "both") && (
                    <div>
                      <label className={styles.fieldLabel} style={{ color: colors.TextBody }}>
                        Mobile App Deep Link Scheme (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. cardetailerzz://checkout"
                        value={api.mobileDeepLink || ""}
                        onChange={(e) => updateApiField(api.id, "mobileDeepLink", e.target.value)}
                        className={styles.urlInput}
                        style={{
                          width: "100%",
                          background: colors.BackgroundSecondary,
                          border: `1px solid ${colors.CardBorder}`,
                          borderRadius: "0.375rem",
                          color: colors.TextHeading,
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.8125rem",
                        }}
                      />
                    </div>
                  )}
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
                        onChange={(e) =>
                          updateApiField(
                            api.id,
                            "apiMethod",
                            e.target.value as any,
                          )
                        }
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

                    {/* Test API / Send Button */}
                    <div
                      className={styles.testBtnWrapper}
                      style={{ borderColor: colors.CardBorder }}
                    >
                      <button
                        type="button"
                        onClick={() => handleTestApi(api)}
                        disabled={apiTestStates[api.id]?.status === "loading"}
                        className={styles.testBtn}
                        style={{
                          background:
                            apiTestStates[api.id]?.status === "success"
                              ? "linear-gradient(90deg, #10b981, #059669)"
                              : `linear-gradient(90deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                          color: "#ffffff",
                        }}
                      >
                        {apiTestStates[api.id]?.status === "loading" ? (
                          <>
                            <SpinnerIcon size={13} color="#ffffff" />
                            <span>Testing...</span>
                          </>
                        ) : apiTestStates[api.id]?.status === "success" ? (
                          <>
                            <CheckIcon size={13} color="#ffffff" />
                            <span>Tested</span>
                          </>
                        ) : (
                          <>
                            <BoltIcon size={13} color="#ffffff" />
                            <span>Test API</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Postman Request Config & AI Response Inspector */}
                <div className={styles.configGrid}>
                  {/* Left Column (7 Cols): Request Tabs (Params, Auth, Headers, Body) */}
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
                              ? colors.TextHeading
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
                        onClick={() => setActiveTabForApi(api.id, "auth")}
                        className={`${styles.tabBtn} ${
                          activeTab === "auth" ? styles.tabActive : ""
                        }`}
                        style={{
                          color:
                            activeTab === "auth"
                              ? colors.TextHeading
                              : colors.TextBody,
                          borderColor:
                            activeTab === "auth"
                              ? colors.CardActiveBorder
                              : "transparent",
                        }}
                      >
                        <span>Authorization</span>
                        {api.apiAuthType !== "No Auth" && (
                          <span
                            className={styles.authEnabledDot}
                            title="Auth Enabled"
                          />
                        )}
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

                      {(api.apiMethod === "POST" ||
                        api.apiMethod === "PUT" ||
                        api.apiMethod === "PATCH") && (
                        <button
                          type="button"
                          onClick={() => setActiveTabForApi(api.id, "body")}
                          className={`${styles.tabBtn} ${
                            activeTab === "body" ? styles.tabActive : ""
                          }`}
                          style={{
                            color:
                              activeTab === "body"
                                ? colors.TextHeading
                                : colors.TextBody,
                            borderColor:
                              activeTab === "body"
                                ? colors.CardActiveBorder
                                : "transparent",
                          }}
                        >
                          <span>Body</span>
                          <span className={styles.jsonBodyPill}>JSON</span>
                        </button>
                      )}
                    </div>

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

                      {activeTab === "auth" && (
                        <div
                          className={styles.authContainer}
                          style={{
                            background: colors.Background,
                            borderColor: colors.CardBorder,
                          }}
                        >
                          <div>
                            <label
                              className={styles.fieldLabel}
                              style={{
                                color: colors.TextBody,
                                marginBottom: "0.375rem",
                              }}
                            >
                              Authentication Type{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className={styles.authGrid}>
                              {[
                                "No Auth",
                                "API Key",
                                "Bearer Token",
                                "OAuth 2.0",
                              ].map((authOption) => (
                                <button
                                  key={authOption}
                                  type="button"
                                  onClick={() =>
                                    updateApiField(
                                      api.id,
                                      "apiAuthType",
                                      authOption,
                                    )
                                  }
                                  className={styles.authTypeBtn}
                                  style={{
                                    color:
                                      api.apiAuthType === authOption
                                        ? "#818cf8"
                                        : colors.TextBody,
                                    borderColor:
                                      api.apiAuthType === authOption
                                        ? colors.CardActiveBorder
                                        : colors.CardBorder,
                                    background:
                                      api.apiAuthType === authOption
                                        ? "rgba(99, 102, 241, 0.1)"
                                        : "rgba(255, 255, 255, 0.03)",
                                  }}
                                >
                                  <KeyIcon
                                    size={13}
                                    color={
                                      api.apiAuthType === authOption
                                        ? "#818cf8"
                                        : colors.IconColor
                                    }
                                  />
                                  <span>{authOption}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {api.apiAuthType === "No Auth" && (
                            <div
                              className={styles.noAuthBanner}
                              style={{
                                backgroundColor: "rgba(255, 255, 255, 0.01)",
                                borderColor: colors.CardBorder,
                                color: colors.TextBody,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  color: colors.TextHeading,
                                }}
                              >
                                No Authentication Required
                              </div>
                              <p
                                style={{ opacity: 0.75, fontSize: "0.6875rem" }}
                              >
                                This endpoint is public and does not require
                                credentials, bearer tokens, or API keys.
                              </p>
                            </div>
                          )}

                          {api.apiAuthType === "Bearer Token" && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem",
                              }}
                            >
                              <div>
                                <label
                                  className={styles.fieldLabel}
                                  style={{ color: colors.TextBody }}
                                >
                                  Bearer Token{" "}
                                  <span style={{ color: colors.WarningText }}>
                                    *
                                  </span>
                                </label>
                                <div className={styles.inputRelative}>
                                  <span className={styles.inputIconLeft}>
                                    <LockIcon
                                      size={14}
                                      color={colors.IconColor}
                                    />
                                  </span>
                                  <input
                                    type={
                                      showApiKeyMask[api.id]
                                        ? "text"
                                        : "password"
                                    }
                                    placeholder="e.g. eyJhbGciOiJIUzI1NiIsIn..."
                                    value={api.apiCredentials || ""}
                                    onChange={(e) =>
                                      updateApiField(
                                        api.id,
                                        "apiCredentials",
                                        e.target.value,
                                      )
                                    }
                                    className={styles.inputWithIcon}
                                    style={{
                                      background: colors.BackgroundSecondary,
                                      borderColor: colors.CardBorder,
                                      color: colors.TextHeading,
                                      fontFamily: "monospace",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowApiKeyMask((prev) => ({
                                        ...prev,
                                        [api.id]: !prev[api.id],
                                      }))
                                    }
                                    className={styles.passwordToggleBtn}
                                  >
                                    <EyeIcon
                                      size={14}
                                      color={colors.IconColor}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {api.apiAuthType === "API Key" && (
                            <div className={styles.authInputGrid}>
                              <div>
                                <label
                                  className={styles.fieldLabel}
                                  style={{ color: colors.TextBody }}
                                >
                                  Header Name{" "}
                                  <span style={{ color: colors.WarningText }}>
                                    *
                                  </span>
                                </label>
                                <div className={styles.inputRelative}>
                                  <span className={styles.inputIconLeft}>
                                    <SlidersIcon
                                      size={14}
                                      color={colors.IconColor}
                                    />
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="e.g. X-API-Key or Authorization"
                                    value={api.apiAuthHeader || ""}
                                    onChange={(e) =>
                                      updateApiField(
                                        api.id,
                                        "apiAuthHeader",
                                        e.target.value,
                                      )
                                    }
                                    className={styles.inputWithIcon}
                                    style={{
                                      background: colors.BackgroundSecondary,
                                      borderColor: colors.CardBorder,
                                      color: colors.TextHeading,
                                      fontFamily: "monospace",
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <label
                                  className={styles.fieldLabel}
                                  style={{ color: colors.TextBody }}
                                >
                                  API Key Value{" "}
                                  <span style={{ color: colors.WarningText }}>
                                    *
                                  </span>
                                </label>
                                <div className={styles.inputRelative}>
                                  <span className={styles.inputIconLeft}>
                                    <LockIcon
                                      size={14}
                                      color={colors.IconColor}
                                    />
                                  </span>
                                  <input
                                    type={
                                      showApiKeyMask[api.id]
                                        ? "text"
                                        : "password"
                                    }
                                    placeholder="e.g. 39e38d5b03284e..."
                                    value={api.apiCredentials || ""}
                                    onChange={(e) =>
                                      updateApiField(
                                        api.id,
                                        "apiCredentials",
                                        e.target.value,
                                      )
                                    }
                                    className={styles.inputWithIcon}
                                    style={{
                                      background: colors.BackgroundSecondary,
                                      borderColor: colors.CardBorder,
                                      color: colors.TextHeading,
                                      fontFamily: "monospace",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowApiKeyMask((prev) => ({
                                        ...prev,
                                        [api.id]: !prev[api.id],
                                      }))
                                    }
                                    className={styles.passwordToggleBtn}
                                  >
                                    <EyeIcon
                                      size={14}
                                      color={colors.IconColor}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {api.apiAuthType === "OAuth 2.0" && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem",
                              }}
                            >
                              <div>
                                <label
                                  className={styles.fieldLabel}
                                  style={{ color: colors.TextBody }}
                                >
                                  Token / Grant URL{" "}
                                  <span style={{ color: colors.WarningText }}>
                                    *
                                  </span>
                                </label>
                                <div style={{ display: "flex", width: "100%" }}>
                                  <div
                                    className={styles.protocolPrefix}
                                    style={{
                                      display: "flex",
                                      background: colors.BackgroundSecondary,
                                      borderColor: colors.CardBorder,
                                      color: colors.TextBody,
                                      borderRadius: "0.5rem 0 0 0.5rem",
                                    }}
                                  >
                                    <span>https://</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="auth.domain.com/oauth/token"
                                    value={(api.oauthTokenUrl || "").replace(
                                      /^https?:\/\//,
                                      "",
                                    )}
                                    onChange={(e) =>
                                      updateApiField(
                                        api.id,
                                        "oauthTokenUrl",
                                        "https://" +
                                          e.target.value.replace(
                                            /^https?:\/\//,
                                            "",
                                          ),
                                      )
                                    }
                                    className={styles.urlInput}
                                    style={{
                                      background: colors.BackgroundSecondary,
                                      border: `1px solid ${colors.CardBorder}`,
                                      borderRadius: "0 0.5rem 0.5rem 0",
                                      color: colors.TextHeading,
                                      padding: "0.375rem 0.75rem",
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
                                    Client ID{" "}
                                    <span style={{ color: colors.WarningText }}>
                                      *
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter Client ID"
                                    value={api.oauthClientId || ""}
                                    onChange={(e) =>
                                      updateApiField(
                                        api.id,
                                        "oauthClientId",
                                        e.target.value,
                                      )
                                    }
                                    className={styles.urlInput}
                                    style={{
                                      background: colors.BackgroundSecondary,
                                      border: `1px solid ${colors.CardBorder}`,
                                      borderRadius: "0.5rem",
                                      color: colors.TextHeading,
                                      padding: "0.375rem 0.75rem",
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={styles.fieldLabel}
                                    style={{ color: colors.TextBody }}
                                  >
                                    Client Secret{" "}
                                    <span style={{ color: colors.WarningText }}>
                                      *
                                    </span>
                                  </label>
                                  <input
                                    type="password"
                                    placeholder="Enter Client Secret"
                                    value={api.apiCredentials || ""}
                                    onChange={(e) =>
                                      updateApiField(
                                        api.id,
                                        "apiCredentials",
                                        e.target.value,
                                      )
                                    }
                                    className={styles.urlInput}
                                    style={{
                                      background: colors.BackgroundSecondary,
                                      border: `1px solid ${colors.CardBorder}`,
                                      borderRadius: "0.5rem",
                                      color: colors.TextHeading,
                                      padding: "0.375rem 0.75rem",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div
                            className={styles.securityNotice}
                            style={{
                              background: colors.BackgroundSecondary,
                              borderColor: colors.CardBorder,
                              color: colors.TextBody,
                            }}
                          >
                            <ShieldLockIcon
                              size={14}
                              color={colors.IconColor}
                            />
                            <span>
                              Credentials are encrypted at rest and injected by
                              our server-side MCP bridge. They are never exposed
                              to client browsers or AI prompts.
                            </span>
                          </div>
                        </div>
                      )}

                      {activeTab === "body" && (
                        <PostmanTableEditor
                          api={api}
                          field="apiQueryParams"
                          title="Request Body Parameters (JSON)"
                          description="Define the JSON payload or body fields expected by this POST/PUT/PATCH endpoint."
                          showDynamicToggle={true}
                          colors={colors}
                          updateApiField={updateApiField}
                          stepOneData={stepOneData}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Column (5 Cols): Response Visualizer & AI Schema Analyzer */}
                  <div className={styles.responseCol}>
                    <div
                      className={styles.responseHeader}
                      style={{ borderColor: colors.CardBorder }}
                    >
                      <span
                        className={styles.responseTitle}
                        style={{ color: colors.TextHeading }}
                      >
                        Response & AI Schema
                      </span>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {apiTestStates[api.id]?.status === "success" && (
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: colors.SuccessBadgeBg,
                              color: colors.SuccessBadgeText,
                              borderColor: colors.SuccessBadgeBorder,
                            }}
                          >
                            <CheckIcon
                              size={11}
                              color={colors.SuccessBadgeText}
                            />
                            <span>200 OK — AI Schema Ready</span>
                          </span>
                        )}
                        {apiTestStates[api.id]?.status === "error" && (
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: colors.ErrorBadgeBg,
                              color: colors.ErrorBadgeText,
                              borderColor: colors.ErrorBadgeBorder,
                            }}
                          >
                            <XMarkIcon
                              size={11}
                              color={colors.ErrorBadgeText}
                            />
                            <span>Connection Error</span>
                          </span>
                        )}
                        {!apiTestStates[api.id] && (
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: colors.BackgroundSecondary,
                              color: colors.TextBody,
                              borderColor: colors.CardBorder,
                            }}
                          >
                            Not Tested Yet
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={styles.terminalWindow}
                      style={{
                        background: colors.BackgroundSecondary,
                        borderColor:
                          apiTestStates[api.id]?.status === "success"
                            ? colors.SuccessBadgeBorder
                            : apiTestStates[api.id]?.status === "error"
                              ? colors.ErrorBadgeBorder
                              : colors.CardBorder,
                      }}
                    >
                      {/* Terminal window header */}
                      <div
                        className={styles.terminalBar}
                        style={{
                          background: colors.Background,
                          borderColor: colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      >
                        <div className={styles.terminalDots}>
                          <span className={styles.dotRed} />
                          <span className={styles.dotYellow} />
                          <span className={styles.dotGreen} />
                          <span className={styles.terminalTitleText}>
                            {apiTestStates[api.id]
                              ? "test-output.json"
                              : "sample-response.json"}
                          </span>
                        </div>
                        {apiTestStates[api.id] && (
                          <span className={styles.aiAnalyzerTag}>
                            <SparklesIcon size={11} color="#818cf8" />
                            <span>Gemini AI Analyzer</span>
                          </span>
                        )}
                      </div>

                      {/* Terminal body */}
                      <div className={styles.terminalBody}>
                        {apiTestStates[api.id] ? (
                          <pre
                            className={styles.logPre}
                            style={{
                              color:
                                apiTestStates[api.id]?.status === "error"
                                  ? colors.ErrorBadgeText
                                  : apiTestStates[api.id]?.status === "success"
                                    ? colors.SuccessBadgeText
                                    : colors.TextBody,
                            }}
                          >
                            {apiTestStates[api.id].logs}
                          </pre>
                        ) : (
                          <div className={styles.emptyTerminal}>
                            <div className={styles.emptyIconBg}>
                              <ServerIcon size={20} color="#818cf8" />
                            </div>
                            <div
                              className={styles.emptyTitle}
                              style={{ color: colors.TextHeading }}
                            >
                              Hit 'Test API' to inspect response
                            </div>
                            <p
                              className={styles.emptyDesc}
                              style={{ color: colors.TextBody }}
                            >
                              When you test your connection, our Gemini AI
                              automatically analyzes the response schema to
                              configure dynamic widgets and filters.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Another API Connection */}
        <button
          type="button"
          onClick={handleAddApi}
          className={styles.btnAddApi}
        >
          <div className={styles.addIconBg}>
            <Plus size={14} color="#818cf8" />
          </div>
          <span className={styles.addApiText}>+ Add Another API Endpoint</span>
        </button>

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
                background:
                  isStepTwoPending || !allApisTestedSuccessfully
                    ? colors.Background
                    : `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                color:
                  isStepTwoPending || !allApisTestedSuccessfully
                    ? colors.TextBody
                    : "#ffffff",
                border:
                  isStepTwoPending || !allApisTestedSuccessfully
                    ? `1px solid ${colors.CardBorder}`
                    : "none",
                cursor:
                  isStepTwoPending || !allApisTestedSuccessfully
                    ? "not-allowed"
                    : "pointer",
                opacity: 1,
              }}
              disabled={isStepTwoPending || !allApisTestedSuccessfully}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupStep2;
