import React, { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore, useSignupStore } from "../../../../hooks";
import { stepTwoSchema } from "../../../../infrastructure/validation/signupSchemas";
import {
  DatabaseIcon,
  TrashIcon,
  SlidersIcon,
  TerminalIcon,
  ServerIcon,
  KeyIcon,
  LockIcon,
  Plus,
  LeftArrowIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import styles from "../../../../styles/signup.module.css";

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
    stepOneData,
  } = useSignupStore();

  const getSuggestionTemplate = (
    industry: string,
    apiName: string,
    method: string,
  ) => {
    const ind = (industry || "").toLowerCase();
    const name = (apiName || "").toLowerCase();
    const m = (method || "GET").toUpperCase();

    if (ind.includes("travel") || ind.includes("booking")) {
      if (m === "GET") {
        return {
          search: "",
          status: "active",
          category: "",
          sortBy: "title",
          limit: 10,
          page: 1,
        };
      } else {
        return {
          name: "",
          phone: "",
          email: "",
          packageName: "",
          bookingDate: "",
          notes: "",
        };
      }
    } else if (ind.includes("ecommerce") || ind.includes("e-commerce")) {
      if (m === "GET") {
        return {
          search: "",
          category: "",
          status: "",
          sortBy: "price_asc",
          limit: 20,
          page: 1,
        };
      } else {
        return {
          customerName: "",
          email: "",
          productId: "",
          quantity: 1,
          totalAmount: 0.0,
          shippingAddress: "",
        };
      }
    } else if (ind.includes("food") || ind.includes("hospitality")) {
      if (m === "GET") {
        return {
          search: "",
          category: "",
          available: true,
          limit: 20,
          page: 1,
        };
      } else {
        return {
          customerName: "",
          phoneNumber: "",
          address: "",
          items: [{ itemId: "", quantity: 1 }],
          notes: "",
        };
      }
    } else if (ind.includes("logistics")) {
      if (m === "GET") {
        return {
          search: "",
          status: "in-transit",
          limit: 10,
          page: 1,
        };
      } else {
        return {
          sender: "",
          recipient: "",
          origin: "",
          destination: "",
          weight: "",
        };
      }
    }

    // Default template
    if (m === "GET") {
      return {
        search: "",
        limit: 20,
        page: 1,
      };
    } else {
      return {
        title: "",
        description: "",
      };
    }
  };

  const allApisTestedSuccessfully = apisList.every(
    (api) => apiTestStates[api.id]?.status === "success",
  );

  const anyApiHasError = apisList.some(
    (api) => apiTestStates[api.id]?.status === "error",
  );

  const getButtonText = () => {
    if (isStepTwoPending) return "Saving...";
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="mt-4 w-full mx-auto max-w-5xl text-left space-y-12"
    >
      <div
        className={`${styles.signupcard} mt-4`}
        style={{
          background: colors.BackgroundSecondary,
          border: `1px solid ${colors.CardBorder}`,
          borderLeft: `4px solid ${colors.CardActiveBorder}`,
          boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
        }}
      >
        <div className="space-y-2">
          <h2
            className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight mb-2"
            style={{ color: colors.TextHeading }}
          >
            API Configuration
          </h2>
          <p
            className="font-medium text-lg leading-relaxed max-w-2xl"
            style={{ color: colors.TextBody }}
          >
            Connect your interstellar data streams. Define endpoints,
            authentication protocols, and response mapping to fuel your AI
            curator.
          </p>
        </div>

        {apisList.map((api, index) => (
          <div
            key={api.id}
            className={styles.apiBlock}
            style={{
              background: colors.Background,
              border: `1px solid ${colors.CardBorder}`,
              boxShadow: `0 4px 12px ${colors.OverlayShadow}`,
            }}
          >
            <div
              className={styles.apiBlockHeader}
              style={{ borderBottom: `1px solid ${colors.HeaderBottomBorder}` }}
            >
              <div className="flex items-center gap-2">
                <DatabaseIcon size={16} color={colors.IconColor} />
                <span
                  className={styles.apiBlockTitle}
                  style={{ color: colors.TextHighlightedHeading }}
                >
                  API Connection #{index + 1} {index === 0 && "(Primary)"}
                </span>
              </div>
              {apisList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteApi(api.id)}
                  className={styles.deleteBtn}
                >
                  <TrashIcon size={14} color={colors.IconColor} /> Delete
                </button>
              )}
            </div>
            <div className={`relative p-8 md:p-12`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left segment forms */}
                <div className="lg:col-span-8 space-y-6">
                  <div className={styles.formField}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label
                          className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                          style={{ color: colors.TextBody }}
                        >
                          API Name{" "}
                          <span style={{ color: colors.WarningText }}>*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-4.5">
                            <SlidersIcon size={18} color={colors.IconColor} />
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Realtime Analytics Feed"
                            value={api.apiName}
                            onChange={(e) =>
                              updateApiField(api.id, "apiName", e.target.value)
                            }
                            className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                            style={{
                              background: colors.BackgroundSecondary,
                              borderColor: colors.CardBorder,
                              color: colors.TextBody,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                          style={{ color: colors.TextBody }}
                        >
                          HTTP Method{" "}
                          <span style={{ color: colors.WarningText }}>*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-4.5">
                            <TerminalIcon size={18} color={colors.IconColor} />
                          </span>
                          <select
                            value={api.apiMethod}
                            onChange={(e) =>
                              updateApiField(
                                api.id,
                                "apiMethod",
                                e.target.value as any,
                              )
                            }
                            className={`block w-full py-3 rounded-xl outline-none transition-all text-sm font-label`}
                            style={{
                              background: colors.BackgroundSecondary,
                              borderColor: colors.CardBorder,
                              color: colors.TextBody,
                            }}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label
                      className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                      style={{ color: colors.TextBody }}
                    >
                      Endpoint URL{" "}
                      <span style={{ color: colors.WarningText }}>*</span>
                    </label>
                    <div className="flex w-full font-label">
                      <div
                        className={`pl-4 px-3 flex items-center gap-2 rounded-l-xl border-r font-label text-xs tracking-wider ${styles.inputunedit}`}
                        style={{
                          background: colors.Background,
                          border: `1px solid ${colors.CardBorder}`,
                          color: colors.TextBody,
                        }}
                      >
                        <ServerIcon size={16} color={colors.IconColor} />
                        <span>https://</span>
                      </div>
                      <div className="relative grow flex items-center">
                        <input
                          type="text"
                          placeholder="api.domain.com/v1/data"
                          value={(api.apiEndpoint || "").replace(
                            /^https?:\/\//,
                            "",
                          )}
                          onChange={(e) =>
                            updateApiField(
                              api.id,
                              "apiEndpoint",
                              "https://" +
                                e.target.value.replace(/^https?:\/\//, ""),
                            )
                          }
                          className={`block w-full px-3 py-3 rounded-r-xl outline-none transition-all text-sm font-label`}
                          style={{
                            background: colors.BackgroundSecondary,
                            borderColor: colors.CardBorder,
                            color: colors.TextBody,
                          }}
                        />
                        <div
                          className={`pl-4 px-3 py-4 flex items-center gap-2 rounded-l-xl border-l font-label text-xs tracking-wider`}
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleTestApi(api)}
                            className="absolute right-0 px-3 py-3 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer select-none"
                            style={{
                              background: `linear-gradient(90deg,${colors.ButtonGradientOne} , ${colors.ButtonGradientTwo})`,
                              color: colors.TextHeading,
                            }}
                          >
                            {apiTestStates[api.id]?.status === "loading"
                              ? "Testing..."
                              : "Test API"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <div>
                      <label
                        className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                        style={{ color: colors.TextBody }}
                      >
                        Auth Type{" "}
                        <span style={{ color: colors.WarningText }}>*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3">
                          <KeyIcon size={18} color={colors.IconColor} />
                        </span>
                        <select
                          value={api.apiAuthType}
                          onChange={(e) =>
                            updateApiField(
                              api.id,
                              "apiAuthType",
                              e.target.value,
                            )
                          }
                          className={`block w-full text-sm font-label`}
                          style={{
                            background: colors.BackgroundSecondary,
                            borderColor: colors.CardBorder,
                            color: colors.TextBody,
                          }}
                        >
                          <option value="No Auth">No Auth</option>
                          <option value="API Key">API Key</option>
                          <option value="OAuth 2.0">OAuth 2.0</option>
                          <option value="Bearer Token">Bearer Token</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {api.apiAuthType !== "No Auth" && (
                    <div className={styles.formField}>
                      {api.apiAuthType === "Bearer Token" && (
                        <div>
                          <label
                            className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                            style={{ color: colors.TextBody }}
                          >
                            Bearer Token{" "}
                            <span style={{ color: colors.WarningText }}>*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5">
                              <LockIcon size={18} color={colors.IconColor} />
                            </span>
                            <input
                              type="password"
                              placeholder="Enter Bearer Token"
                              value={api.apiCredentials || ""}
                              onChange={(e) =>
                                updateApiField(
                                  api.id,
                                  "apiCredentials",
                                  e.target.value,
                                )
                              }
                              className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                              style={{
                                background: colors.BackgroundSecondary,
                                borderColor: colors.CardBorder,
                                color: colors.TextBody,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {api.apiAuthType === "API Key" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                              style={{ color: colors.TextBody }}
                            >
                              API Key Header Name{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-3.5">
                                <SlidersIcon
                                  size={18}
                                  color={colors.IconColor}
                                />
                              </span>
                              <input
                                type="text"
                                placeholder="e.g. X-API-Key"
                                value={api.apiAuthHeader || ""}
                                onChange={(e) =>
                                  updateApiField(
                                    api.id,
                                    "apiAuthHeader",
                                    e.target.value,
                                  )
                                }
                                className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                style={{
                                  background: colors.BackgroundSecondary,
                                  borderColor: colors.CardBorder,
                                  color: colors.TextBody,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                              style={{ color: colors.TextBody }}
                            >
                              API Key Value{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-3.5">
                                <LockIcon size={18} color={colors.IconColor} />
                              </span>
                              <input
                                type="password"
                                placeholder="Enter API Key"
                                value={api.apiCredentials || ""}
                                onChange={(e) =>
                                  updateApiField(
                                    api.id,
                                    "apiCredentials",
                                    e.target.value,
                                  )
                                }
                                className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                style={{
                                  background: colors.BackgroundSecondary,
                                  borderColor: colors.CardBorder,
                                  color: colors.TextBody,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {api.apiAuthType === "OAuth 2.0" && (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                          <div className="md:col-span-2 mb-0">
                            <label
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                              style={{ color: colors.TextBody }}
                            >
                              Token / Grant URL{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className="flex w-full font-label">
                              <div
                                className={`pl-4 px-3 flex items-center gap-2 rounded-l-xl border-r font-label text-xs tracking-wider ${styles.inputunedit}`}
                                style={{
                                  background: colors.Background,
                                  border: `1px solid ${colors.CardBorder}`,
                                  color: colors.TextBody,
                                }}
                              >
                                <ServerIcon
                                  size={16}
                                  color={colors.IconColor}
                                />
                                <span>https://</span>
                              </div>
                              <div className="relative grow">
                                <input
                                  type="text"
                                  placeholder="api.domain.com/oauth/token"
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
                                  className={`block w-full px-4 py-3 rounded-r-xl outline-none transition-all text-sm font-label`}
                                  style={{
                                    background: colors.BackgroundSecondary,
                                    borderColor: colors.CardBorder,
                                    color: colors.TextBody,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-0 block"
                              style={{ color: colors.TextBody }}
                            >
                              Client ID{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-3.5">
                                <KeyIcon size={18} color={colors.IconColor} />
                              </span>
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
                                className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                style={{
                                  background: colors.BackgroundSecondary,
                                  borderColor: colors.CardBorder,
                                  color: colors.TextBody,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-0 block"
                              style={{ color: colors.TextBody }}
                            >
                              Client Secret{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-3.5">
                                <LockIcon size={18} color={colors.IconColor} />
                              </span>
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
                                className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                style={{
                                  background: colors.BackgroundSecondary,
                                  borderColor: colors.CardBorder,
                                  color: colors.TextBody,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Custom Headers Field */}
                  <div className={styles.formField}>
                    <label
                      className="mt-3 font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                      style={{ color: colors.TextBody }}
                    >
                      Custom Headers (JSON string){" "}
                      <span
                        className="font-medium text-[9px]"
                        style={{ color: colors.TextBody }}
                      >
                        (Optional)
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-4.5">
                        <SlidersIcon size={18} color={colors.IconColor} />
                      </span>
                      <textarea
                        rows={2}
                        placeholder='{"X-Custom-Header": "value"}'
                        value={api.apiHeaders || ""}
                        onChange={(e) =>
                          updateApiField(api.id, "apiHeaders", e.target.value)
                        }
                        className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                        style={{
                          background: colors.BackgroundSecondary,
                          borderColor: colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      />
                    </div>
                  </div>

                  <div className={`mt-4 ${styles.formField}`}>
                    <div className="flex justify-between items-center mb-0">
                      <label
                        className="font-label text-[10px] uppercase tracking-widest font-bold block"
                        style={{ color: colors.TextBody }}
                      >
                        Query Parameters (JSON string){" "}
                        <span style={{ color: colors.WarningText }}>*</span>
                      </label>
                      <label
                        className="px-3 py-1.5 rounded-xl text-[10px] font-headline font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 border hover:opacity-80"
                        style={{
                          background: colors.Background,
                          borderColor: colors.CardBorder,
                          color: colors.TextHeading,
                        }}
                      >
                        <span>Upload JSON</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const text = event.target?.result as string;
                                const parsed = JSON.parse(text);
                                updateApiField(
                                  api.id,
                                  "apiQueryParams",
                                  JSON.stringify(parsed, null, 2),
                                );
                                showToast(
                                  "JSON uploaded and validated successfully!",
                                  "success",
                                );
                              } catch (err) {
                                showToast(
                                  "Invalid JSON file content. Please check the format.",
                                  "error",
                                );
                              }
                            };
                            reader.readAsText(file);
                          }}
                        />
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-4.5">
                        <SlidersIcon size={18} color={colors.IconColor} />
                      </span>
                      <textarea
                        rows={4}
                        placeholder='{"limit": 50}'
                        value={api.apiQueryParams}
                        onChange={(e) =>
                          updateApiField(
                            api.id,
                            "apiQueryParams",
                            e.target.value,
                          )
                        }
                        className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                        style={{
                          background: colors.BackgroundSecondary,
                          borderColor: colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      />
                    </div>
                    {(() => {
                      const suggestedTemplate = getSuggestionTemplate(
                        stepOneData?.primaryIndustry || "",
                        api.apiName || "",
                        api.apiMethod || "GET",
                      );
                      const suggestedJson = JSON.stringify(
                        suggestedTemplate,
                        null,
                        2,
                      );
                      return (
                        <div
                          className="mt-3 p-4 rounded-xl border border-dashed text-xs space-y-2 text-left"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <div className="flex justify-between items-center gap-4">
                            <span className="font-semibold text-slate-300">
                              💡 Suggested Fields for{" "}
                              {stepOneData?.primaryIndustry ||
                                "General Business"}{" "}
                              ({api.apiMethod})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                updateApiField(
                                  api.id,
                                  "apiQueryParams",
                                  suggestedJson,
                                );
                                showToast(
                                  "Applied template suggestions!",
                                  "success",
                                );
                              }}
                              className="px-2.5 py-1 rounded hover:opacity-85 font-bold transition-all text-[10px] cursor-pointer whitespace-nowrap"
                              style={{
                                background: `linear-gradient(90deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                                color: colors.TextHeading,
                              }}
                            >
                              Apply Suggestion
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            These fields will enable ChatGPT and the widget to
                            support filters, searching, and form submissions
                            automatically.
                          </p>
                          <pre className="text-[10px] text-slate-400 font-mono opacity-80 whitespace-pre overflow-x-auto max-w-full bg-black/20 p-2 rounded">
                            {suggestedJson}
                          </pre>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right segment: JSON highlighted visualizer preview */}
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <span
                      className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                      style={{ color: colors.TextBody }}
                    >
                      {apiTestStates[api.id]
                        ? "API Connection Logs & Output"
                        : "Sample JSON Response"}
                    </span>
                    <div
                      className="text-[11px] p-4 font-mono leading-relaxed h-[220px] overflow-y-auto"
                      style={{
                        border: `1px solid ${
                          apiTestStates[api.id]?.status === "error"
                            ? "#ef4444"
                            : apiTestStates[api.id]?.status === "success"
                              ? "#10b981"
                              : colors.CardBorder
                        }`,
                        borderRadius: "12px",
                        backgroundColor: colors.Background,
                      }}
                    >
                      <pre
                        className="text-left whitespace-pre-wrap break-all"
                        style={{
                          color:
                            apiTestStates[api.id]?.status === "error"
                              ? "#f87171"
                              : apiTestStates[api.id]?.status === "success"
                                ? "#34d399"
                                : colors.TextBody,
                        }}
                      >
                        {apiTestStates[api.id] ? (
                          apiTestStates[api.id].logs
                        ) : (
                          <>
                            <span
                              style={{ color: colors.TextHighlightedHeading }}
                            >
                              "status"
                            </span>
                            :{" "}
                            <span style={{ color: colors.TextBody }}>
                              "active"
                            </span>
                            ,{"\n"}
                            <span
                              style={{ color: colors.TextHighlightedHeading }}
                            >
                              "data"
                            </span>
                            : &#123;{"\n"}
                            &nbsp;&nbsp;
                            <span
                              style={{ color: colors.TextHighlightedHeading }}
                            >
                              "coordinates"
                            </span>
                            : [
                            <span style={{ color: colors.TextBody }}>
                              "X-89"
                            </span>
                            ,{" "}
                            <span style={{ color: colors.TextBody }}>
                              "Y-22"
                            </span>
                            ],
                            {"\n"}
                            &nbsp;&nbsp;
                            <span
                              style={{ color: colors.TextHighlightedHeading }}
                            >
                              "telemetry"
                            </span>
                            :{" "}
                            <span style={{ color: colors.TextBody }}>true</span>
                            ,{"\n"}
                            &nbsp;&nbsp;
                            <span
                              style={{ color: colors.TextHighlightedHeading }}
                            >
                              "nodes"
                            </span>
                            :{" "}
                            <span style={{ color: colors.TextBody }}>
                              "1,244"
                            </span>
                            {"\n"}
                            &#125;,{"\n"}
                            <span
                              style={{ color: colors.TextHighlightedHeading }}
                            >
                              "timestamp"
                            </span>
                            :{" "}
                            <span style={{ color: colors.TextBody }}>
                              "2026-05-30T17:12Z"
                            </span>
                          </>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add subsidiary stream connection */}
        <button
          type="button"
          onClick={handleAddApi}
          className="mt-4 w-full p-4 py-12 rounded-3xl border-2 border-dashed border-[#484751]/40 text-[#76747f] hover:border-indigo-500/50 hover:text-[#9fa7ff] transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer"
        >
          <div className="p-3 bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform">
            <Plus size={20} color={colors.IconColor} />
          </div>
          <span className="font-headline font-bold text-sm tracking-tight">
            + Add Another API Connection
          </span>
        </button>

        {/* FOOTER ACTION BAR FOR STEP 2 */}
        <div
          className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 pt-3"
          style={{ borderTop: `1px solid ${colors.Border}` }}
        >
          <button
            onClick={() => navigate({ to: "/signup/step1" })}
            className="w-full sm:w-auto px-6 py-3 font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LeftArrowIcon size={16} color={colors.IconColor} /> Back
          </button>

          <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-center">
            <span
              className={`text-xs font-semibold uppercase`}
              style={{ color: colors.TextBody }}
            >
              Step 2 of 3
            </span>
            <button
              onClick={handleStepTwoSubmitWithValidation}
              className={`${styles.btn}`}
              style={{
                background:
                  isStepTwoPending || !allApisTestedSuccessfully
                    ? colors.Background
                    : `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                color:
                  isStepTwoPending || !allApisTestedSuccessfully
                    ? colors.TextBody
                    : colors.TextHeading,
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
