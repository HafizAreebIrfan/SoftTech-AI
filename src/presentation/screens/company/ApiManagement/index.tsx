import React, { FC, useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import { showToast } from "../../../../utils/toast";
import {
  updateCompanyApis,
  updateCompanyApiUiSettings,
  analyzeSingleCompanyApi,
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
} from "../../../../utils/mcp";
import {
  DatabaseIcon,
  SparklesIcon,
  ChevronDownIcon,
  SearchIcon,
  CheckIcon,
  LeftArrowIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/dashboard.module.css";

interface ApiManagementProps {
  embedMode?: boolean;
  onNavigateToUpgrade?: () => void;
  onNavigateToSimulation?: () => void;
}

interface DraftState {
  isSaved: boolean;
  unsavedIds: string[];
  apis: ApiConnection[];
}

export const ApiManagement: FC<ApiManagementProps> = ({
  embedMode = false,
  onNavigateToUpgrade,
  onNavigateToSimulation,
}) => {
  const navigate = useNavigate();
  const {
    user,
    apisList,
    setApisList,
    updateApiUiConfig,
    updateApiDescription,
    MapsApiKey,
  } = useAuthStore();

  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingApiId, setSavingApiId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Track API IDs that have changes in local draft that are unsaved to DB
  const [unsavedApiIds, setUnsavedApiIds] = useState<Set<string>>(new Set());

  // AI & Sample analysis state
  const [aiGeneratingApiId, setAiGeneratingApiId] = useState<string | null>(
    null,
  );
  const [uploadingSampleApi, setUploadingSampleApi] =
    useState<ApiConnection | null>(null);
  const [sampleInputText, setSampleInputText] = useState<string>("");
  const [isAnalyzingSample, setIsAnalyzingSample] = useState<boolean>(false);

  const draftKey = user?.id
    ? `softtech_apis_draft_${user.id}`
    : "softtech_apis_draft_default";
  const loadedDraftKey = useRef<string | null>(null);

  // Load local draft on initial mount with strict isSaved checking
  useEffect(() => {
    if (loadedDraftKey.current === draftKey) return;
    try {
      const savedDraftStr = localStorage.getItem(draftKey);
      if (savedDraftStr) {
        const parsed = JSON.parse(savedDraftStr);
        if (parsed && typeof parsed === "object") {
          // Format with metadata: { isSaved: boolean, unsavedIds: string[], apis: ApiConnection[] }
          if ("isSaved" in parsed) {
            if (Array.isArray(parsed.apis) && parsed.apis.length > 0) {
              setApisList(parsed.apis);
            }
            if (
              parsed.isSaved === true ||
              !parsed.unsavedIds ||
              parsed.unsavedIds.length === 0
            ) {
              // Completely saved previously - NEVER prompt for unsaved changes on refresh!
              setUnsavedApiIds(new Set());
            } else {
              setUnsavedApiIds(new Set(parsed.unsavedIds));
              showToast(
                `Restored ${parsed.unsavedIds.length} unsaved local draft change(s). Click 'Save API' or 'Save Configuration' to persist to database.`,
                "info",
              );
            }
          } else if (Array.isArray(parsed)) {
            // Legacy draft format: migrate to structured format
            setApisList(parsed);
            setUnsavedApiIds(new Set());
            const migrated: DraftState = {
              isSaved: true,
              unsavedIds: [],
              apis: parsed,
            };
            localStorage.setItem(draftKey, JSON.stringify(migrated));
          }
        }
      } else {
        // If no draft exists in localStorage, current state is already clean
        setUnsavedApiIds(new Set());
      }
    } catch (e) {
      console.warn("Failed to restore local draft:", e);
    } finally {
      loadedDraftKey.current = draftKey;
    }
  }, [draftKey]);

  // Warn on page close ONLY if mandatory database save is genuinely pending
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedApiIds.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedApiIds.size]);

  // Persist draft to localStorage with current explicit unsaved set
  const persistDraftToLocalStorage = (
    list: ApiConnection[],
    unsavedSet: Set<string>,
  ) => {
    try {
      const unsavedArr = Array.from(unsavedSet);
      const payload: DraftState = {
        isSaved: unsavedArr.length === 0,
        unsavedIds: unsavedArr,
        apis: list,
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to write draft to local storage:", e);
    }
  };

  // Mark an API as modified ONLY upon actual user edits (toggle, typing, upload, etc.)
  const markApiModified = (apiId: string, updatedList: ApiConnection[]) => {
    const next = new Set(unsavedApiIds);
    next.add(apiId);
    setUnsavedApiIds(next);
    persistDraftToLocalStorage(updatedList, next);
  };

  // Mark an API as saved to database
  const markApiSaved = (apiId: string, updatedList?: ApiConnection[]) => {
    const next = new Set(unsavedApiIds);
    next.delete(apiId);
    setUnsavedApiIds(next);
    persistDraftToLocalStorage(updatedList || apisList, next);
  };

  const getMethodClass = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return styles.methodGet;
      case "POST":
        return styles.methodPost;
      case "PUT":
        return styles.methodPut;
      case "PATCH":
        return styles.methodPatch;
      case "DELETE":
        return styles.methodDelete;
      default:
        return styles.methodGet;
    }
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
                api.mcpDescription || api.apiSchema.toolDescription || "",
            }
          : api.apiSchema,
      };
    });
  };

  // Local state update when toggling Widget UI (Autosaves to local storage only)
  const handleToggleWidgetUi = (api: ApiConnection) => {
    const currentUi = api.uiConfig || {
      uiEnabled: false,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };
    const updatedUi = { ...currentUi, uiEnabled: !currentUi.uiEnabled };
    updateApiUiConfig(api.id, { uiEnabled: updatedUi.uiEnabled });

    const updatedList = apisList.map((a) =>
      a.id === api.id
        ? {
            ...a,
            uiConfig: updatedUi,
            isWidgetEnabled: updatedUi.uiEnabled,
          }
        : a,
    );
    setApisList(updatedList);
    markApiModified(api.id, updatedList);

    showToast(
      updatedUi.uiEnabled
        ? `Widget UI enabled for ${api.apiName || "API"} (Draft saved)`
        : `Widget UI disabled for ${api.apiName || "API"} (Draft saved)`,
      "info",
    );
  };

  // Local state update when toggling Map (Autosaves to local storage only)
  const handleToggleMap = (api: ApiConnection) => {
    const currentUi = api.uiConfig || {
      uiEnabled: false,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };
    const updatedUi = { ...currentUi, mapEnabled: !currentUi.mapEnabled };
    updateApiUiConfig(api.id, { mapEnabled: updatedUi.mapEnabled });

    const updatedList = apisList.map((a) =>
      a.id === api.id
        ? {
            ...a,
            uiConfig: updatedUi,
            isMapViewEnabled: updatedUi.mapEnabled,
          }
        : a,
    );
    setApisList(updatedList);
    markApiModified(api.id, updatedList);

    showToast(
      updatedUi.mapEnabled
        ? `Map view enabled for ${api.apiName || "API"} (Draft saved)`
        : `Map view disabled for ${api.apiName || "API"} (Draft saved)`,
      "info",
    );
  };

  // Local layout change - only Auto is supported; Custom redirects to Upgrade screen
  const handleLayoutChange = (api: ApiConnection, newType: ToolUiType) => {
    if (newType !== "auto") {
      if (onNavigateToUpgrade) {
        onNavigateToUpgrade();
      } else {
        navigate({ to: "/upgrade" });
      }
      return;
    }

    const currentUi = api.uiConfig || {
      uiEnabled: false,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };
    const updatedUi = { ...currentUi, uiType: "auto" as ToolUiType };
    updateApiUiConfig(api.id, { uiType: "auto" as ToolUiType });

    const updatedList = apisList.map((a) =>
      a.id === api.id ? { ...a, uiConfig: updatedUi } : a,
    );
    setApisList(updatedList);
    markApiModified(api.id, updatedList);
  };

  // Toggle all APIs in local state (Autosaves to local storage only)
  const handleToggleAllApis = (enable: boolean) => {
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
    setApisList(updatedList);

    const allIds = new Set(unsavedApiIds);
    updatedList.forEach((a) => allIds.add(a.id));
    setUnsavedApiIds(allIds);
    persistDraftToLocalStorage(updatedList, allIds);

    showToast(
      enable
        ? "All APIs enabled in local draft. Remember to save configuration!"
        : "All APIs disabled in local draft. Remember to save configuration!",
      "info",
    );
  };

  // Dedicated single-API save to database
  const handleSaveSingleApi = async (api: ApiConnection) => {
    if (!user?.id) {
      showToast("No active session found. Please sign in again.", "error");
      return;
    }

    setSavingApiId(api.id);
    const apiIndex =
      api.rawIndex !== undefined
        ? api.rawIndex
        : apisList.findIndex((a) => a.id === api.id);

    const uiCfg = api.uiConfig || {
      uiEnabled: true,
      uiType: "auto" as ToolUiType,
      mapEnabled: false,
    };

    try {
      const res = await updateCompanyApiUiSettings(user.id, {
        apiId: api.id,
        apiIndex: apiIndex >= 0 ? apiIndex : undefined,
        mcpToolName: api.mcpToolName,
        mcpDescription: api.mcpDescription || "",
        uiConfig: {
          uiEnabled: uiCfg.uiEnabled,
          mapEnabled: uiCfg.mapEnabled,
          layout: uiCfg.uiType || "auto",
          uiType: uiCfg.uiType || "auto",
        },
        isWidgetEnabled: uiCfg.uiEnabled !== false,
        isMapViewEnabled: Boolean(uiCfg.mapEnabled),
        sampleResponse:
          api.sampleResponse || (api as any).sampleresponse || undefined,
        apiName: api.apiName,
        apiEndpoint: api.apiEndpoint,
        apiMethod: api.apiMethod,
      });

      if (res && res.success !== false) {
        markApiSaved(api.id);
        showToast(
          `✓ "${api.apiName || "API"}" updated successfully in database!`,
          "success",
        );
      } else {
        showToast(res?.message || "Failed to update API.", "error");
      }
    } catch (err: any) {
      console.error("Single API update failed:", err);
      showToast(
        err.message || "Failed to save API. Please try again.",
        "error",
      );
    } finally {
      setSavingApiId(null);
    }
  };

  // Sample upload and Gemini analysis
  const handleSaveSampleAndAnalyze = async (
    api: ApiConnection,
    sampleJson: string | any,
  ) => {
    if (!user?.id) {
      showToast("User session not found. Please re-login.", "error");
      return;
    }
    let formattedJson = "";
    try {
      const parsed =
        typeof sampleJson === "string"
          ? JSON.parse(sampleJson.trim())
          : typeof sampleJson === "object" && sampleJson !== null
            ? sampleJson
            : JSON.parse(String(sampleJson || ""));
      formattedJson = JSON.stringify(parsed, null, 2);
    } catch {
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
      showToast("Could not find target API in fleet.", "error");
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

      const generatedSchema = res?.data?.apiSchema;
      const newToolDesc =
        generatedSchema?.toolDescription || api.mcpDescription || "";

      if (newToolDesc) {
        updateApiDescription(api.id, newToolDesc);
      }

      const updatedList = apisList.map((a) =>
        a.id === api.id
          ? {
              ...a,
              sampleResponse: formattedJson,
              apiSchema: generatedSchema || a.apiSchema,
              mcpDescription: newToolDesc || a.mcpDescription,
              isTested: true,
              isAnalyzed: true,
            }
          : a,
      );
      setApisList(updatedList);

      // Automatically persist to single API endpoint
      try {
        await updateCompanyApiUiSettings(user.id, {
          apiId: api.id,
          apiIndex,
          mcpDescription: newToolDesc || api.mcpDescription,
          sampleResponse: formattedJson,
          isWidgetEnabled: api.uiConfig?.uiEnabled !== false,
          isMapViewEnabled: Boolean(api.uiConfig?.mapEnabled),
        });
        markApiSaved(api.id, updatedList);
      } catch (saveErr) {
        console.warn("Single API save after schema analysis:", saveErr);
      }

      showToast(
        "Sample analyzed with Gemini AI & schema saved successfully!",
        "success",
      );
      setUploadingSampleApi(null);
      setSampleInputText("");
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

  // Save sample JSON directly without AI re-analysis
  const handleSaveSampleOnly = async (
    api: ApiConnection,
    sampleJson: string | any,
  ) => {
    let formatted = "";
    try {
      const parsed =
        typeof sampleJson === "string"
          ? JSON.parse(sampleJson.trim())
          : typeof sampleJson === "object" && sampleJson !== null
            ? sampleJson
            : JSON.parse(String(sampleJson || ""));
      formatted = JSON.stringify(parsed, null, 2);
    } catch {
      showToast("Invalid JSON syntax. Please verify JSON format.", "warning");
      return;
    }

    const updatedList = apisList.map((a) =>
      a.id === api.id ? { ...a, sampleResponse: formatted } : a,
    );
    setApisList(updatedList);

    // Save to single API endpoint
    if (user?.id) {
      const apiIndex =
        api.rawIndex !== undefined
          ? api.rawIndex
          : apisList.findIndex((a) => a.id === api.id);

      try {
        await updateCompanyApiUiSettings(user.id, {
          apiId: api.id,
          apiIndex: apiIndex >= 0 ? apiIndex : undefined,
          sampleResponse: formatted,
        });
        markApiSaved(api.id, updatedList);
      } catch (err) {
        console.warn("Save sample error:", err);
      }
    }

    showToast("Sample response attached successfully!", "success");
    setUploadingSampleApi(null);
    setSampleInputText("");
  };

  // Synthesize or Polish directive with AI
  const handleGenerateAiDescription = async (
    api: ApiConnection,
    mode: "new" | "format" | "deep",
  ) => {
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
            let samplePayload: string | undefined = undefined;
            if (typeof existingSample === "string" && existingSample.trim()) {
              samplePayload = existingSample.trim();
            } else if (existingSample && typeof existingSample === "object") {
              try {
                samplePayload = JSON.stringify(existingSample);
              } catch {
                samplePayload = undefined;
              }
            }
            const res = await analyzeSingleCompanyApi(
              user.id,
              apiIndex,
              samplePayload,
            );
            if (res?.data?.apiSchema) {
              newSchema = res.data.apiSchema;
              if (res.data.apiSchema.toolDescription) {
                finalDesc = res.data.apiSchema.toolDescription;
              }
            }
          } catch (deepErr) {
            console.warn("Deep schema analysis failed:", deepErr);
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
      markApiModified(api.id, updatedList);

      showToast(
        mode === "format"
          ? "Directive polished! Click 'Save API' to persist to database."
          : "MCP directive synthesized! Click 'Save API' to persist to database.",
        "success",
      );
    } catch (err: any) {
      showToast(
        err.message || "Failed to generate directive with AI.",
        "error",
      );
    } finally {
      setAiGeneratingApiId(null);
    }
  };

  // Save All Configurations using the dedicated update route (No 409 conflict!)
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

      // Uses updateCompanyApis (PUT /api/companies/:companyId/apis) - allows updating existing configured APIs
      const res = await updateCompanyApis(user.id, {
        apis: apisPayload as any,
        MapsApiKey,
      });

      if (res && res.success !== false) {
        setUnsavedApiIds(new Set());
        const cleanDraft: DraftState = {
          isSaved: true,
          unsavedIds: [],
          apis: apisList,
        };
        try {
          localStorage.setItem(draftKey, JSON.stringify(cleanDraft));
        } catch {
          // ignore
        }
        showToast(
          "All configurations saved to database successfully!",
          "success",
        );
      } else {
        showToast(res?.message || "Failed to save configuration.", "error");
      }
    } catch (err: any) {
      console.error("Save all changes failed:", err);
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

  const filteredApis = apisList.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.apiName?.toLowerCase().includes(q) ||
      a.apiEndpoint?.toLowerCase().includes(q) ||
      a.apiMethod?.toLowerCase().includes(q) ||
      a.mcpToolName?.toLowerCase().includes(q)
    );
  });

  const content = (
    <div className="flex flex-col gap-5">
      {!embedMode && (
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className={styles.welcomeTitle}>API Management</h1>
            <p className={styles.subtitle}>
              Monitor, configure, and customize each MCP tool directive and
              widget layout.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/company-dashboard" })}
            className={styles.ghostBtn}
          >
            <LeftArrowIcon size={14} color="currentColor" />
            <span>Dashboard</span>
          </button>
        </div>
      )}

      {/* Mandatory Database Save Notice Banner */}
      {unsavedApiIds.size > 0 && (
        <div className={styles.unsavedBanner}>
          <div className="flex items-center gap-2">
            <span>
              ⚠️ <strong>Mandatory Save Required:</strong> You have{" "}
              {unsavedApiIds.size} API change{unsavedApiIds.size > 1 ? "s" : ""}{" "}
              saved in local draft only. Click 'Save Configuration' or 'Save
              API' to persist to the database.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={styles.saveBtn}
          >
            {isSaving ? "Saving..." : "Save All to Database"}
          </button>
        </div>
      )}

      {/* Summary & Batch Actions Bar */}
      <div className={styles.apiSummaryBar}>
        <div>
          <h3 className={styles.apiSummaryTitle}>
            {apisList.length} Connected API{apisList.length !== 1 ? "s" : ""}
          </h3>
          <p className={styles.apiSummarySubtitle}>
            {enabledCount} active in interactive ChatGPT widget •{" "}
            {apisList.length - enabledCount} text-only
            {unsavedApiIds.size > 0 && (
              <span className="text-amber-400 font-bold ml-2">
                • {unsavedApiIds.size} unsaved draft(s)
              </span>
            )}
          </p>
        </div>

        <div className={styles.apiSummaryActions}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter APIs..."
              className={styles.ghostBtn}
              style={{ paddingLeft: "1.75rem", minWidth: "150px" }}
            />
            <span className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none">
              <SearchIcon size={13} color="currentColor" />
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleToggleAllApis(true)}
            className={styles.ghostBtn}
          >
            Enable All
          </button>
          <button
            type="button"
            onClick={() => handleToggleAllApis(false)}
            className={styles.ghostBtn}
          >
            Disable All
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`${styles.saveBtn} ${unsavedApiIds.size > 0 ? "shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400" : ""}`}
          >
            {isSaving
              ? "Saving..."
              : unsavedApiIds.size > 0
                ? `● Save Configuration (${unsavedApiIds.size} Unsaved)`
                : "Save Configuration"}
          </button>
        </div>
      </div>

      {/* API Cards List */}
      <div className={styles.apiCardsList}>
        {filteredApis.map((api) => {
          const uiCfg = api.uiConfig || {
            uiEnabled: false,
            uiType: "auto" as ToolUiType,
            mapEnabled: false,
          };
          const isExpanded = expandedApi === api.id;
          const isUnsaved = unsavedApiIds.has(api.id);

          // Check if sample response exists in database or state
          const sampleData =
            api.sampleResponse ||
            (api as any).sampleresponse ||
            (api as any).sample_response;
          const hasSample = Boolean(
            (sampleData &&
              (typeof sampleData === "string"
                ? sampleData.trim().length > 0
                : typeof sampleData === "object"
                  ? Object.keys(sampleData).length > 0
                  : Boolean(sampleData))) ||
            (api.apiSchema &&
              (api.apiSchema.hasValidData ||
                api.apiSchema.entityType ||
                api.apiSchema.sampleResponse ||
                (api.apiSchema.fields && api.apiSchema.fields.length > 0))),
          );

          return (
            <div
              key={api.id}
              className={`${styles.apiCard} ${isExpanded ? styles.apiCardExpanded : ""}`}
            >
              {/* Card Header Accordion */}
              <button
                type="button"
                onClick={() => setExpandedApi(isExpanded ? null : api.id)}
                className={styles.apiCardHeaderBtn}
              >
                <span
                  className={`${styles.methodBadge} ${getMethodClass(api.apiMethod)}`}
                >
                  {api.apiMethod || "GET"}
                </span>

                <div className={styles.apiInfoCol}>
                  <div className={styles.apiTitleRow}>
                    <span className={styles.apiNameTitle}>
                      {api.apiName || "Unnamed API Endpoint"}
                    </span>
                    <span
                      className={
                        uiCfg.uiEnabled
                          ? styles.widgetPillOn
                          : styles.widgetPillOff
                      }
                    >
                      {uiCfg.uiEnabled ? "Widget ON" : "Widget OFF"}
                    </span>
                    {isUnsaved && (
                      <span className={styles.unsavedBadge}>
                        ● Unsaved Draft
                      </span>
                    )}
                  </div>
                  <span className={styles.apiEndpointText}>
                    {api.apiEndpoint}
                  </span>
                </div>

                <span
                  className={`${styles.chevronIcon} ${
                    isExpanded ? styles.chevronExpanded : ""
                  }`}
                >
                  <ChevronDownIcon size={16} color="currentColor" />
                </span>
              </button>

              {/* Expanded Configuration Section */}
              {isExpanded && (
                <div className={styles.apiExpandedBody}>
                  {/* Meta specifications */}
                  <div className={styles.apiMetaRow}>
                    <span>
                      Auth Type:{" "}
                      <span className={styles.apiMetaVal}>
                        {api.apiAuthType || "None"}
                      </span>
                    </span>
                    {api.apiAuthHeader && (
                      <span>
                        Header:{" "}
                        <span className={styles.apiMetaVal}>
                          {api.apiAuthHeader}
                        </span>
                      </span>
                    )}
                    {api.mcpToolName && (
                      <span>
                        MCP Identifier:{" "}
                        <span className={styles.toolMcpCol}>
                          {api.mcpToolName}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* UI & Layout Controls */}
                  <div className={styles.apiControlsRow}>
                    <label className={styles.toggleLabel}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={uiCfg.uiEnabled}
                        onClick={() => handleToggleWidgetUi(api)}
                        className={`${styles.switchTrack} ${
                          uiCfg.uiEnabled ? styles.switchTrackActive : ""
                        }`}
                      >
                        <span
                          className={`${styles.switchThumb} ${
                            uiCfg.uiEnabled ? styles.switchThumbActive : ""
                          }`}
                        />
                      </button>
                      <span>Render Widget UI</span>
                    </label>

                    {uiCfg.uiEnabled && (
                      <div className={styles.layoutSelectorWrap}>
                        <span>Layout:</span>
                        <select
                          value={uiCfg.uiType === "custom" ? "custom" : "auto"}
                          onChange={(e) =>
                            handleLayoutChange(
                              api,
                              e.target.value as ToolUiType,
                            )
                          }
                          className={styles.selectLayout}
                        >
                          <option value="auto">Auto (AI Data-Driven)</option>
                          <option value="custom">
                            Custom ✨ (Upgrade to Pro)
                          </option>
                        </select>
                      </div>
                    )}

                    <label className={styles.toggleLabel}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={uiCfg.mapEnabled}
                        onClick={() => handleToggleMap(api)}
                        className={`${styles.switchTrack} ${
                          uiCfg.mapEnabled ? styles.switchTrackActive : ""
                        }`}
                      >
                        <span
                          className={`${styles.switchThumb} ${
                            uiCfg.mapEnabled ? styles.switchThumbActive : ""
                          }`}
                        />
                      </button>
                      <span>Map View</span>
                    </label>
                  </div>

                  {/* MCP Tool Directive Card */}
                  <div className={styles.directiveCard}>
                    <div className={styles.directiveHeader}>
                      <div className={styles.directiveTitle}>
                        <SparklesIcon
                          size={15}
                          color="var(--app-text-highlighted-heading)"
                        />
                        <div>
                          <span>MCP Tool Calling Context (AI Directive)</span>
                          <span className={styles.directiveSubtitle}>
                            Informs ChatGPT when and how to invoke this tool
                            during user queries
                          </span>
                        </div>
                      </div>

                      <div className={styles.directiveActions}>
                        {/* Sample Upload / Re-upload Button */}
                        <button
                          type="button"
                          onClick={() => {
                            let initialText = "";
                            if (typeof sampleData === "string") {
                              initialText = sampleData.trim();
                            } else if (
                              sampleData &&
                              typeof sampleData === "object"
                            ) {
                              try {
                                initialText = JSON.stringify(
                                  sampleData,
                                  null,
                                  2,
                                );
                              } catch {
                                initialText = String(sampleData);
                              }
                            } else if (api.apiSchema?.sampleResponse) {
                              if (
                                typeof api.apiSchema.sampleResponse === "string"
                              ) {
                                initialText =
                                  api.apiSchema.sampleResponse.trim();
                              } else {
                                try {
                                  initialText = JSON.stringify(
                                    api.apiSchema.sampleResponse,
                                    null,
                                    2,
                                  );
                                } catch {
                                  initialText = String(
                                    api.apiSchema.sampleResponse,
                                  );
                                }
                              }
                            }
                            setUploadingSampleApi(api);
                            setSampleInputText(initialText || "");
                          }}
                          className={
                            hasSample
                              ? styles.schemaReuploadBtn
                              : styles.schemaUploadBtn
                          }
                          title={
                            hasSample
                              ? "Sample already added. Click to view or re-upload a new JSON sample."
                              : "No sample response added. Click to upload a sample JSON."
                          }
                        >
                          {hasSample
                            ? "Re-upload Sample"
                            : "⚠️ Upload Sample JSON"}
                        </button>

                        <button
                          type="button"
                          disabled={aiGeneratingApiId === api.id}
                          onClick={() =>
                            handleGenerateAiDescription(api, "new")
                          }
                          className={styles.synthesizeBtn}
                        >
                          ✨ Synthesize
                        </button>

                        <button
                          type="button"
                          disabled={aiGeneratingApiId === api.id}
                          onClick={() =>
                            handleGenerateAiDescription(api, "format")
                          }
                          className={styles.polishBtn}
                        >
                          🪄 Polish
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={api.mcpDescription || ""}
                      onChange={(e) => {
                        updateApiDescription(api.id, e.target.value);
                        const updatedList = apisList.map((a) =>
                          a.id === api.id
                            ? { ...a, mcpDescription: e.target.value }
                            : a,
                        );
                        setApisList(updatedList);
                        markApiModified(api.id, updatedList);
                      }}
                      placeholder="Instruct ChatGPT precisely when to call this API (e.g. Call this tool when user searches for items...)"
                      rows={3}
                      className={styles.directiveTextarea}
                    />

                    <div className={styles.directiveFooter}>
                      <span className={styles.charCount}>
                        {api.mcpDescription
                          ? `${api.mcpDescription.length} characters • ~${Math.round(
                              api.mcpDescription.length / 4,
                            )} tokens`
                          : "Using auto-generated OpenAPI directive"}
                      </span>

                      {/* Individual API Save Button */}
                      <div className="flex items-center gap-2">
                        {isUnsaved && (
                          <span className={styles.unsavedBadge}>● Unsaved</span>
                        )}
                        <button
                          type="button"
                          disabled={savingApiId === api.id}
                          onClick={() => handleSaveSingleApi(api)}
                          className={`${styles.saveApiBtn} ${isUnsaved ? styles.saveApiBtnUnsaved : ""}`}
                          title="Save this API's changes directly to database"
                        >
                          {savingApiId === api.id ? (
                            "Saving API..."
                          ) : (
                            <>
                              <CheckIcon size={14} color="currentColor" />
                              <span>Save API</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredApis.length === 0 && (
          <div className="p-8 text-center border border-dashed rounded-2xl border-slate-700/50">
            <div className="mx-auto mb-2 text-slate-500">
              <DatabaseIcon size={28} color="currentColor" />
            </div>
            <p className="text-sm font-semibold text-slate-400">
              {apisList.length === 0
                ? "No APIs connected yet. Connect your first API during onboarding."
                : "No matching APIs found for your search query."}
            </p>
          </div>
        )}
      </div>

      {/* Sample Response & AI Schema Analysis Modal */}
      {uploadingSampleApi && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  <span>
                    {(() => {
                      const existing =
                        uploadingSampleApi.sampleResponse ||
                        (uploadingSampleApi as any).sampleresponse ||
                        (uploadingSampleApi as any).sample_response;
                      const hasExisting =
                        typeof existing === "string"
                          ? existing.trim().length > 0
                          : existing && typeof existing === "object"
                            ? Object.keys(existing).length > 0
                            : Boolean(existing);
                      return hasExisting
                        ? "Re-upload Sample Response JSON"
                        : "Upload Sample Response JSON";
                    })()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-indigo-500/10 text-indigo-400">
                    {uploadingSampleApi.apiName ||
                      uploadingSampleApi.apiEndpoint}
                  </span>
                </h3>
                <p className={styles.modalDesc}>
                  Paste or upload a sample JSON response. Gemini AI can analyze
                  the schema, detect fields, and formulate optimal MCP tool
                  calling instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadingSampleApi(null)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  Sample JSON Payload
                </span>
                <label className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium">
                  <span>📁 Select .json file</span>
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
                        setSampleInputText(
                          typeof content === "string" ? content : "",
                        );
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>

              <textarea
                value={
                  typeof sampleInputText === "string" ? sampleInputText : ""
                }
                onChange={(e) => setSampleInputText(e.target.value)}
                placeholder='{\n  "status": "success",\n  "data": [\n    { "id": "1", "name": "Item", "price": 100 }\n  ]\n}'
                rows={10}
                className={styles.modalTextarea}
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setUploadingSampleApi(null)}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  typeof sampleInputText === "string"
                    ? !sampleInputText.trim()
                    : !String(sampleInputText || "").trim()
                }
                onClick={() =>
                  handleSaveSampleOnly(uploadingSampleApi, sampleInputText)
                }
                className={styles.ghostBtn}
              >
                Save Sample JSON
              </button>
              <button
                type="button"
                disabled={
                  isAnalyzingSample ||
                  (typeof sampleInputText === "string"
                    ? !sampleInputText.trim()
                    : !String(sampleInputText || "").trim())
                }
                onClick={() =>
                  handleSaveSampleAndAnalyze(
                    uploadingSampleApi,
                    sampleInputText,
                  )
                }
                className={styles.modalSubmitBtn}
              >
                {isAnalyzingSample
                  ? "Analyzing with Gemini AI..."
                  : "✨ Analyze & Save Schema"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedMode) {
    return content;
  }

  return (
    <div className={styles.dashboardWrapper}>
      <main className={styles.mainContent} style={{ marginLeft: 0 }}>
        {content}
      </main>
    </div>
  );
};

export default ApiManagement;
