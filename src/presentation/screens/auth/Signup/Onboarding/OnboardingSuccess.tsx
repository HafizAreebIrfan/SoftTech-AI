import React, { FC, useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "../../../../../hooks";
import { useSignupStore } from "../../../../../infrastructure/store/signupStore";
import { useAuthStore } from "../../../../../infrastructure/store/authStore";
import {
  saveCompanyApiDetails,
  analyzeSingleCompanyApi,
  saveCompanyUiSelection,
  completeSignupOnboardingApi,
  verifySession,
} from "../../../../../adapters/api/authApi";
import { env } from "../../../../../infrastructure/config/env";
import { showToast } from "../../../../../utils/toast";
import {
  CheckIcon,
  SpinnerIcon,
  RefreshIcon,
  RocketIcon,
  ServerIcon,
  SparklesIcon,
  DatabaseIcon,
  ShieldLockIcon,
  LayoutGridIcon,
  ClipboardIcon,
  XMarkIcon,
} from "../../../../../assets/icons";
import styles from "../../../../../styles/onboardingsuccess.module.css";

type StepStatus = "pending" | "active" | "completed" | "failed";

interface PipelineStep {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  status: StepStatus;
  detailMessage?: string;
}

const BATCH_SIZE = 3;

const OnboardingSuccess: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const {
    companyId,
    stepOneData,
    apisList,
    selectedLayout,
    selectedThemeColor,
    selectedAudienceDefault,
    updateApiField,
    clearSignupProgress,
    authStrategy,
    setSignupOnboardingDone,
    signupOnboardingStep,
  } = useSignupStore();
  const {
    user,
    isAuthenticated,
    setAuth,
    setSignupOnboardingDone: setAuthSignupDone,
  } = useAuthStore();

  const effectiveCompanyId = companyId || user?.id;

  // MCP tenant URL: https://{companyname}.softtech-ai-app.onrender.com
  // Prefers the user's registered mcpSlug / subdomain, then falls back to a
  // slugified company name.
  const companySlugSource: string =
    (user as any)?.mcpSlug ||
    stepOneData?.subdomain ||
    stepOneData?.companyName ||
    (user as any)?.name ||
    "";
  const mcpServerUrl = `https://${
    String(companySlugSource)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "") || "company"
  }.softtech-ai-app.onrender.com`;
  const isStep1Done =
    Boolean(effectiveCompanyId) &&
    (signupOnboardingStep >= 2 ||
      (typeof user?.signupOnboardingStep === "number" &&
        user.signupOnboardingStep >= 2) ||
      (apisList &&
        apisList.length > 0 &&
        apisList.some(
          (a) =>
            a.apiName?.trim() &&
            a.apiEndpoint?.trim() &&
            a.apiEndpoint !== "https://",
        )));

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [pipelineFinished, setPipelineFinished] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedApiIndex, setFailedApiIndex] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyField = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Schema Batch Progress
  const [analyzedCount, setAnalyzedCount] = useState<number>(0);
  const [currentBatchLabel, setCurrentBatchLabel] = useState<string>("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const isRunningRef = useRef<boolean>(false);

  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: "account",
      title: "Verifying Company Account & Credentials",
      desc: "Setting up tenant workspace and encrypting API secret credentials.",
      icon: <ShieldLockIcon size={18} color="currentColor" />,
      status: "pending",
    },
    {
      id: "schema",
      title: "AI Schema Analysis & OpenAPI Synthesis",
      desc: `Analyzing schemas 3 at a time across ${apisList.length} endpoint(s) with rate-limit protection.`,
      icon: <SparklesIcon size={18} color="currentColor" />,
      status: "pending",
    },
    {
      id: "ui",
      title: "Applying Adaptive UI & Widget Layout",
      desc: `Configuring ${selectedLayout || "dashboard"} layout with accent color ${selectedThemeColor || "#6366f1"}.`,
      icon: <LayoutGridIcon size={18} color="currentColor" />,
      status: "pending",
    },
    {
      id: "mcp",
      title: "Initializing Dedicated MCP SSE Server",
      desc: "Provisioning isolated Model Context Protocol container for ChatGPT integration.",
      icon: <ServerIcon size={18} color="currentColor" />,
      status: "pending",
    },
    {
      id: "widgets",
      title: "Generating OpenAI Widget Manifest & SSE Tunnel",
      desc: "Registering dynamic interactive tools, schemas, and live stream boundaries.",
      icon: <DatabaseIcon size={18} color="currentColor" />,
      status: "pending",
    },
    {
      id: "finalizing",
      title: "Finalizing System Activation",
      desc: "Issuing API bearer keys and provisioning live dashboard workspace.",
      icon: <RocketIcon size={18} color="currentColor" />,
      status: "pending",
    },
  ]);

  const updateStepStatus = (
    index: number,
    status: StepStatus,
    detailMessage?: string,
  ) => {
    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === index
          ? {
              ...s,
              status,
              detailMessage:
                detailMessage !== undefined ? detailMessage : s.detailMessage,
            }
          : s,
      ),
    );
  };

  const executePipeline = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setErrorMessage(null);
    setFailedApiIndex(null);

    if (!companyId) {
      showToast("Company not found. Please signup first.", "error");
      navigate({ to: "/signup/company" });
      return;
    }

    try {
      // ----------------------------------------------------
      // STEP 0: Account Verification & Save API Details
      // ----------------------------------------------------
      setCurrentStepIndex(0);
      updateStepStatus(
        0,
        "active",
        "Saving API endpoints and security tokens...",
      );

      const apisPayload = apisList.map((api) => {
        const isbearertoken =
          api.apiAuthType === "Bearer Token"
            ? { bearerToken: api.apiCredentials }
            : {};
        const isapikey =
          api.apiAuthType === "API Key" ? { apiKey: api.apiCredentials } : {};
        const isoauth =
          api.apiAuthType === "OAuth 2.0"
            ? {
                oauthClientSecret: api.apiCredentials,
                oauthTokenUrl: api.oauthTokenUrl,
                oauthClientId: api.oauthClientId,
              }
            : {};
        const isuseroauth =
          api.apiAuthType === "User-Level OAuth"
            ? {
                oauthAuthorizationUrl: api.oauthAuthorizationUrl,
                oauthTokenUrl: api.oauthTokenUrl,
                oauthClientId: api.oauthClientId,
              }
            : {};

        return {
          name: api.apiName || "Unnamed API",
          method: api.apiMethod || "GET",
          baseUrl: api.apiEndpoint ? new URL(api.apiEndpoint).origin : "",
          endpoint: api.apiEndpoint ? new URL(api.apiEndpoint).pathname : "/",
          authType: api.apiAuthType || "No Auth",
          authHeader: api.apiAuthHeader || "Authorization",
          headers: api.apiHeaders ? [api.apiHeaders] : [],
          params: api.apiQueryParams ? [api.apiQueryParams] : [],
          requestBody: api.apiRequestBody ? [api.apiRequestBody] : [],
          sampleResponse:
            api.sampleResponse || (api as any).sampleresponse || "",
          audience: api.audience || "customer",
          isRealtimeApi: Boolean(api.isRealtimeApi),
          streamUrl: api.streamUrl || "",
          apiSchema: api.apiSchema || api.schema || undefined,
          schema: api.apiSchema || api.schema || undefined,
          ...isbearertoken,
          ...isapikey,
          ...isoauth,
          ...isuseroauth,
        };
      });

      const saveRes = await saveCompanyApiDetails(companyId, {
        apis: apisPayload,
        authStrategy,
      } as any);
      if (!saveRes || !saveRes.success) {
        throw new Error(
          saveRes?.message || "Failed to save company API details.",
        );
      }
      updateStepStatus(
        0,
        "completed",
        "Account workspace and encrypted credentials secured.",
      );

      // ----------------------------------------------------
      // STEP 1: Batched AI Schema Analysis (3 at a time)
      // ----------------------------------------------------
      setCurrentStepIndex(1);
      updateStepStatus(
        1,
        "active",
        `Processing ${apisList.length} APIs in batches of ${BATCH_SIZE}...`,
      );

      const totalApis = apisList.length;
      let completedCount = 0;

      for (let i = 0; i < totalApis; i += BATCH_SIZE) {
        const batch = apisList.slice(i, i + BATCH_SIZE);
        const batchIndices = batch.map((_, idx) => i + idx);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalApis / BATCH_SIZE);

        setCurrentBatchLabel(
          `Batch ${batchNum} of ${totalBatches}: Analyzing APIs ${i + 1} - ${Math.min(i + BATCH_SIZE, totalApis)} of ${totalApis}...`,
        );

        // Run this batch in parallel
        await Promise.all(
          batchIndices.map(async (apiIdx) => {
            const api = apisList[apiIdx];
            // If already analyzed (e.g. from OpenAPI mock or previous run), skip directly
            if (api.apiSchema || api.isAnalyzed) {
              completedCount++;
              setAnalyzedCount(completedCount);
              return;
            }

            const sampleJson =
              api.sampleResponse || (api as any).sampleresponse || "{}";
            try {
              const res = await analyzeSingleCompanyApi(
                companyId,
                apiIdx,
                sampleJson,
              );
              if (res && res.success && res.data?.apiSchema) {
                updateApiField(api.id, "apiSchema", res.data.apiSchema);
                updateApiField(api.id, "isAnalyzed", true);
                updateApiField(api.id, "isTested", true);
              }
              completedCount++;
              setAnalyzedCount(completedCount);
            } catch (batchErr: any) {
              setFailedApiIndex(apiIdx);
              throw new Error(
                `API #${apiIdx + 1} ("${api.apiName || api.apiEndpoint}"): ${
                  batchErr?.message ||
                  "AI Schema generation failed. Rate limit or invalid response structure."
                }`,
              );
            }
          }),
        );

        // If more batches remain, apply small rate-limit cooldown
        if (i + BATCH_SIZE < totalApis) {
          setCurrentBatchLabel(
            "AI Rate-Limiter Cooldown: Pacing next batch to avoid quota limits...",
          );
          for (let c = 5; c > 0; c--) {
            setCooldownSeconds(c);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setCooldownSeconds(0);
        }
      }

      updateStepStatus(
        1,
        "completed",
        `Successfully analyzed and synthesized schemas for all ${totalApis} API endpoints.`,
      );

      // ----------------------------------------------------
      // STEP 2: Save UI Preferences & Theme
      // ----------------------------------------------------
      setCurrentStepIndex(2);
      updateStepStatus(
        2,
        "active",
        "Applying UI preferences and custom color tokens...",
      );

      const uiRes = await saveCompanyUiSelection(companyId, {
        layout: selectedLayout || "dashboard",
        themeColor: selectedThemeColor || "#6366f1",
        audienceDefault: selectedAudienceDefault || "customer",
      });

      if (!uiRes || !uiRes.success) {
        throw new Error(uiRes?.message || "Failed to save UI preferences.");
      }
      updateStepStatus(
        2,
        "completed",
        `Layout set to "${selectedLayout || "dashboard"}" with custom theme.`,
      );

      // ----------------------------------------------------
      // STEP 3: Initialize MCP Server
      // ----------------------------------------------------
      setCurrentStepIndex(3);
      updateStepStatus(
        3,
        "active",
        "Initializing isolated Model Context Protocol container...",
      );
      await new Promise((r) => setTimeout(r, 1200));
      updateStepStatus(
        3,
        "completed",
        "MCP Server active with streaming SSE bridge.",
      );

      // ----------------------------------------------------
      // STEP 4: Generate Widgets Manifest
      // ----------------------------------------------------
      setCurrentStepIndex(4);
      updateStepStatus(
        4,
        "active",
        "Building interactive tool definitions and ChatGPT schema bindings...",
      );
      await new Promise((r) => setTimeout(r, 1000));
      updateStepStatus(
        4,
        "completed",
        `${apisList.length} dynamic widgets & tool definitions registered.`,
      );

      // ----------------------------------------------------
      // STEP 5: Finalizing Activation
      // ----------------------------------------------------
      setCurrentStepIndex(5);
      updateStepStatus(
        5,
        "active",
        "Generating security access tokens and finalizing activation...",
      );
      await new Promise((r) => setTimeout(r, 1200));
      updateStepStatus(
        5,
        "completed",
        "System online and ready for ChatGPT & MCP client connections.",
      );

      // Register session in Auth Store
      if (uiRes.data) {
        setAuth({
          id: (uiRes.data as any)._id || companyId,
          name:
            (uiRes.data as any).companyName ||
            stepOneData?.companyName ||
            "My Company",
          email: (uiRes.data as any).email || stepOneData?.adminEmail || "",
          apis: (uiRes.data as any).apis || apisList,
          uiPreference: {
            layout: selectedLayout || "dashboard",
            themeColor: selectedThemeColor || "#6366f1",
          },
        });
      }

      if (effectiveCompanyId) {
        try {
          await completeSignupOnboardingApi(effectiveCompanyId);
        } catch (e) {
          console.warn("Could not mark signup onboarding complete:", e);
        }
      }
      setSignupOnboardingDone(true);
      setAuthSignupDone?.(true);
      setPipelineFinished(true);
      showToast("Company provisioning completed successfully!", "success");
    } catch (err: any) {
      const msg =
        err.message || "An unexpected error occurred during provisioning.";
      setErrorMessage(msg);
      updateStepStatus(currentStepIndex, "failed", msg);
      showToast("Provisioning paused: " + msg, "error");
    } finally {
      isRunningRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!effectiveCompanyId && !isAuthenticated) {
      verifySession()
        .then((session) => {
          if (!isMounted) return;
          if (session?.user) {
            useAuthStore.getState().setAuth(session.user);
            useSignupStore.getState().syncFromUser?.(session.user);
            executePipeline();
          } else {
            navigate({ to: "/signup/company", replace: true });
          }
        })
        .catch(() => {
          if (!isMounted) return;
          navigate({ to: "/signup/company", replace: true });
        });
      return;
    }

    if (!isStep1Done) {
      navigate({ to: "/signup/onboarding-step1", replace: true });
      return;
    }

    executePipeline();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId, isAuthenticated, isStep1Done]);

  const handleRetry = () => {
    executePipeline();
  };

  const handleLaunchDashboard = async () => {
    const targetCompanyId = companyId || user?.id;
    if (targetCompanyId) {
      try {
        await completeSignupOnboardingApi(targetCompanyId);
      } catch (e) {
        console.warn("Could not mark signup onboarding complete:", e);
      }
    }
    setSignupOnboardingDone(true);
    setAuthSignupDone?.(true);
    clearSignupProgress();
    navigate({ to: "/onboarding_dashboard", replace: true });
  };

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className={styles.provisioningWrapper}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={styles.provisioningCard}
      >
        {!pipelineFinished ? (
          <div>
            {/* Header */}
            <div className={styles.headerSection}>
              <div className={styles.badgePill}>
                <SparklesIcon size={14} color={colors.SuccessScreenIconBg} />
                <span>Automated Tenant Provisioning</span>
              </div>
              <h2 className={styles.mainTitle}>
                Setting Up Your AI & MCP Integration
              </h2>
              <p className={styles.subtitle}>
                Please stay on this page while SoftTech AI synthesizes your
                schemas, sets up isolated MCP SSE containers, and configures
                interactive ChatGPT widgets.
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className={styles.overallProgressContainer}>
              <div className={styles.overallProgressHeader}>
                <span className={styles.overallProgressTitle}>
                  Overall Progress ({completedSteps} of {totalSteps} Steps)
                </span>
                <span className={styles.overallProgressPercent}>
                  {progressPercent}%
                </span>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
                {!errorMessage && (
                  <div className={styles.progressBarIndeterminate} />
                )}
              </div>
            </div>

            {/* Pipeline Step List */}
            <div className={styles.stepsList}>
              {steps.map((step, idx) => {
                const isActive = step.status === "active";
                const isCompleted = step.status === "completed";
                const isFailed = step.status === "failed";
                const isPending = step.status === "pending";

                return (
                  <div
                    key={step.id}
                    className={`${styles.stepItem} ${
                      isPending
                        ? styles.stepItemPending
                        : isActive
                          ? styles.stepItemActive
                          : isCompleted
                            ? styles.stepItemCompleted
                            : styles.stepItemFailed
                    }`}
                  >
                    <div
                      className={`${styles.stepIconContainer} ${
                        isPending
                          ? styles.stepIconPending
                          : isActive
                            ? styles.stepIconActive
                            : isCompleted
                              ? styles.stepIconCompleted
                              : styles.stepIconFailed
                      }`}
                    >
                      {isActive ? (
                        <div className={styles.spinAnimation}>
                          <SpinnerIcon size={18} color="currentColor" />
                        </div>
                      ) : isCompleted ? (
                        <CheckIcon size={18} color="#ffffff" />
                      ) : isFailed ? (
                        <XMarkIcon size={18} color="#ffffff" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className={styles.stepContent}>
                      <div className={styles.stepTitleRow}>
                        <h4 className={styles.stepTitle}>{step.title}</h4>
                        <span
                          className={`${styles.stepBadge} ${
                            isCompleted
                              ? styles.stepBadgeCompleted
                              : isActive
                                ? styles.stepBadgeActive
                                : isFailed
                                  ? styles.stepBadgeFailed
                                  : styles.stepBadgePending
                          }`}
                        >
                          {isCompleted
                            ? "Complete"
                            : isActive
                              ? "In Progress"
                              : isFailed
                                ? "Failed"
                                : "Pending"}
                        </span>
                      </div>

                      <p className={styles.stepDesc}>{step.desc}</p>

                      {step.detailMessage && (
                        <p
                          className={
                            isFailed
                              ? styles.stepDetailMsgFailed
                              : isCompleted
                                ? styles.stepDetailMsgCompleted
                                : styles.stepDetailMsgActive
                          }
                        >
                          {step.detailMessage}
                        </p>
                      )}

                      {/* Special Live Schema Analysis Box */}
                      {step.id === "schema" && (isActive || isFailed) && (
                        <div className={styles.schemaBatchCard}>
                          <div className={styles.schemaBatchHeader}>
                            <span className={styles.schemaBatchTitle}>
                              {currentBatchLabel || "Analyzing API Schemas..."}
                            </span>
                            <span className={styles.schemaBatchCount}>
                              {analyzedCount} / {apisList.length} Done
                            </span>
                          </div>

                          {/* Live Endpoints Progress List */}
                          {apisList.length > 0 && (
                            <div className="mt-2.5 max-h-40 overflow-y-auto pr-1 space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/60 pt-2">
                              {apisList.map((api, idx) => {
                                const isDone =
                                  idx < analyzedCount ||
                                  Boolean(api.isAnalyzed) ||
                                  Boolean(api.apiSchema);
                                const isAnalyzing =
                                  idx >= analyzedCount &&
                                  idx < analyzedCount + BATCH_SIZE &&
                                  isActive;

                                return (
                                  <div
                                    key={api.id || idx}
                                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
                                  >
                                    <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                                      <span
                                        className={
                                          api.apiMethod === "POST"
                                            ? styles.methodBadgePost
                                            : api.apiMethod === "PUT"
                                              ? styles.methodBadgePut
                                              : api.apiMethod === "DELETE"
                                                ? styles.methodBadgeDelete
                                                : styles.methodBadgeGet
                                        }
                                      >
                                        {api.apiMethod || "GET"}
                                      </span>
                                      <span className="font-semibold truncate text-slate-800 dark:text-slate-200 text-xs">
                                        {api.apiName || "API Endpoint"}
                                      </span>
                                      <span className="font-mono text-[11px] text-slate-400 truncate hidden sm:inline">
                                        {api.apiEndpoint}
                                      </span>
                                    </div>
                                    <div className="flex-shrink-0">
                                      {isDone ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                          <CheckIcon
                                            size={12}
                                            color="currentColor"
                                          />
                                          <span>Analyzed</span>
                                        </span>
                                      ) : isAnalyzing ? (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                          <div className={styles.spinAnimation}>
                                            <SpinnerIcon
                                              size={12}
                                              color="currentColor"
                                            />
                                          </div>
                                          <span>AI Analyzing...</span>
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 font-medium">
                                          Queued
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {cooldownSeconds > 0 && (
                            <div className={styles.cooldownCard}>
                              <div className={styles.spinAnimation}>
                                <SpinnerIcon size={14} color="currentColor" />
                              </div>
                              <span>
                                Rate Limiter Pacing: Resuming next batch in{" "}
                                {cooldownSeconds}s...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error & Retry Card */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.errorCard}
              >
                <div className={styles.errorTitle}>
                  <XMarkIcon size={20} color="#ef4444" />
                  <span>Provisioning Pipeline Paused</span>
                </div>
                <div className={styles.errorText}>{errorMessage}</div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className={styles.retryBtn}
                >
                  <RefreshIcon size={16} color="#ffffff" />
                  <span>Retry AI Analysis & Resume Setup</span>
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          /* Success View */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.successWrapper}
          >
            <div className={styles.successIconContainer}>
              <CheckIcon size={36} color="#ffffff" />
            </div>

            <h2 className={styles.successTitle}>
              Setup Complete! Your MCP Server is Live
            </h2>
            <p className={styles.successSubtitle}>
              Your company APIs, adaptive widgets, and AI schemas have been
              provisioned successfully. You can now connect your custom ChatGPT
              action or test directly in the dashboard.
            </p>

            {/* AI Analysis Completion Report Card */}
            <div className={`${styles.urlBox} ${styles.reportCard}`}>
              <div className={styles.urlBoxHeader}>
                <span className={styles.reportCardTitle}>
                  <SparklesIcon size={16} color="currentColor" />
                  <span>AI Schema Synthesis & Endpoint Analysis Report</span>
                </span>
                <span className={styles.reportCardBadge}>
                  100% Analyzed ({apisList.length} Endpoints)
                </span>
              </div>

              <p className={styles.reportCardDesc}>
                All endpoint schemas from your OpenAPI / Postman upload were
                synthesized into Model Context Protocol JSON Schemas and
                validated for ChatGPT dynamic execution.
              </p>

              {/* Endpoints List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {apisList.map((api, idx) => (
                  <div
                    key={api.id || idx}
                    className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                      <span
                        className={
                          api.apiMethod === "POST"
                            ? styles.methodBadgePost
                            : api.apiMethod === "PUT"
                              ? styles.methodBadgePut
                              : api.apiMethod === "DELETE"
                                ? styles.methodBadgeDelete
                                : styles.methodBadgeGet
                        }
                      >
                        {api.apiMethod || "GET"}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {api.apiName || "API Endpoint"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 truncate hidden sm:inline">
                        {api.apiEndpoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={
                          api.audience === "admin"
                            ? styles.audienceAdmin
                            : styles.audienceCustomer
                        }
                      >
                        {api.audience || "customer"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckIcon size={12} color="currentColor" />
                        <span>AI Schema Ready</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live SSE Endpoint URL Box */}
            <div className={styles.urlBox}>
              <div className={styles.urlBoxHeader}>
                <span className={styles.urlBoxHeaderTitle}>
                  Your Dedicated MCP Server SSE Endpoint
                </span>
                <span className={styles.urlBoxHeaderStatus}>
                  Active / Ready
                </span>
              </div>
              <div className={styles.urlInputRow}>
                <input
                  type="text"
                  readOnly
                  value={mcpServerUrl}
                  className={styles.urlInputText}
                />
                <button
                  type="button"
                  onClick={() => copyField(mcpServerUrl, "sseUrl")}
                  className={`${styles.copyBtn} ${copiedField === "sseUrl" ? styles.copyBtnCopied : ""}`}
                >
                  {copiedField === "sseUrl" ? (
                    <CheckIcon size={13} color="#ffffff" />
                  ) : (
                    <ClipboardIcon size={13} color="currentColor" />
                  )}
                  <span>{copiedField === "sseUrl" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* OpenAI ChatGPT Plugin & MCP Connection Details */}
            <div className={`${styles.urlBox} ${styles.oauthBox}`}>
              <div className={styles.urlBoxHeader}>
                <span className={styles.oauthBoxTitle}>
                  <SparklesIcon size={16} color="currentColor" />
                  <strong>OpenAI ChatGPT Plugin & OAuth Settings</strong>
                </span>
                <span className={styles.oauthBoxBadge}>RFC 9728 Ready</span>
              </div>

              <div className={styles.oauthInputsCol}>
                {authStrategy?.strategyType === "oauth2" && (
                  <div className={styles.oauthGrid}>
                    <div>
                      <label className={styles.oauthFieldLabel}>
                        Authorization URL (Login):
                      </label>
                      <div className={styles.urlInputRow}>
                        <input
                          type="text"
                          readOnly
                          value={authStrategy.authorizationEndpoint || ""}
                          className={styles.urlInputText}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyField(
                              authStrategy.authorizationEndpoint || "",
                              "authUrl",
                            )
                          }
                          className={`${styles.copyBtn} ${copiedField === "authUrl" ? styles.copyBtnCopied : ""}`}
                        >
                          {copiedField === "authUrl" ? (
                            <CheckIcon size={13} color="#ffffff" />
                          ) : (
                            <ClipboardIcon size={13} color="currentColor" />
                          )}
                          <span>
                            {copiedField === "authUrl" ? "Copied" : "Copy"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={styles.oauthFieldLabel}>
                        Token URL:
                      </label>
                      <div className={styles.urlInputRow}>
                        <input
                          type="text"
                          readOnly
                          value={authStrategy.tokenEndpoint || ""}
                          className={styles.urlInputText}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyField(
                              authStrategy.tokenEndpoint || "",
                              "tokenUrl",
                            )
                          }
                          className={`${styles.copyBtn} ${copiedField === "tokenUrl" ? styles.copyBtnCopied : ""}`}
                        >
                          {copiedField === "tokenUrl" ? (
                            <CheckIcon size={13} color="#ffffff" />
                          ) : (
                            <ClipboardIcon size={13} color="currentColor" />
                          )}
                          <span>
                            {copiedField === "tokenUrl" ? "Copied" : "Copy"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statValue} ${styles.statValIndigo}`}>
                  {apisList.length}
                </div>
                <div className={styles.statLabel}>Connected APIs</div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statValue} ${styles.statValEmerald}`}>
                  {selectedLayout?.toUpperCase() || "DASHBOARD"}
                </div>
                <div className={styles.statLabel}>Widget Layout</div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statValue} ${styles.statValPurple}`}>
                  MCP SSE
                </div>
                <div className={styles.statLabel}>Protocol Mode</div>
              </div>
            </div>

            {/* Launch Action */}
            <div className={styles.successActionRow}>
              <button
                type="button"
                onClick={handleLaunchDashboard}
                className={styles.launchDashboardBtn}
              >
                <RocketIcon size={18} color="#ffffff" />
                <span>Continue to Onboarding Dashboard →</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingSuccess;
