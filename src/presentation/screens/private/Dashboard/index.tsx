import React, { FC, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import { showToast } from "../../../../utils/toasts";
import {
  RocketIcon,
  DatabaseIcon,
  LayoutGridIcon,
  TerminalIcon,
  SlidersIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/dashboard.module.css";
import {
  logout,
  saveCompanyApiDetails,
  analyzeSingleCompanyApi,
  saveCompanyUiSelection,
} from "../../../../adapters/api/authApi";
import type {
  ToolUiType,
  ToolUiConfig,
  ApiConnection,
} from "../../../../interfaces/auth/auth.interface";
import {
  generateNewMcpDescription,
  formatMcpDescriptionWithAi,
  GenerateDescriptionInput,
} from "../../../../utils/mcpAiDescription";

const UI_TYPE_LABELS: Record<ToolUiType, string> = {
  auto: "Auto (data-driven)",
  catalog: "Catalog Grid",
  mapcatalog: "Map View",
  table: "Table",
  dashboard: "Dashboard",
  profile: "Profile",
  hidden: "Hidden (text-only)",
};

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#10b98115", text: "#10b981" },
  POST: { bg: "#6366f115", text: "#6366f1" },
  PUT: { bg: "#f59e0b15", text: "#f59e0b" },
  PATCH: { bg: "#f59e0b15", text: "#f59e0b" },
  DELETE: { bg: "#ef444415", text: "#ef4444" },
};

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const {
    user,
    apisList,
    setApisList,
    selectedLayout,
    setSelectedLayout,
    clearAuth,
    updateApiUiConfig,
    updateApiDescription,
    googleMapsApiKey,
    setGoogleMapsApiKey,
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "apis" | "settings">(
    "dashboard",
  );
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save & AI state tracking
  const [aiGeneratingApiId, setAiGeneratingApiId] = useState<string | null>(null);
  const [aiMenuOpenApiId, setAiMenuOpenApiId] = useState<string | null>(null);
  const [autoSavingApiId, setAutoSavingApiId] = useState<string | null>(null);
  const [lastAutoSavedApiId, setLastAutoSavedApiId] = useState<string | null>(null);
  const [uploadingSampleApi, setUploadingSampleApi] = useState<ApiConnection | null>(null);
  const [sampleInputText, setSampleInputText] = useState<string>("");
  const [isAnalyzingSample, setIsAnalyzingSample] = useState<boolean>(false);

  const handleLogout = () => {
    logout()
      .then(() => {
        clearAuth();
        showToast("Signed out successfully.", "success");
        navigate({ to: "/login" });
      })
      .catch((err: any) => {
        showToast(
          err.message || "Failed to sign out. Please try again.",
          "error",
        );
      });
  };

  const buildApisPayload = (list: ApiConnection[]) => {
    return list.map((api) => {
      let baseUrl = "";
      let endpoint = api.apiEndpoint;
      if (
        api.apiEndpoint.startsWith("http://") ||
        api.apiEndpoint.startsWith("https://")
      ) {
        try {
          const parsed = new URL(api.apiEndpoint);
          baseUrl = parsed.origin;
          endpoint = parsed.pathname + parsed.search;
        } catch {
          baseUrl = "";
        }
      }

      return {
        name: api.apiName,
        method: api.apiMethod,
        baseUrl,
        endpoint,
        authType: api.apiAuthType,
        authHeader: api.apiAuthHeader,
        oauthTokenUrl: api.oauthTokenUrl,
        oauthClientId: api.oauthClientId,
        isWidgetEnabled: api.uiConfig?.uiEnabled !== false,
        isMapViewEnabled: Boolean(api.uiConfig?.mapEnabled),
        uiConfig: api.uiConfig || {
          uiEnabled: true,
          uiType: "auto" as ToolUiType,
          mapEnabled: false,
        },
        sampleResponse:
          api.sampleResponse || (api as any).sampleresponse || undefined,
        mcpDescription: api.mcpDescription || "",
        params:
          Array.isArray(api.params) && api.params.length > 0
            ? api.params
            : api.apiQueryParams
              ? [api.apiQueryParams]
              : [],
        headers:
          Array.isArray(api.headers) && api.headers.length > 0
            ? api.headers
            : api.apiHeaders
              ? [api.apiHeaders]
              : [],
        body: api.body || [],
        apiSchema: api.apiSchema
          ? {
              ...api.apiSchema,
              toolDescription:
                api.mcpDescription ||
                api.apiSchema.toolDescription ||
                "",
            }
          : api.apiSchema,
      };
    });
  };

  const persistSingleApiUi = async (
    api: ApiConnection,
    newUiConfig: ToolUiConfig,
  ) => {
    if (!user?.id) return;
    setAutoSavingApiId(api.id);

    try {
      const updatedList = apisList.map((a) =>
        a.id === api.id
          ? {
              ...a,
              uiConfig: newUiConfig,
              isWidgetEnabled: newUiConfig.uiEnabled,
              isMapViewEnabled: newUiConfig.mapEnabled,
            }
          : a,
      );
      const apisPayload = buildApisPayload(updatedList);
      await saveCompanyApiDetails(user.id, {
        apis: apisPayload as any,
        googleMapsApiKey,
      });
    } catch (err: any) {
      console.error("Auto-save failed:", err);
    } finally {
      setAutoSavingApiId(null);
      setLastAutoSavedApiId(api.id);
      setTimeout(() => setLastAutoSavedApiId(null), 2500);
    }
  };

  const handleToggleWidgetUi = async (api: ApiConnection) => {
    const currentUi = api.uiConfig || {
      uiEnabled: false,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };
    const updatedUi = { ...currentUi, uiEnabled: !currentUi.uiEnabled };
    updateApiUiConfig(api.id, { uiEnabled: updatedUi.uiEnabled });
    showToast(
      updatedUi.uiEnabled
        ? `Widget UI enabled for ${api.apiName || "API"}`
        : `Widget UI disabled for ${api.apiName || "API"}`,
      "success",
    );
    await persistSingleApiUi(api, updatedUi);
  };

  const handleToggleMap = async (api: ApiConnection) => {
    const currentUi = api.uiConfig || {
      uiEnabled: false,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };
    const updatedUi = { ...currentUi, mapEnabled: !currentUi.mapEnabled };
    updateApiUiConfig(api.id, { mapEnabled: updatedUi.mapEnabled });
    showToast(
      updatedUi.mapEnabled
        ? `Map view enabled for ${api.apiName || "API"}`
        : `Map view disabled for ${api.apiName || "API"}`,
      "success",
    );
    await persistSingleApiUi(api, updatedUi);
  };

  const handleLayoutChange = async (
    api: ApiConnection,
    newType: ToolUiType,
  ) => {
    const currentUi = api.uiConfig || {
      uiEnabled: false,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };
    const updatedUi = { ...currentUi, uiType: newType };
    updateApiUiConfig(api.id, { uiType: newType });
    showToast(
      `Layout updated to ${UI_TYPE_LABELS[newType]} for ${api.apiName || "API"}`,
      "success",
    );
    await persistSingleApiUi(api, updatedUi);
  };

  const handleToggleAllApis = async (enable: boolean) => {
    apisList.forEach((api) => updateApiUiConfig(api.id, { uiEnabled: enable }));
    showToast(enable ? "All APIs enabled" : "All APIs disabled", "success");

    if (!user?.id) return;
    try {
      const updatedList = apisList.map((a) => ({
        ...a,
        uiConfig: {
          ...(a.uiConfig || {
            uiEnabled: false,
            uiType: "auto" as ToolUiType,
            mapEnabled: false,
          }),
          uiEnabled: enable,
        },
        isWidgetEnabled: enable,
      }));
      const fullPayload = buildApisPayload(updatedList);
      await saveCompanyApiDetails(user.id, {
        apis: fullPayload as any,
        googleMapsApiKey,
      });
    } catch (err: any) {
      console.error("Failed to auto-save toggle all:", err);
    }
  };

  const handleSaveSampleAndAnalyze = async (
    api: ApiConnection,
    sampleJson: string,
  ) => {
    if (!user?.id) {
      showToast("User session not found. Please re-login.", "error");
      return;
    }
    let formattedJson = sampleJson;
    try {
      const parsed = JSON.parse(sampleJson);
      formattedJson = JSON.stringify(parsed, null, 2);
    } catch (e) {
      showToast(
        "Invalid JSON syntax. Please check the pasted JSON response.",
        "warning",
      );
      return;
    }

    const apiIndex =
      api.rawIndex !== undefined
        ? api.rawIndex
        : apisList.findIndex((a) => a.id === api.id);

    if (apiIndex === -1) {
      showToast("Could not find target API in list.", "error");
      return;
    }

    setIsAnalyzingSample(true);
    setAiGeneratingApiId(api.id);

    try {
      const res = await analyzeSingleCompanyApi(
        user.id,
        apiIndex,
        formattedJson,
      );
      if (res && res.success && res.data?.apiSchema) {
        const generatedSchema = res.data.apiSchema;
        const newToolDesc =
          generatedSchema.toolDescription ||
          api.mcpDescription ||
          "";

        updateApiDescription(api.id, newToolDesc);

        const updatedList = apisList.map((a) =>
          a.id === api.id
            ? {
                ...a,
                sampleResponse: formattedJson,
                apiSchema: {
                  ...generatedSchema,
                  toolDescription: newToolDesc,
                },
                mcpDescription: newToolDesc,
                isTested: true,
                isAnalyzed: true,
              }
            : a,
        );
        setApisList(updatedList);

        const apisPayload = buildApisPayload(updatedList);
        await saveCompanyApiDetails(user.id, {
          apis: apisPayload as any,
          googleMapsApiKey,
        });

        showToast(
          "API schema analyzed & tool description generated with Gemini AI!",
          "success",
        );
        setUploadingSampleApi(null);
        setSampleInputText("");
      } else {
        showToast(
          res?.message || "AI schema analysis could not generate schema.",
          "warning",
        );
      }
    } catch (err: any) {
      console.error("Schema analysis failed:", err);
      showToast(
        err.message || "Failed to analyze sample response with AI.",
        "error",
      );
    } finally {
      setIsAnalyzingSample(false);
      setAiGeneratingApiId(null);
    }
  };

  const handleGenerateAiDescription = async (
    api: ApiConnection,
    mode: "new" | "format" | "deep" | "upload",
  ) => {
    setAiMenuOpenApiId(null);
    if (mode === "upload") {
      setUploadingSampleApi(api);
      setSampleInputText(api.sampleResponse || (api as any).sampleresponse || "");
      return;
    }

    setAiGeneratingApiId(api.id);
    try {
      let finalDesc = "";
      let newSchema: any = null;

      if (mode === "deep" && user?.id) {
        const existingSample =
          api.sampleResponse || (api as any).sampleresponse;
        const apiIndex =
          api.rawIndex !== undefined
            ? api.rawIndex
            : apisList.findIndex((a) => a.id === api.id);

        if (apiIndex >= 0) {
          try {
            const res = await analyzeSingleCompanyApi(
              user.id,
              apiIndex,
              existingSample || undefined,
            );
            if (res?.data?.apiSchema) {
              newSchema = res.data.apiSchema;
              if (res.data.apiSchema.toolDescription) {
                finalDesc = res.data.apiSchema.toolDescription;
              }
            }
          } catch (deepErr) {
            console.warn(
              "Deep schema analysis failed, generating from spec:",
              deepErr,
            );
          }
        }
      }

      if (!finalDesc) {
        const input: GenerateDescriptionInput = {
          apiName: api.apiName,
          method: api.apiMethod,
          endpoint: api.apiEndpoint,
          companyName: user?.name,
          params: api.params,
          body: api.body,
          apiQueryParams: api.apiQueryParams,
          apiSchema: newSchema || api.apiSchema,
        };
        if (mode === "format") {
          finalDesc = formatMcpDescriptionWithAi(
            api.mcpDescription || "",
            input,
          );
        } else {
          finalDesc = generateNewMcpDescription(input);
        }
      }

      updateApiDescription(api.id, finalDesc);

      const updatedList = apisList.map((a) =>
        a.id === api.id
          ? {
              ...a,
              mcpDescription: finalDesc,
              apiSchema: newSchema
                ? { ...newSchema, toolDescription: finalDesc }
                : a.apiSchema
                  ? { ...a.apiSchema, toolDescription: finalDesc }
                  : a.apiSchema,
              ...(newSchema ? { isAnalyzed: true, isTested: true } : {}),
            }
          : a,
      );
      setApisList(updatedList);

      showToast(
        mode === "format"
          ? "Description polished with AI!"
          : mode === "deep"
            ? "API schema analyzed & description updated with Gemini AI!"
            : "MCP tool description generated with AI!",
        "success",
      );

      // Auto-save to DB
      if (user?.id) {
        const apisPayload = buildApisPayload(updatedList);
        await saveCompanyApiDetails(user.id, {
          apis: apisPayload as any,
          googleMapsApiKey,
        });
        setLastAutoSavedApiId(api.id);
        setTimeout(() => setLastAutoSavedApiId(null), 2500);
      }
    } catch (err: any) {
      showToast(
        err.message || "Failed to generate description with AI.",
        "error",
      );
    } finally {
      setAiGeneratingApiId(null);
    }
  };

  const handleBlurDescription = async (api: ApiConnection) => {
    if (!user?.id) return;
    try {
      const apisPayload = buildApisPayload(apisList);
      await saveCompanyApiDetails(user.id, {
        apis: apisPayload as any,
        googleMapsApiKey,
      });
      setLastAutoSavedApiId(api.id);
      setTimeout(() => setLastAutoSavedApiId(null), 2500);
    } catch (e) {
      console.error("Auto-saving description blur failed:", e);
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.id) {
      showToast(
        "No active company session found. Please sign in again.",
        "error",
      );
      return;
    }

    setIsSaving(true);
    try {
      const apisPayload = buildApisPayload(apisList);

      const res = await saveCompanyApiDetails(user.id, {
        apis: apisPayload as any,
        googleMapsApiKey,
      });

      if (res?.success !== false) {
        showToast("Configuration saved to database successfully!", "success");
      } else {
        showToast(res?.message || "Failed to save configuration.", "error");
      }
    } catch (err: any) {
      showToast(
        err.message || "Failed to save configuration. Please try again.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = apisList.filter(
    (a) => a.uiConfig?.uiEnabled !== false,
  ).length;

  return (
    <div
      className={styles.dashboardWrapper}
      style={{ background: colors.Background, color: colors.TextBody }}
    >
      {/* Sidebar Panel */}
      <aside
        className={styles.sidebar}
        style={{
          background: colors.BackgroundSecondary,
          borderColor: colors.Border,
        }}
      >
        <div className="flex flex-col gap-6">
          <div className={styles.logoArea}>
            <RocketIcon size={24} color={colors.TextHighlightedHeading} />
            <span
              className={styles.logoText}
              style={{
                background: `linear-gradient(135deg, ${colors.TextGradientOne}, ${colors.TextGradientTwo}, ${colors.TextGradientThree})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SoftTech AI
            </span>
          </div>

          <nav className={styles.navLinks}>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`${styles.navLink} ${activeTab === "dashboard" ? styles.navLinkActive : ""}`}
            >
              <LayoutGridIcon
                size={18}
                color={
                  activeTab === "dashboard"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("apis")}
              className={`${styles.navLink} ${activeTab === "apis" ? styles.navLinkActive : ""}`}
            >
              <DatabaseIcon
                size={18}
                color={
                  activeTab === "apis"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              API Connections
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`${styles.navLink} ${activeTab === "settings" ? styles.navLinkActive : ""}`}
            >
              <SlidersIcon
                size={18}
                color={
                  activeTab === "settings"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              UI Settings
            </button>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <UserIcon size={20} color={colors.TextHighlightedHeading} />
            </div>
            <div className={styles.userInfo}>
              <span
                className={styles.companyName}
                style={{ color: colors.TextHeading }}
              >
                {user?.name || "Nexus Corp"}
              </span>
              <span className={styles.userEmail}>
                {user?.email || "admin@company.com"}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.dashboardHeader}>
          <div>
            <h1
              className={styles.welcomeTitle}
              style={{ color: colors.TextHeading }}
            >
              {user?.name || "Company"} Console
            </h1>
            <p className={styles.subtitle}>
              Manage API connections and configure how each tool renders in the
              widget.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "apis" && (
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-white disabled:opacity-60 shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {isSaving ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={toggleTheme}
              className={styles.themeBtn}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon size={18} color={colors.TextHeading} />
              ) : (
                <MoonIcon size={18} color={colors.TextHeading} />
              )}
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <>
            <div
              className={styles.workspaceCard}
              style={{
                background: colors.BackgroundSecondary,
                borderColor: colors.Border,
              }}
            >
              <div className={styles.workspaceHeader}>
                <div>
                  <h3
                    className={styles.workspaceTitle}
                    style={{ color: colors.TextHeading }}
                  >
                    Under Development
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This page is currently under development. Please check back
                    later.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "apis" && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div
              className="p-4 rounded-2xl border flex items-center justify-between"
              style={{
                background: colors.BackgroundSecondary,
                borderColor: colors.Border,
              }}
            >
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: colors.TextHeading }}
                >
                  {apisList.length} API{apisList.length !== 1 ? "s" : ""}{" "}
                  Connected
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {enabledCount} with widget UI enabled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAllApis(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80"
                  style={{
                    borderColor: colors.Border,
                    color: colors.TextBody,
                    background: colors.Background,
                  }}
                >
                  Enable All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllApis(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80"
                  style={{
                    borderColor: colors.Border,
                    color: colors.TextBody,
                    background: colors.Background,
                  }}
                >
                  Disable All
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-white disabled:opacity-60 shadow-sm cursor-pointer hover:opacity-90 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  {isSaving ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* API cards */}
            {apisList.map((api) => {
              const uiCfg = api.uiConfig || {
                uiEnabled: false,
                uiType: "auto" as ToolUiType,
                mapEnabled: false,
              };
              const isExpanded = expandedApi === api.id;
              const methodStyle = METHOD_COLORS[api.apiMethod] || METHOD_COLORS.GET;

              return (
                <div
                  key={api.id}
                  className="rounded-2xl border overflow-hidden transition-all"
                  style={{
                    background: colors.BackgroundSecondary,
                    borderColor:
                      uiCfg.uiEnabled && isExpanded
                        ? "#6366f140"
                        : colors.Border,
                  }}
                >
                  {/* Card header — always visible */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedApi(isExpanded ? null : api.id)
                    }
                    className="w-full p-4 flex items-center gap-4 text-left transition-colors"
                    style={{ background: "transparent" }}
                  >
                    {/* Method badge */}
                    <span
                      className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-[11px] font-bold tracking-wider shrink-0"
                      style={{
                        background: methodStyle.bg,
                        color: methodStyle.text,
                      }}
                    >
                      {api.apiMethod}
                    </span>

                    {/* Name + endpoint */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className="font-semibold text-sm truncate"
                          style={{ color: colors.TextHeading }}
                        >
                          {api.apiName || "Unnamed API"}
                        </h4>
                        {/* Widget status pill */}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                          style={{
                            background: uiCfg.uiEnabled
                              ? "#10b98118"
                              : "#6b728018",
                            color: uiCfg.uiEnabled ? "#10b981" : "#6b7280",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: uiCfg.uiEnabled ? "#10b981" : "#6b7280",
                            }}
                          />
                          {uiCfg.uiEnabled ? "Widget ON" : "Widget OFF"}
                        </span>
                      </div>
                      <p
                        className="font-mono text-[11px] mt-0.5 truncate"
                        style={{ color: "#6b7280" }}
                      >
                        {api.apiEndpoint || "No endpoint"}
                      </p>
                    </div>

                    {/* Chevron */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0 transition-transform"
                      style={{
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                        color: "#6b7280",
                      }}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Expanded controls */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-2 border-t"
                      style={{ borderColor: colors.Border }}
                    >
                      {/* API details row */}
                      <div
                        className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] mb-4"
                        style={{ color: "#9ca3af" }}
                      >
                        <span>
                          Auth:{" "}
                          <span style={{ color: colors.TextBody }}>
                            {api.apiAuthType}
                          </span>
                        </span>
                        {api.apiAuthHeader && (
                          <span>
                            Header:{" "}
                            <span style={{ color: colors.TextBody }}>
                              {api.apiAuthHeader}
                            </span>
                          </span>
                        )}
                        {api.oauthTokenUrl && (
                          <span>
                            OAuth:{" "}
                            <span style={{ color: colors.TextBody }}>
                              Connected
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Widget UI Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Enable/Disable */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={uiCfg.uiEnabled}
                            onClick={() => handleToggleWidgetUi(api)}
                            className="relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors cursor-pointer"
                            style={{
                              background: uiCfg.uiEnabled ? "#6366f1" : "#374151",
                            }}
                          >
                            <span
                              className="inline-block h-[16px] w-[16px] rounded-full bg-white transition-transform"
                              style={{
                                transform: uiCfg.uiEnabled
                                  ? "translateX(20px)"
                                  : "translateX(3px)",
                              }}
                            />
                          </button>
                          <span
                            className="text-xs font-medium"
                            style={{ color: colors.TextBody }}
                          >
                            Show widget UI
                          </span>
                        </label>

                        {/* Layout selector */}
                        {uiCfg.uiEnabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "#9ca3af" }}>
                              Layout
                            </span>
                            <select
                              value={uiCfg.uiType}
                              onChange={(e) =>
                                handleLayoutChange(api, e.target.value as ToolUiType)
                              }
                              className="text-xs rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer"
                              style={{
                                background: colors.Background,
                                borderColor: colors.Border,
                                color: colors.TextBody,
                              }}
                            >
                              {Object.entries(UI_TYPE_LABELS).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        )}

                        {/* Map toggle — always visible when card expanded */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={uiCfg.mapEnabled}
                            onClick={() => handleToggleMap(api)}
                            className="relative inline-flex h-[18px] w-[32px] items-center rounded-full transition-colors cursor-pointer"
                            style={{
                              background: uiCfg.mapEnabled ? "#6366f1" : "#374151",
                            }}
                          >
                            <span
                              className="inline-block h-[12px] w-[12px] rounded-full bg-white transition-transform"
                              style={{
                                transform: uiCfg.mapEnabled
                                  ? "translateX(16px)"
                                  : "translateX(3px)",
                              }}
                            />
                          </button>
                          <span
                            className="text-xs"
                            style={{ color: "#9ca3af" }}
                          >
                            Map view
                          </span>
                        </label>
                      </div>

                      {/* MCP Tool Description */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-2 mb-1.5 relative">
                          <div className="flex items-center gap-2">
                            <label
                              className="text-[11px] font-medium"
                              style={{ color: "#9ca3af" }}
                            >
                              MCP Tool Description{" "}
                              <span style={{ color: "#6b7280" }}>
                                (shown to ChatGPT)
                              </span>
                            </label>
                            {lastAutoSavedApiId === api.id && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium transition-all">
                                Auto-saved ✓
                              </span>
                            )}
                            {autoSavingApiId === api.id && (
                              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <span className="inline-block w-2 h-2 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                Saving...
                              </span>
                            )}
                          </div>

                          {/* Sample JSON Upload Button & Generate with AI Button */}
                          <div className="flex items-center gap-2">
                            {(() => {
                              const hasValidSchema = Boolean(
                                api.apiSchema &&
                                (api.apiSchema.entity || (Array.isArray(api.apiSchema.fields) && api.apiSchema.fields.length > 0)) &&
                                api.isAnalyzed !== false
                              );
                              return (
                                <button
                                  type="button"
                                  disabled={hasValidSchema}
                                  onClick={() => {
                                    setUploadingSampleApi(api);
                                    setSampleInputText(
                                      api.sampleResponse ||
                                        (api as any).sampleresponse ||
                                        "",
                                    );
                                  }}
                                  title={
                                    hasValidSchema
                                      ? "Sample response already analyzed & verified (Schema active)"
                                      : "Upload sample JSON response to run AI schema analysis"
                                  }
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                                    hasValidSchema
                                      ? "opacity-50 cursor-not-allowed bg-white/5 text-gray-400 border border-white/10"
                                      : "cursor-pointer bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 shadow-sm"
                                  }`}
                                >
                                  <span>{hasValidSchema ? "✓" : "⚠️"}</span>
                                  <span>{hasValidSchema ? "Sample Analyzed" : "Upload Sample JSON"}</span>
                                </button>
                              );
                            })()}

                            <div className="relative">
                              <button
                                type="button"
                                disabled={aiGeneratingApiId === api.id}
                                onClick={() =>
                                  setAiMenuOpenApiId(
                                    aiMenuOpenApiId === api.id ? null : api.id,
                                  )
                                }
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-60"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #6366f1, #a855f7)",
                                  color: "#ffffff",
                                }}
                              >
                                {aiGeneratingApiId === api.id ? (
                                  <>
                                    <span className="inline-block w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
                                    <span>Generating with AI...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✨</span>
                                    <span>Generate with AI</span>
                                    <span className="text-[9px] opacity-70">▼</span>
                                  </>
                                )}
                              </button>

                              {/* AI Dropdown Menu */}
                              {aiMenuOpenApiId === api.id && (
                                <div
                                  className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border p-1.5 shadow-2xl z-30 transition-all"
                                  style={{
                                    background: colors.BackgroundSecondary,
                                    borderColor: colors.Border,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateAiDescription(api, "deep")
                                    }
                                    className="w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 hover:bg-indigo-500/10 cursor-pointer"
                                  >
                                    <span className="text-base shrink-0">⚡</span>
                                    <div>
                                      <div
                                        className="font-semibold text-xs"
                                        style={{ color: colors.TextHeading }}
                                      >
                                        Analyze with Gemini AI
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                        Run full schema analysis and tool description with Gemini
                                      </div>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateAiDescription(api, "upload")
                                    }
                                    className="w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 hover:bg-indigo-500/10 cursor-pointer mt-0.5"
                                  >
                                    <span className="text-base shrink-0">📥</span>
                                    <div>
                                      <div
                                        className="font-semibold text-xs"
                                        style={{ color: colors.TextHeading }}
                                      >
                                        Upload Sample JSON & Re-Analyze
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                        Paste or upload a new JSON sample for AI analysis
                                      </div>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateAiDescription(api, "new")
                                    }
                                    className="w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 hover:bg-indigo-500/10 cursor-pointer mt-0.5"
                                  >
                                    <span className="text-base shrink-0">✨</span>
                                    <div>
                                      <div
                                        className="font-semibold text-xs"
                                        style={{ color: colors.TextHeading }}
                                      >
                                        Generate New Description
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                        Synthesize from endpoint, method, params, and schema
                                      </div>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateAiDescription(api, "format")
                                    }
                                    className="w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 hover:bg-indigo-500/10 cursor-pointer mt-0.5"
                                  >
                                    <span className="text-base shrink-0">🪄</span>
                                    <div>
                                      <div
                                        className="font-semibold text-xs"
                                        style={{ color: colors.TextHeading }}
                                      >
                                        Format / Polish Description
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                        Clean current text and structure supported parameters
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <textarea
                          value={api.mcpDescription || ""}
                          onChange={(e) =>
                            updateApiDescription(api.id, e.target.value)
                          }
                          onBlur={() => handleBlurDescription(api)}
                          placeholder="Auto-generated from API schema if left empty..."
                          rows={3}
                          className="w-full text-xs rounded-lg px-3 py-2 border outline-none resize-none transition-colors"
                          style={{
                            background: colors.Background,
                            borderColor: colors.Border,
                            color: colors.TextBody,
                          }}
                        />
                        <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>
                          {api.mcpDescription
                            ? `${api.mcpDescription.length} characters — custom description active`
                            : "Using auto-generated description from API schema"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {apisList.length === 0 && (
              <div
                className="p-8 rounded-2xl border text-center"
                style={{
                  background: colors.BackgroundSecondary,
                  borderColor: colors.Border,
                }}
              >
                <div className="mx-auto mb-3">
                  <DatabaseIcon size={32} color="#4b5563" />
                </div>
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  No API connections yet. Register your first API during
                  onboarding.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div
            className={styles.workspaceCard}
            style={{
              background: colors.BackgroundSecondary,
              borderColor: colors.Border,
            }}
          >
            <h3
              className={styles.workspaceTitle}
              style={{ color: colors.TextHeading }}
            >
              UI Curator Customizer
            </h3>
            <p className="text-xs text-slate-500">
              Redefine your structural layout preference. Changes apply
              instantly to all telemetry visualizers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {(["dashboard", "catalog", "table", "timeline"] as const).map(
                (lay) => (
                  <div
                    key={lay}
                    onClick={async () => {
                      setSelectedLayout(lay);
                      showToast(
                        `Interface curator set to ${lay.toUpperCase()} layout.`,
                        "success",
                      );
                      if (user?.id) {
                        try {
                          await saveCompanyUiSelection(user.id, {
                            layout: lay,
                          } as any);
                        } catch (err) {
                          console.error("Failed to auto-save layout selection:", err);
                        }
                      }
                    }}
                    className="p-6 rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between"
                    style={
                      selectedLayout === lay
                        ? {
                            background: colors.UISelectionCardBackground,
                            borderColor: colors.CardActiveBorder,
                          }
                        : {
                            background: colors.Background,
                            borderColor: colors.Border,
                          }
                    }
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/10">
                        {lay === "dashboard" && (
                          <LayoutGridIcon
                            size={20}
                            color={colors.TextHighlightedHeading}
                          />
                        )}
                        {lay === "catalog" && (
                          <SlidersIcon
                            size={20}
                            color={colors.TextHighlightedHeading}
                          />
                        )}
                        {lay === "table" && (
                          <DatabaseIcon
                            size={20}
                            color={colors.TextHighlightedHeading}
                          />
                        )}
                        {lay === "timeline" && (
                          <TerminalIcon
                            size={20}
                            color={colors.TextHighlightedHeading}
                          />
                        )}
                      </div>
                      {selectedLayout === lay && (
                        <span className="text-xs font-bold text-indigo-400">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base mb-1 text-slate-200 capitalize">
                        {lay} Layout
                      </h4>
                      <p className="text-xs text-slate-500 font-sans leading-relaxed">
                        {lay === "dashboard" &&
                          "Modular bento-style layout optimized for data telemetry, analytics, and interactive metrics dashboards."}
                        {lay === "catalog" &&
                          "Grid layout optimized for item cards, product listings, travel bookings, and category catalogs."}
                        {lay === "table" &&
                          "Condensed spreadsheet-style view for power users handling massive data sets, transaction ledger list."}
                        {lay === "timeline" &&
                          "Milestone progress tracker optimized for package shipping routes, logistics, and process stages."}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sample Response Upload & AI Schema Analysis Modal */}
      {uploadingSampleApi && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl p-6 border shadow-2xl transition-all"
            style={{
              background: colors.Headerbackground || "#111827",
              borderColor: colors.CardBorder || "#374151",
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: colors.CardBorder }}
            >
              <div>
                <h3
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: colors.TextHeading }}
                >
                  <span>Upload Sample Response JSON</span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-indigo-500/20 text-indigo-300">
                    {uploadingSampleApi.apiName || uploadingSampleApi.apiEndpoint}
                  </span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: colors.TextBody }}>
                  Paste a sample JSON response from your API. Gemini AI will analyze it to detect entities, fields, and generate optimal MCP tool instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadingSampleApi(null)}
                className="text-gray-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="text-xs font-semibold"
                  style={{ color: colors.TextHeading }}
                >
                  JSON Response Body
                </label>
                <label className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 font-medium">
                  <span>📁 Upload .json file</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        setSampleInputText(content || "");
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
              <textarea
                value={sampleInputText}
                onChange={(e) => setSampleInputText(e.target.value)}
                placeholder={'{\n  "status": "success",\n  "data": [\n    { "id": "1", "name": "Item Name", "price": 100 }\n  ]\n}'}
                rows={12}
                className="w-full text-xs font-mono rounded-xl p-3 border outline-none resize-none transition-colors"
                style={{
                  background: colors.Background || "#030712",
                  borderColor: colors.CardBorder || "#374151",
                  color: "#10b981",
                }}
              />
            </div>

            <div
              className="flex items-center justify-end gap-3 mt-4 pt-3 border-t"
              style={{ borderColor: colors.CardBorder }}
            >
              <button
                type="button"
                onClick={() => setUploadingSampleApi(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                style={{
                  background: "transparent",
                  borderColor: colors.CardBorder,
                  color: colors.TextBody,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAnalyzingSample || !sampleInputText.trim()}
                onClick={() =>
                  handleSaveSampleAndAnalyze(uploadingSampleApi, sampleInputText)
                }
                className="px-5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer text-white shadow-lg active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                }}
              >
                {isAnalyzingSample ? (
                  <>
                    <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Save & Analyze with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
