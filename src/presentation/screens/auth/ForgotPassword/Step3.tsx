import React, { FC, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore, useForgotPasswordStore } from "../../../../hooks";
import { resetPassword } from "../../../../adapters/api/authApi";
import { EyeIcon, EyeOffIcon, KeyIcon, LeftArrowIcon } from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { newPasswordSchema } from "../../../../infrastructure/validation/forgotPasswordSchemas";

const ForgotPasswordStep3: FC = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const { email, otp, isOtpVerified, clearForgotPassword } =
    useForgotPasswordStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!email || !isOtpVerified) {
      navigate({ to: "/forgot-password/step1" });
    }
  }, [email, isOtpVerified, navigate]);

  const { mutate: updatePassword, isPending } = useMutation({
    mutationFn: resetPassword,
    onSuccess: (res) => {
      showToast(res.message || "Password updated successfully!", "success");
      clearForgotPassword();
      navigate({ to: "/login" });
    },
    onError: (err: any) => {
      showToast(
        err?.message || "Failed to update password. Please try again.",
        "error",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = newPasswordSchema.safeParse(passwords);
    if (!result.success) {
      const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as "newPassword" | "confirmPassword";
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      showToast(
        result.error.issues[0]?.message || "Please fix the password errors.",
        "error",
      );
      return;
    }
    setErrors({});
    updatePassword({ email, otp, newPassword: passwords.newPassword });
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon Box */}
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 shadow-sm ${
          isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
        }`}
      >
        <KeyIcon size={22} color={isDark ? "#94a3b8" : "#475569"} />
      </div>

      <h1
        className={`text-2xl sm:text-3xl font-bold mb-2 tracking-tight ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        Set new password
      </h1>
      <p
        className={`text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        Must be at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
        <div>
          <label
            htmlFor="new-password"
            className={`block text-sm font-medium mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={passwords.newPassword}
              onChange={(e) => {
                setPasswords({ ...passwords, newPassword: e.target.value });
                if (errors.newPassword) {
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }
              }}
              className={`block w-full px-4 pr-11 py-3 rounded-xl outline-none transition-all text-base border focus:ring-2 focus:ring-opacity-50 ${
                errors.newPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : isDark
                    ? "bg-[#0f1115] border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-3 flex items-center transition-colors hover:text-blue-500 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              ) : (
                <EyeOffIcon size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <span className="text-xs text-red-500 mt-1.5 block font-medium ml-1">
              {errors.newPassword}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className={`block text-sm font-medium mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={passwords.confirmPassword}
              onChange={(e) => {
                setPasswords({ ...passwords, confirmPassword: e.target.value });
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              className={`block w-full px-4 pr-11 py-3 rounded-xl outline-none transition-all text-base border focus:ring-2 focus:ring-opacity-50 ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : isDark
                    ? "bg-[#0f1115] border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-3 flex items-center transition-colors hover:text-blue-500 focus:outline-none"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeIcon size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              ) : (
                <EyeOffIcon size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-red-500 mt-1.5 block font-medium ml-1">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-semibold text-white transition-all duration-200 shadow-sm mt-2 ${
            isPending
              ? "opacity-70 cursor-not-allowed bg-blue-500"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          }`}
        >
          {isPending ? "Resetting..." : "Reset password"}
        </button>
      </form>

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

export default ForgotPasswordStep3;
