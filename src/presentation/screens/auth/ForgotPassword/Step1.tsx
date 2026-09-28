import React, { FC, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore, useForgotPasswordStore } from "../../../../hooks";
import { requestPasswordResetOtp } from "../../../../adapters/api/authApi";
import { LeftArrowIcon, LockIcon } from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { emailSchema } from "../../../../infrastructure/validation/forgotPasswordSchemas";

const ForgotPasswordStep1: FC = () => {
  const navigate = useNavigate();
  const { isDark, colors } = useThemeStore();
  const { email, setEmail, setOtpVerified } = useForgotPasswordStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate: sendOtp, isPending } = useMutation({
    mutationFn: requestPasswordResetOtp,
    onSuccess: (res) => {
      setOtpVerified(false);
      showToast(
        res.message || "Verification code sent to your email.",
        "success",
      );
      navigate({ to: "/forgot-password/step2" });
    },
    onError: (err: any) => {
      const msg =
        err?.message || "Failed to send verification code. Try again.";
      setErrorMsg(msg);
      showToast(msg, "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ||
        "Please enter a valid email address.";
      setErrorMsg(msg);
      showToast(msg, "error");
      return;
    }
    setErrorMsg(null);
    sendOtp(email);
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon Box */}
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 shadow-sm ${
          isDark
            ? "border-slate-800 bg-slate-900/60"
            : "border-slate-200 bg-white"
        }`}
      >
        <LockIcon size={22} color={isDark ? "#94a3b8" : "#475569"} />
      </div>

      <h1
        className={`text-2xl sm:text-3xl font-bold mb-2 tracking-tight ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        Forgot password?
      </h1>
      <p
        className={`text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        No worries, we'll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
        <div>
          <label
            htmlFor="forgot-email"
            className={`block text-sm font-medium mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            className={`block w-full px-4 py-3 rounded-xl outline-none transition-all text-base border focus:ring-2 focus:ring-opacity-50 ${
              errorMsg
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : isDark
                  ? "bg-[#0f1115] border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20"
                  : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
            }`}
          />
          {errorMsg && (
            <span className="text-xs text-red-500 mt-1.5 block font-medium ml-1">
              {errorMsg}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            background: isDark
              ? `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`
              : `linear-gradient(240deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
          }}
          className={`cursor-pointer w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-semibold text-white transition-all duration-200 shadow-sm ${
            isPending
              ? "opacity-70 cursor-not-allowed bg-blue-500"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          }`}
        >
          {isPending ? "Sending..." : "Reset password"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate({ to: "/login" })}
        className={`cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold mt-8 transition-colors 
          ${isDark ? "text-slate-300" : "text-slate-700"}
          `}
      >
        <LeftArrowIcon size={16} color={colors.IconColor} /> Back to log in
      </button>
    </div>
  );
};

export default ForgotPasswordStep1;
