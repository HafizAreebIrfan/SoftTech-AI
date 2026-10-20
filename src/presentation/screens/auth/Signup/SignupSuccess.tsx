import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { color, motion } from "motion/react";
import { useSignupStore } from "../../../../infrastructure/store/signupStore";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import {
  CheckIcon,
  SparklesIcon,
  ServerIcon,
  RightArrowIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/signup.module.css";
import { useThemeStore } from "../../../../hooks";

export const SignupSuccess: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { stepOneData } = useSignupStore();
  const { user } = useAuthStore();

  const companyName = stepOneData?.companyName || user?.name || "Your Company";
  const subdomain =
    stepOneData?.subdomain ||
    companyName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "workspace";
  const adminEmail =
    stepOneData?.adminEmail || user?.email || "admin@company.com";
  const industry = stepOneData?.primaryIndustry || "Technology";
  const platform = stepOneData?.targetPlatform || "Web App";

  const handleContinue = () => {
    navigate({ to: "/signup/onboarding-step1" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`w-full ${styles.signupSuccessContainer}`}
    >
      {/* Celebration Icon Container */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full blur-2xl animate-pulse" />
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/15 relative z-10"
          style={{ background: colors.SuccessBtnBg }}
        >
          <CheckIcon size={40} color={colors.SuccessScreenIconColor} />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h2
        className={`text-3xl font-extrabold tracking-tight mb-2.5 ${styles.signupTitle}`}
      >
        Account Created Successfully
        <span
          className="text-emerald-500"
          style={{ color: colors.SuccessBadgeText }}
        >
          !
        </span>
      </h2>
      <p
        className={`text-sm sm:text-base font-normal max-w-md mx-auto mb-8 ${styles.signupSubtitle}`}
      >
        Welcome aboard,{" "}
        <strong className={`font-semibold ${colors.TextHighlightedHeading}`}>
          {companyName}
        </strong>
        . Your tenant workspace and foundational account identity have been
        created.
      </p>

      {/* Onboarding Roadmap Preview Box */}
      <div
        className={`rounded-2xl p-5 mb-8 text-left border ${styles.roadmapPreviewCard}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon size={15} color={colors.SuccessBadgeText} />
          <h4
            className={`text-xs font-bold uppercase tracking-wider ${styles.signupTitle}`}
          >
            What&apos;s Next: Workspace Onboarding
          </h4>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-sm ${styles.primarySubmitBtn}`}
            >
              1
            </div>
            <div>
              <strong
                className={`font-semibold ${colors.TextHighlightedHeading}`}
              >
                Onboarding Step 1: Connect Your APIs
              </strong>
              <p
                className="text-slate-500 dark:text-slate-400 mt-0.5"
                style={{ color: colors.TextBody }}
              >
                Map your internal endpoints manually or import everything in 1
                click via OpenAPI / Swagger or Postman.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </div>
            <div>
              <strong
                className={`font-semibold ${colors.TextHighlightedHeading}`}
              >
                Onboarding Step 2: Adaptive UI & Branding
              </strong>
              <p
                className="text-slate-500 dark:text-slate-400 mt-0.5"
                style={{ color: colors.TextBody }}
              >
                Customize your layout, color tokens, and interactive ChatGPT
                widget features before deployment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Countdown */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleContinue}
          className={`w-full sm:w-auto text-white px-8 py-3.5 active:scale-[0.99] rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${styles.primarySubmitBtn}`}
        >
          <span>Continue to Onboarding (Step 1)</span>
        </button>
      </div>
    </motion.div>
  );
};

export default SignupSuccess;
