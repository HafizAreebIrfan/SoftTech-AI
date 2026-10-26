import { FC, useState } from "react";
import { useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckIcon,
  HelpIcon,
  MoonIcon,
  RocketIcon,
  SunIcon,
  SparklesIcon,
  RightArrowIcon,
  CloseIcon,
  CodeIcon,
  TerminalIcon,
  ShieldLockIcon,
} from "../../../../assets/icons";
import { useAuthStore, useThemeStore } from "../../../../hooks";
import { showToast } from "../../../../utils/toast/toasts";
import { logout } from "../../../../adapters/api/authApi";
import { getDashboardOnboardingStep } from "../../auth/Signup/Onboarding/onboardingStep";
import styles from "../../../../styles/onboardingDashboard.module.css";

const OnboardingDashboard: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { user, setOnboardingStep, clearAuth } = useAuthStore();

  // Active step: 1 (MCP Simulation), 2 (Plan Selection), 3 (ChatGPT Deployment)
  const currentStep = Math.min(getDashboardOnboardingStep(user), 3);

  // Modals
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const stepItems = [
    {
      step: 1,
      segment: "mcp",
      route: "/mcp_simulation",
      title: "1. Test MCP & APIs",
      desc: "Simulate tool calls & ChatGPT widgets",
      detail:
        "Validate your connected APIs against the Model Context Protocol. Run live prompts to test ChatGPT action schemas, inspect tool execution, and view dynamic response widgets.",
      badge: "STEP 1 OF 3 • PROTOCOL SIMULATION",
      cta: "Launch MCP Simulation",
      icon: TerminalIcon,
    },
    {
      step: 2,
      segment: "plans",
      route: "/plans",
      title: "2. Computational Plan",
      desc: "Select request quota & enterprise tier",
      detail:
        "Scale your API intelligence layer with our precision-engineered computational tiers. Select your request volume, edge latency routing, and checkout options.",
      badge: "STEP 2 OF 3 • COMPUTATIONAL CAPACITY",
      cta: "Configure Computational Plan",
      icon: CodeIcon,
    },
    {
      step: 3,
      segment: "deploy",
      route: "/deployment",
      title: "3. Deploy to ChatGPT",
      desc: "Connect Custom GPT & launch gateway",
      detail:
        "Obtain your production OpenAPI 3.1 schema and MCP SSE tunnel credentials to connect with Custom GPTs and launch your live integration into OpenAI's ecosystem.",
      badge: "STEP 3 OF 3 • DEPLOYMENT & GATEWAY",
      cta: "Deploy to ChatGPT",
      icon: RocketIcon,
    },
  ];

  const activeStepConfig =
    stepItems.find((s) => s.step === currentStep) || stepItems[0];

  // A nested step screen is mounted when the URL is /onboarding_dashboard/mcp|plans|deploy.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSegment =
    stepItems
      .map((item) => item.segment)
      .find((segment) =>
        pathname.startsWith(`/onboarding_dashboard/${segment}`),
      ) || null;

  const handleStepClick = (item: (typeof stepItems)[0]) => {
    // Steps stay locked until the current one is completed — never skip ahead.
    if (item.step > currentStep) {
      showToast(
        `Complete step ${currentStep} first to unlock this step.`,
        "warning",
      );
      return;
    }
    navigate({ to: `/onboarding_dashboard/${item.segment}` });
  };

  const handleConfirmExit = async () => {
    setIsExiting(true);
    try {
      // 1. Save step to store & localStorage
      setOnboardingStep(currentStep);

      // 2. Call backend logout cleanly
      try {
        await logout();
      } catch (e) {
        console.warn("Logout error:", e);
      }

      clearAuth();
      showToast("Progress saved! You can resume anytime.", "info");
      navigate({ to: "/login", replace: true });
    } catch (err) {
      clearAuth();
      navigate({ to: "/login", replace: true });
    } finally {
      setIsExiting(false);
      setIsExitModalOpen(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          <span
            className={styles.brandLogo}
            onClick={() => navigate({ to: "/onboarding_dashboard" })}
          >
            SoftTech AI
          </span>
          <span className={styles.brandBadge}>Setup Console</span>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.userBadge}>
            <div className={styles.userAvatar}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AC"}
            </div>
            <span className={styles.userText}>
              {user?.name || user?.email || "Account"}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={styles.headerIconBtn}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <SunIcon size={18} color="currentColor" />
            ) : (
              <MoonIcon size={18} color="currentColor" />
            )}
          </button>

          <button
            type="button"
            className={styles.headerIconBtn}
            onClick={() => setIsHelpModalOpen(true)}
            title="Help & Guidance"
            aria-label="Help"
          >
            <HelpIcon size={18} color="currentColor" />
          </button>

          <button
            type="button"
            className={styles.exitButton}
            onClick={() => setIsExitModalOpen(true)}
          >
            Save & Exit
          </button>
        </div>
      </header>

      <div className={styles.mainWrapper}>
        <div className={styles.wizardContainer}>
          <aside className={styles.stepperSidebar}>
            <div>
              <div className={styles.stepperHeader}>
                <span className={styles.stepperKicker}>
                  <SparklesIcon size={13} color="currentColor" /> SETUP WORKFLOW
                </span>
                <h2 className={styles.stepperTitle}>
                  {user?.name || "Account"} Setup
                </h2>
                <p className={styles.stepperSubtitle}>
                  Follow the 3 guided steps to validate your MCP tools and
                  deploy to ChatGPT.
                </p>
              </div>

              <div className={styles.stepsList}>
                {stepItems.map((item, idx) => {
                  const isLocked = item.step > currentStep;
                  const isPast = currentStep > item.step;
                  // Highlight the row of the mounted sub-screen, otherwise the
                  // current workflow step.
                  const isActive = activeSegment
                    ? item.segment === activeSegment
                    : currentStep === item.step;

                  return (
                    <div key={item.step}>
                      <a
                        href={`/onboarding_dashboard/${item.segment}`}
                        className={`${styles.stepRow} ${isActive ? styles.stepRowActive : ""} ${
                          isLocked ? styles.stepRowLocked : ""
                        }`}
                        aria-disabled={isLocked || undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          if (isLocked) {
                            showToast(
                              `Complete step ${currentStep} first to unlock this step.`,
                              "warning",
                            );
                            return;
                          }
                          handleStepClick(item);
                        }}
                      >
                        <div className={styles.stepIndicatorCol}>
                          <div
                            className={`${styles.stepBadgeCircle} ${
                              isPast
                                ? styles.badgeCompleted
                                : isActive
                                  ? styles.badgeActive
                                  : isLocked
                                    ? styles.badgeLocked
                                    : styles.badgePending
                            }`}
                          >
                            {isPast ? (
                              <CheckIcon size={16} color="#ffffff" />
                            ) : (
                              item.step
                            )}
                          </div>
                        </div>

                        <div className={styles.stepInfoCol}>
                          <span
                            className={`${styles.stepLabel} ${
                              isActive ? styles.stepLabelActive : ""
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className={styles.stepDesc}>
                            {isLocked ? "🔒 " : ""}
                            {item.desc}
                          </span>
                        </div>
                      </a>

                      {idx < stepItems.length - 1 && (
                        <div style={{ paddingLeft: "1.45rem" }}>
                          <div
                            className={`${styles.stepConnectingLine} ${
                              isPast ? styles.lineCompleted : ""
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assistance Card */}
            <div className={styles.sidebarHelpCard}>
              <div className={styles.helpCardTop}>
                <HelpIcon size={16} color="currentColor" />
                <span>Need Assistance?</span>
              </div>
              <p className={styles.helpCardText}>
                Our protocol engineers can help configure custom API tools,
                OAuth2, and OpenAPI schemas.
              </p>
              <button
                type="button"
                className={styles.helpCardLink}
                onClick={() => setIsHelpModalOpen(true)}
              >
                Read MCP Guide ↗
              </button>
            </div>
          </aside>

          {/* Main Hub Overview — or the mounted nested step screen */}
          <main className={styles.hubMainContent}>
            {activeSegment ? (
              <Outlet />
            ) : (
              <>
                {/* Active Step Highlight Banner */}
                <div className={styles.hubHeaderBanner}>
                  <div className={styles.hubBannerLeft}>
                    <span className={styles.hubBannerKicker}>
                      {activeStepConfig.badge}
                    </span>
                    <h3 className={styles.hubBannerTitle}>
                      {activeStepConfig.title}
                    </h3>
                    <p className={styles.hubBannerDesc}>
                      {activeStepConfig.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStepClick(activeStepConfig)}
                    className={styles.hubBannerBtn}
                  >
                    <span>{activeStepConfig.cta} ↗</span>
                  </button>
                </div>

                {/* 3 Step Stage Cards */}
                <div className={styles.hubCardGrid}>
                  {stepItems.map((item) => {
                    const isLocked = item.step > currentStep;
                    const isCompleted = currentStep > item.step;
                    const isCurrent = currentStep === item.step;
                    const StepIcon = item.icon;

                    return (
                      <div
                        key={item.step}
                        className={`${styles.hubStageCard} ${
                          isCurrent ? styles.hubStageCardActive : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className={styles.hubStageHeader}>
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                              <StepIcon size={20} color="currentColor" />
                            </div>
                            <span
                              className={`${styles.hubStagePill} ${
                                isCompleted
                                  ? styles.pillCompleted
                                  : isCurrent
                                    ? styles.pillActive
                                    : styles.pillPending
                              }`}
                            >
                              {isCompleted
                                ? "✓ Completed"
                                : isCurrent
                                  ? "● In Progress"
                                  : "🔒 Upcoming"}
                            </span>
                          </div>

                          <div className={styles.hubStageBody}>
                            <h4 className={styles.hubStageTitle}>
                              {item.title}
                            </h4>
                            <p className={styles.hubStageDesc}>{item.detail}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isLocked}
                          aria-disabled={isLocked || undefined}
                          onClick={() => handleStepClick(item)}
                          className={`${styles.hubStageBtn} ${
                            isCurrent ? styles.hubStageBtnActive : ""
                          } ${isLocked ? styles.hubStageBtnDisabled : ""}`}
                        >
                          <span>
                            {isLocked ? "Complete previous step" : item.cta}
                          </span>
                          {!isLocked && (
                            <RightArrowIcon size={14} color="currentColor" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {isExitModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsExitModalOpen(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Save Progress &amp; Exit?</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsExitModalOpen(false)}
              >
                <CloseIcon size={18} color="currentColor" />
              </button>
            </div>

            <p className={styles.modalText}>
              Your current setup progress (Step {currentStep} of 3) will be
              preserved in your account. You will be safely signed out and can
              resume your onboarding anytime by logging back in.
            </p>

            <div className={styles.modalActionsRow}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsExitModalOpen(false)}
                disabled={isExiting}
              >
                Stay Here
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleConfirmExit}
                disabled={isExiting}
              >
                {isExiting ? "Saving & Exiting..." : "Save & Exit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isHelpModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Model Context Protocol (MCP) Guide
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsHelpModalOpen(false)}
              >
                <CloseIcon size={18} color="currentColor" />
              </button>
            </div>

            <p className={styles.modalText}>
              <strong>What is MCP?</strong> Model Context Protocol is an open
              standard that enables AI models like ChatGPT to securely call
              external tools and retrieve live structured business data.
            </p>

            <p className={styles.modalText}>
              <strong>How it works with SoftTech AI:</strong>
              <br />
              1. <strong>Tools:</strong> Your REST APIs are automatically
              synthesized into OpenAPI 3.1 MCP tool declarations.
              <br />
              2. <strong>Widgets:</strong> Responses are transformed into
              interactive ChatGPT cards and charts.
              <br />
              3. <strong>Gateway:</strong> A low-latency SSE tunnel relays
              queries between OpenAI and your endpoints securely.
            </p>

            <div className={styles.modalActionsRow}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsHelpModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingDashboard;
