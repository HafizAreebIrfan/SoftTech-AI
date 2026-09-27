import React, { FC, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore, useForgotPasswordStore } from "../../../../hooks";
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
} from "../../../../adapters/api/authApi";
import { EmailIcon, LeftArrowIcon } from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { otpSchema } from "../../../../infrastructure/validation/forgotPasswordSchemas";
import OtpInputGroup from "./components/OtpInputGroup";

const RESEND_COOLDOWN = 30;

const ForgotPasswordStep2: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark } = useThemeStore();
  const { email, otp, setOtp, isOtpVerified, setOtpVerified } =
    useForgotPasswordStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate({ to: "/forgot-password/step1" });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation({
    mutationFn: (code: string) => verifyPasswordResetOtp(email, code),
    onSuccess: (res) => {
      if (res.success) {
        setErrorMsg(null);
        setOtpVerified(true);
        showToast("Code verified successfully!", "success");
        navigate({ to: "/forgot-password/step3" });
      } else {
        setOtpVerified(false);
        setErrorMsg(res.message || "Invalid verification code.");
      }
    },
    onError: (err: any) => {
      setOtpVerified(false);
      setErrorMsg(err?.message || "Invalid code, please try again.");
    },
  });

  const { mutate: resendOtp, isPending: isResending } = useMutation({
    mutationFn: () => requestPasswordResetOtp(email),
    onSuccess: (res) => {
      setOtp("");
      setOtpVerified(false);
      setErrorMsg(null);
      setCooldown(RESEND_COOLDOWN);
      showToast(res.message || "New verification code sent.", "success");
    },
    onError: (err: any) => {
      showToast(err?.message || "Failed to resend code. Try again.", "error");
    },
  });

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (errorMsg) setErrorMsg(null);
    if (otpSchema.safeParse(value).success) {
      verifyOtp(value);
    } else {
      setOtpVerified(false);
    }
  };

  const handleContinue = () => {
    if (!otp || otp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit code.");
      return;
    }
    if (!isOtpVerified) {
      verifyOtp(otp);
      return;
    }
    navigate({ to: "/forgot-password/step3" });
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon Box */}
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 shadow-sm ${
          isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
        }`}
      >
        <EmailIcon size={24} color={isDark ? "#94a3b8" : "#475569"} />
      </div>

      <h1
        className={`text-2xl sm:text-3xl font-bold mb-2 tracking-tight ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        Password reset
      </h1>
      <p
        className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        We sent a 6-digit code to{" "}
        <span
          className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {email || "your email"}
        </span>
      </p>

      <div className="w-full">
        <OtpInputGroup
          colors={colors}
          length={6}
          value={otp}
          onChange={handleOtpChange}
          hasError={!!errorMsg}
        />

        {errorMsg && (
          <span className="text-xs text-red-500 -mt-2 mb-4 block font-medium">
            {errorMsg}
          </span>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={otp.length !== 6 || isVerifying}
          className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-semibold text-white transition-all duration-200 shadow-sm ${
            otp.length !== 6 || isVerifying
              ? "opacity-70 cursor-not-allowed bg-blue-500"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          }`}
        >
          {isVerifying ? "Verifying..." : "Continue"}
        </button>

        <div className="text-center mt-6 text-sm">
          <span className={isDark ? "text-slate-400" : "text-slate-500"}>
            Didn't receive the email?{" "}
          </span>
          <button
            type="button"
            onClick={() => resendOtp()}
            disabled={isResending || cooldown > 0}
            className={`font-semibold transition-colors ${
              isResending || cooldown > 0
                ? "opacity-60 cursor-not-allowed text-slate-400"
                : isDark
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
            }`}
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : isResending
                ? "Sending..."
                : "Click to resend"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/login" })}
        className={`flex items-center justify-center gap-2 text-sm font-semibold mt-8 transition-colors ${
          isDark
            ? "text-slate-400 hover:text-white"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <LeftArrowIcon size={16} /> Back to log in
      </button>
    </div>
  );
};

export default ForgotPasswordStep2;
