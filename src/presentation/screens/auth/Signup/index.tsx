import React, { FC, useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useThemeStore, useAuthStore, useSignupStore } from "../../../../hooks";
import { LeftArrowIcon, SunIcon, MoonIcon } from "../../../../assets/icons";
import { AnimatePresence } from "motion/react";
import styles from "../../../../styles/signup.module.css";
import { SignupHeroCard } from "../../../components/auth/SignupHeroCard";
import { ExitOnboardingModal } from "../../../components/auth/ExitOnboardingModal";
import { logout } from "../../../../adapters/api/authApi";
import { showToast } from "../../../../utils/toast";

interface SignupContextType {
  triggerExitModal: () => void;
}

const SignupContext = createContext<SignupContextType>({
  triggerExitModal: () => {},
});

export const useSignupContext = () => useContext(SignupContext);

const Signup: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { clearAuth } = useAuthStore();
  const { saveOnboardingProgress } = useSignupStore();

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSuccessScreen = location.pathname.endsWith("/success");
  const isOnboardingStep1 = location.pathname.endsWith("/onboarding-step1");
  const isOnboardingStep2 = location.pathname.endsWith("/onboarding-step2");
  const isOnboardingSuccess = location.pathname.endsWith("/onboarding-success");

  const isOnboardingFlow =
    isOnboardingStep1 || isOnboardingStep2 || isOnboardingSuccess;

  const signupStep = isOnboardingStep1
    ? 2
    : isOnboardingStep2
      ? 3
      : isOnboardingSuccess
        ? 4
        : isSuccessScreen
          ? 0
          : 1;

  // Intercept browser back navigation on onboarding steps
  useEffect(() => {
    if (!isOnboardingFlow) return;

    // Push state so back button can be intercepted
    window.history.pushState({ onboardingGuard: true }, "");

    const handlePopState = () => {
      // Re-push to prevent browser from navigating away silently
      window.history.pushState({ onboardingGuard: true }, "");
      setIsExitModalOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOnboardingFlow]);

  const handleLogoClick = () => {
    if (isOnboardingFlow) {
      setIsExitModalOpen(true);
    } else {
      navigate({ to: "/" });
    }
  };

  const handleConfirmExit = async () => {
    setIsSaving(true);
    try {
      // 1. Save progress to database & localStorage
      await saveOnboardingProgress();

      // 2. Call backend logout
      try {
        await logout();
      } catch (e) {
        console.warn("Logout request failed:", e);
      }

      // 3. Clear auth store so user is logged out
      clearAuth();

      showToast(
        "Progress saved successfully. You have been logged out.",
        "success",
      );
      setIsExitModalOpen(false);

      // 4. Navigate to login cleanly
      navigate({ to: "/login", replace: true });
    } catch (err: any) {
      showToast(
        err.message || "Failed to save progress. Please try again.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex font-sans overflow-x-hidden relative transition-colors duration-200 ${styles.signupPageWrapper}`}
    >
      {/* Left Column: Header & Dynamic Step Content */}
      <main className="w-full flex-1 min-w-0 flex flex-col min-h-screen overflow-y-auto relative transition-all z-10">
        {/* Header - Logo, Back Button & Theme Switcher */}
        <header className="w-full px-6 py-7 sm:px-10 lg:px-12 flex items-center justify-between shrink-0">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              {/* Placeholder for Logo mark */}
              <div className="w-4 h-4 border-2 border-white rounded-sm transform rotate-45"></div>
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${styles.brandLogoText}`}
            >
              SoftTech AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            {signupStep === 1 && (
              <button
                type="button"
                onClick={() => {
                  navigate({ to: "/login" });
                }}
                className={`flex items-center gap-1.5 ${styles.backbutton}`}
              >
                <LeftArrowIcon size={16} color={colors.IconColor} />
                <span>Back</span>
              </button>
            )}

            {isOnboardingFlow && (
              <button
                type="button"
                onClick={() => setIsExitModalOpen(true)}
                className={`flex items-center gap-1.5 ${styles.backbutton}`}
              >
                <LeftArrowIcon size={16} color={colors.IconColor} />
                <span>Save & Exit</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 cursor-pointer`}
              style={{ background: colors.BackgroundSecondary }}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <SunIcon size={18} color={colors.HeaderIconColor} />
              ) : (
                <MoonIcon size={18} color="#475569" />
              )}
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <div
          className={`flex-1 w-full ${
            signupStep === 4
              ? "px-4 sm:px-6 lg:px-8 py-4 max-w-5xl w-full mx-auto flex flex-col justify-start"
              : signupStep === 1
                ? "px-6 sm:px-12 lg:px-16 flex flex-col justify-center pb-12  mx-auto lg:mx-0"
                : signupStep === 0
                  ? "px-4 sm:px-8 py-8 max-w-2xl w-full mx-auto flex flex-col justify-center items-center"
                  : "px-4 sm:px-6 lg:px-8 xl:px-10 py-4 max-w-5xl w-full mx-auto flex flex-col justify-start"
          }`}
        >
          <AnimatePresence mode="wait">
            <SignupContext.Provider
              value={{ triggerExitModal: () => setIsExitModalOpen(true) }}
            >
              <Outlet />
            </SignupContext.Provider>
          </AnimatePresence>
        </div>
      </main>

      {/* Right Column: Hero Card ONLY FOR STEP 1 (Signup) */}
      {signupStep === 1 && <SignupHeroCard />}

      {/* Exit Confirmation Modal */}
      <ExitOnboardingModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={handleConfirmExit}
        isSaving={isSaving}
      />
    </div>
  );
};

export default Signup;

