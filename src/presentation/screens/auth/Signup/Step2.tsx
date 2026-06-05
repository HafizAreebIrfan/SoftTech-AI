import React, { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import {
  useAuthStore,
  ApiConnection,
} from "../../../../infrastructure/store/authStore";
import { saveCompanyApiDetails } from "../../../../adapters/api/authApi";
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
import { ApisInformation } from "../../../../domain/entities/CompanyRegister";

const getBaseUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return urlStr;
  }
};

const getEndpointPath = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return url.pathname + url.search;
  } catch (e) {
    return "/";
  }
};

const SignupStep2: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { companyId, apisList, setApisList } = useAuthStore();

  const { mutate: stepTwoMutate, isPending: isStepTwoPending } = useMutation({
    mutationFn: ({ id, apis }: { id: string; apis: ApisInformation[] }) =>
      saveCompanyApiDetails(id, apis),
    onSuccess: (res) => {
      if (res && res.success) {
        showToast("API configurations saved successfully!", "success");
        navigate({ to: "/signup/step3" });
      } else {
        showToast(res?.message || "Failed to save API details.", "error");
      }
    },
    onError: (err: any) => {
      showToast(err.message || "An error occurred during Step 2.", "error");
    },
  });

  const handleAddApi = () => {
    const newId = `api-${Date.now()}`;
    setApisList((prev) => [
      ...prev,
      {
        id: newId,
        apiName: "",
        apiMethod: "GET",
        apiEndpoint: "",
        apiAuthType: "No Auth",
        apiCredentials: "",
        apiQueryParams: "",
        apiCheckoutTemplate: "",
        apiAuthHeader: "",
        oauthTokenUrl: "",
        oauthClientId: "",
        apiHeaders: "",
      },
    ]);
  };

  const handleDeleteApi = (id: string) => {
    if (apisList.length > 1) {
      setApisList((prev) => prev.filter((api) => api.id !== id));
    }
  };

  const updateApiField = (
    id: string,
    field: keyof ApiConnection,
    value: string,
  ) => {
    setApisList((prev) =>
      prev.map((api) => (api.id === id ? { ...api, [field]: value } : api)),
    );
  };

  const handleStepTwoSubmit = () => {
    if (!companyId) {
      showToast("Company ID is missing. Please restart signup.", "error");
      navigate({ to: "/signup/step1" });
      return;
    }

    // Validate fields
    for (const api of apisList) {
      if (!api.apiName.trim()) {
        showToast("API Name is required.", "warning");
        return;
      }
      if (!api.apiEndpoint.trim()) {
        showToast(`Endpoint URL is required for "${api.apiName}".`, "warning");
        return;
      }

      // Check URL format
      try {
        new URL(api.apiEndpoint);
      } catch (e) {
        showToast(
          `Invalid URL format in Endpoint URL for "${api.apiName}".`,
          "warning",
        );
        return;
      }

      // Auth validation
      if (api.apiAuthType === "Bearer Token" && !api.apiCredentials?.trim()) {
        showToast(`Bearer Token is required for "${api.apiName}".`, "warning");
        return;
      }
      if (api.apiAuthType === "API Key") {
        if (!api.apiAuthHeader?.trim()) {
          showToast(
            `API Key Header Name is required for "${api.apiName}".`,
            "warning",
          );
          return;
        }
        if (!api.apiCredentials?.trim()) {
          showToast(
            `API Key Value is required for "${api.apiName}".`,
            "warning",
          );
          return;
        }
      }
      if (api.apiAuthType === "OAuth 2.0") {
        if (!api.oauthTokenUrl?.trim()) {
          showToast(
            `OAuth 2.0 Token URL is required for "${api.apiName}".`,
            "warning",
          );
          return;
        }
        try {
          new URL(api.oauthTokenUrl);
        } catch (e) {
          showToast(
            `Invalid OAuth Token URL format for "${api.apiName}".`,
            "warning",
          );
          return;
        }
        if (!api.oauthClientId?.trim()) {
          showToast(
            `OAuth 2.0 Client ID is required for "${api.apiName}".`,
            "warning",
          );
          return;
        }
        if (!api.apiCredentials?.trim()) {
          showToast(
            `OAuth 2.0 Client Secret is required for "${api.apiName}".`,
            "warning",
          );
          return;
        }
      }

      // Custom headers (optional, but must be valid JSON)
      if (api.apiHeaders && api.apiHeaders.trim()) {
        try {
          JSON.parse(api.apiHeaders);
        } catch (e) {
          showToast(
            `Invalid JSON structure in Custom Headers for "${api.apiName}".`,
            "error",
          );
          return;
        }
      }

      // Query Parameters (required, must be valid JSON)
      if (!api.apiQueryParams || !api.apiQueryParams.trim()) {
        showToast(
          `Query Parameters are required for "${api.apiName}".`,
          "warning",
        );
        return;
      }
      try {
        JSON.parse(api.apiQueryParams);
      } catch (e) {
        showToast(
          `Invalid JSON structure in Query Parameters for "${api.apiName}".`,
          "error",
        );
        return;
      }
    }

    const apisPayload = apisList.map((api) => {
      const isbearertoken =
        api.apiAuthType === "Bearer Token"
          ? {
              bearerToken: api.apiCredentials,
            }
          : {};
      const isapikey =
        api.apiAuthType === "API Key"
          ? {
              apiKey: api.apiCredentials,
              authHeader: api.apiAuthHeader,
            }
          : {};
      const isoauth =
        api.apiAuthType === "OAuth 2.0"
          ? {
              oauthTokenUrl: api.oauthTokenUrl,
              oauthClientId: api.oauthClientId,
              oauthClientSecret: api.apiCredentials,
            }
          : {};
      return {
        name: api.apiName,
        method: api.apiMethod,
        baseUrl: getBaseUrl(api.apiEndpoint),
        endpoint: getEndpointPath(api.apiEndpoint),
        authtype: api.apiAuthType,
        samplequery: api.apiQueryParams,
        authType: api.apiAuthType,
        headers: api.apiHeaders ? [api.apiHeaders] : [],
        params: api.apiQueryParams ? [api.apiQueryParams] : [],
        ...isbearertoken,
        ...isapikey,
        ...isoauth,
      };
    });

    stepTwoMutate({ id: companyId, apis: apisPayload });
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
                    <div className="relative">
                      <span className="absolute left-4 top-4">
                        <ServerIcon size={18} color={colors.IconColor} />
                      </span>
                      <input
                        type="url"
                        placeholder="https://api.domain.com/v1/data"
                        value={api.apiEndpoint}
                        onChange={(e) =>
                          updateApiField(api.id, "apiEndpoint", e.target.value)
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                            <label
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                              style={{ color: colors.TextBody }}
                            >
                              Token / Grant URL{" "}
                              <span style={{ color: colors.WarningText }}>
                                *
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-3.5">
                                <ServerIcon
                                  size={18}
                                  color={colors.IconColor}
                                />
                              </span>
                              <input
                                type="url"
                                placeholder="https://api.domain.com/oauth/token"
                                value={api.oauthTokenUrl || ""}
                                onChange={(e) =>
                                  updateApiField(
                                    api.id,
                                    "oauthTokenUrl",
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
                              className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
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
                      className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                      style={{ color: colors.TextBody }}
                    >
                      Custom Headers (JSON string){" "}
                      <span className="text-slate-500 font-medium">
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
                  </div>
                </div>

                {/* Right segment: JSON highlighted visualizer preview */}
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <span
                      className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block"
                      style={{ color: colors.TextBody }}
                    >
                      Sample JSON Response
                    </span>
                    <div
                      className="text-[11px] p-4 font-mono leading-relaxed max-h-[220px] overflow-y-auto"
                      style={{
                        border: `1px solid ${colors.CardBorder}`,
                        borderRadius: "12px",
                        backgroundColor: colors.Background,
                      }}
                    >
                      <pre
                        className="text-left"
                        style={{ color: colors.TextBody }}
                      >
                        <span style={{ color: colors.TextHighlightedHeading }}>
                          "status"
                        </span>
                        :{" "}
                        <span style={{ color: colors.TextBody }}>"active"</span>
                        ,{"\n"}
                        <span style={{ color: colors.TextHighlightedHeading }}>
                          "data"
                        </span>
                        : &#123;{"\n"}
                        &nbsp;&nbsp;
                        <span style={{ color: colors.TextHighlightedHeading }}>
                          "coordinates"
                        </span>
                        : [
                        <span style={{ color: colors.TextBody }}>"X-89"</span>,{" "}
                        <span style={{ color: colors.TextBody }}>"Y-22"</span>],
                        {"\n"}
                        &nbsp;&nbsp;
                        <span style={{ color: colors.TextHighlightedHeading }}>
                          "telemetry"
                        </span>
                        : <span style={{ color: colors.TextBody }}>true</span>,
                        {"\n"}
                        &nbsp;&nbsp;
                        <span style={{ color: colors.TextHighlightedHeading }}>
                          "nodes"
                        </span>
                        :{" "}
                        <span style={{ color: colors.TextBody }}>"1,244"</span>
                        {"\n"}
                        &#125;,{"\n"}
                        <span style={{ color: colors.TextHighlightedHeading }}>
                          "timestamp"
                        </span>
                        :{" "}
                        <span style={{ color: colors.TextBody }}>
                          "2026-05-30T17:12Z"
                        </span>
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
              onClick={handleStepTwoSubmit}
              className={`${styles.btn}`}
              style={{
                background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                opacity: isStepTwoPending ? 0.7 : 1,
              }}
              disabled={isStepTwoPending}
            >
              {isStepTwoPending ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupStep2;
