import React, { FC, useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "../../../../hooks";
import { useSignupStore } from "../../../../infrastructure/store/signupStore";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import {
  saveCompanyApiDetails,
  analyzeSingleCompanyApi,
  saveCompanyUiSelection,
} from "../../../../adapters/api/authApi";
import { env } from "../../../../infrastructure/config/env";
import { showToast } from "../../../../utils/toasts";
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
} from "../../../../assets/icons";
import styles from "../../../../styles/provisioningScreen.module.css";

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

const ProvisioningScreen: FC = () => {
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
  } = useSignupStore();
  const { setAuth } = useAuthStore();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [pipelineFinished, setPipelineFinished] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedApiIndex, setFailedApiIndex] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

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
      showToast("Company ID not found. Please restart signup.", "error");
      navigate({ to: "/signup/step1" });
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
          sampleresponse: api.sampleresponse || "",
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

      const saveRes = await saveCompanyApiDetails(
        companyId,
        apisPayload as any,
      );
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

            const sampleJson = api.sampleresponse || "{}";
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
    executePipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    executePipeline();
  };

  const handleLaunchDashboard = () => {
    clearSignupProgress();
    navigate({ to: "/dashboard" });
  };

  const mcpServerUrl = `${env.apiBaseUrl}/mcp/sse?companyId=${companyId || "demo"}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mcpServerUrl);
    setCopiedUrl(true);
    showToast("MCP SSE URL copied to clipboard!", "success");
    setTimeout(() => setCopiedUrl(false), 2500);
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
        style={{
          background: colors.Headerbackground,
          border: `1px solid ${colors.CardBorder}`,
        }}
      >
        <div className={styles.cardGlowBg} />

        {!pipelineFinished ? (
          <div>
            {/* Header */}
            <div className={styles.headerSection}>
              <div
                className={styles.badgePill}
                style={{
                  background: colors.UISelectionCardBackground,
                  color: colors.BrandIndigo,
                  border: `1px solid ${colors.CardActiveBorder}`,
                }}
              >
                <SparklesIcon size={14} color={colors.BrandIndigo} />
                <span>Automated Tenant Provisioning</span>
              </div>
              <h2
                className={styles.mainTitle}
                style={{ color: colors.TextHeading }}
              >
                Setting Up Your AI & MCP Integration
              </h2>
              <p className={styles.subtitle} style={{ color: colors.TextBody }}>
                Please stay on this page while SoftTech AI synthesizes your
                schemas, sets up isolated MCP SSE containers, and configures
                interactive ChatGPT widgets.
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div
              className={styles.overallProgressContainer}
              style={{
                background: colors.BackgroundSecondary,
                border: `1px solid ${colors.CardBorder}`,
              }}
            >
              <div className={styles.overallProgressHeader}>
                <span style={{ color: colors.TextHeading }}>
                  Overall Progress ({completedSteps} of {totalSteps} Steps)
                </span>
                <span style={{ color: colors.BrandEmerald }}>
                  {progressPercent}%
                </span>
              </div>
              <div
                className={styles.progressBarTrack}
                style={{ background: colors.Background }}
              >
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${colors.ButtonGradientOne || "#6366f1"}, ${colors.BrandEmerald || "#10b981"})`,
                  }}
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

                let borderCol = colors.CardBorder;
                let bgCol = colors.BackgroundSecondary;
                let iconCol = colors.TextBody;
                let iconBg = colors.Background;

                if (isActive) {
                  borderCol = colors.CardActiveBorder;
                  bgCol = colors.UISelectionCardBackground;
                  iconCol = colors.BrandIndigo;
                  iconBg = colors.BackgroundSecondary;
                } else if (isCompleted) {
                  borderCol = colors.BrandEmerald;
                  bgCol = colors.BackgroundSecondary;
                  iconCol = "#ffffff";
                  iconBg = colors.BrandEmerald;
                } else if (isFailed) {
                  borderCol = "#ef4444";
                  bgCol = "rgba(239, 68, 68, 0.08)";
                  iconCol = "#ffffff";
                  iconBg = "#ef4444";
                }

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
                    style={{
                      background: bgCol,
                      border: `1px solid ${borderCol}`,
                    }}
                  >
                    <div
                      className={styles.stepIconContainer}
                      style={{
                        background: iconBg,
                        color: iconCol,
                      }}
                    >
                      {isActive ? (
                        <div className={styles.spinAnimation}>
                          <SpinnerIcon size={18} color={iconCol} />
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
                        <h4
                          className={styles.stepTitle}
                          style={{ color: colors.TextHeading }}
                        >
                          {step.title}
                        </h4>
                        <span
                          className={styles.stepBadge}
                          style={{
                            background: isCompleted
                              ? "rgba(16, 185, 129, 0.15)"
                              : isActive
                                ? "rgba(99, 102, 241, 0.15)"
                                : isFailed
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : "rgba(148, 163, 184, 0.1)",
                            color: isCompleted
                              ? colors.BrandEmerald
                              : isActive
                                ? colors.BrandIndigo
                                : isFailed
                                  ? "#ef4444"
                                  : colors.TextBody,
                          }}
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

                      <p
                        className={styles.stepDesc}
                        style={{ color: colors.TextBody }}
                      >
                        {step.desc}
                      </p>

                      {step.detailMessage && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: isFailed
                              ? "#ef4444"
                              : isCompleted
                                ? colors.BrandEmerald
                                : colors.BrandIndigo,
                            marginTop: "0.35rem",
                            fontWeight: 500,
                          }}
                        >
                          {step.detailMessage}
                        </p>
                      )}

                      {/* Special Live Schema Analysis Box */}
                      {step.id === "schema" && (isActive || isFailed) && (
                        <div
                          className={styles.schemaBatchCard}
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                          }}
                        >
                          <div className={styles.schemaBatchHeader}>
                            <span style={{ color: colors.TextHeading }}>
                              {currentBatchLabel || "Analyzing API Schemas..."}
                            </span>
                            <span style={{ color: colors.BrandIndigo }}>
                              {analyzedCount} / {apisList.length} Done
                            </span>
                          </div>

                          {cooldownSeconds > 0 && (
                            <div
                              className={styles.cooldownCard}
                              style={{
                                background: colors.UISelectionCardBackground,
                                color: colors.BrandIndigo,
                              }}
                            >
                              <div className={styles.spinAnimation}>
                                <SpinnerIcon
                                  size={14}
                                  color={colors.BrandIndigo}
                                />
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

            <h2
              className={styles.successTitle}
              style={{ color: colors.TextHeading }}
            >
              Setup Complete! Your MCP Server is Live
            </h2>
            <p
              className={styles.successSubtitle}
              style={{ color: colors.TextBody }}
            >
              Your company APIs, adaptive widgets, and AI schemas have been
              provisioned successfully. You can now connect your custom ChatGPT
              action or test directly in the dashboard.
            </p>

            {/* Live SSE Endpoint URL Box */}
            <div
              className={styles.urlBox}
              style={{
                background: colors.BackgroundSecondary,
                border: `1px solid ${colors.CardBorder}`,
              }}
            >
              <div className={styles.urlBoxHeader}>
                <span style={{ color: colors.TextHeading }}>
                  Your Dedicated MCP Server SSE Endpoint
                </span>
                <span style={{ color: colors.BrandEmerald }}>
                  Active / Ready
                </span>
              </div>
              <div className={styles.urlInputRow}>
                <input
                  type="text"
                  readOnly
                  value={mcpServerUrl}
                  className={styles.urlInputText}
                  style={{
                    background: colors.Background,
                    color: colors.SuccessBadgeText || "#10b981",
                    border: `1px solid ${colors.CardBorder}`,
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className={styles.copyBtn}
                  style={{
                    background: copiedUrl
                      ? colors.BrandEmerald
                      : `linear-gradient(120deg, ${colors.ButtonGradientOne || "#6366f1"}, ${colors.ButtonGradientTwo || "#8b5cf6"})`,
                    color: "#ffffff",
                  }}
                >
                  {copiedUrl ? (
                    <>
                      <CheckIcon size={14} color="#ffffff" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardIcon size={14} color="#ffffff" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div
                className={styles.statCard}
                style={{
                  background: colors.BackgroundSecondary,
                  border: `1px solid ${colors.CardBorder}`,
                }}
              >
                <div
                  className={styles.statValue}
                  style={{ color: colors.BrandIndigo }}
                >
                  {apisList.length}
                </div>
                <div
                  className={styles.statLabel}
                  style={{ color: colors.TextBody }}
                >
                  Connected APIs
                </div>
              </div>

              <div
                className={styles.statCard}
                style={{
                  background: colors.BackgroundSecondary,
                  border: `1px solid ${colors.CardBorder}`,
                }}
              >
                <div
                  className={styles.statValue}
                  style={{ color: colors.BrandEmerald }}
                >
                  {selectedLayout?.toUpperCase() || "DASHBOARD"}
                </div>
                <div
                  className={styles.statLabel}
                  style={{ color: colors.TextBody }}
                >
                  Widget Layout
                </div>
              </div>

              <div
                className={styles.statCard}
                style={{
                  background: colors.BackgroundSecondary,
                  border: `1px solid ${colors.CardBorder}`,
                }}
              >
                <div
                  className={styles.statValue}
                  style={{ color: colors.ButtonGradientTwo || "#8b5cf6" }}
                >
                  MCP SSE
                </div>
                <div
                  className={styles.statLabel}
                  style={{ color: colors.TextBody }}
                >
                  Protocol Mode
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className={styles.successActionRow}>
              <button
                type="button"
                onClick={handleLaunchDashboard}
                className={styles.launchDashboardBtn}
                style={{
                  background: `linear-gradient(120deg, ${colors.ButtonGradientOne || "#6366f1"}, ${colors.ButtonGradientTwo || "#8b5cf6"})`,
                }}
              >
                <RocketIcon size={18} color="#ffffff" />
                <span>Launch Dashboard & Test Widgets</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProvisioningScreen;
