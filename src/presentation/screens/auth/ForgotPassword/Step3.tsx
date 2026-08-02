import React, { FC, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  useThemeStore,
  useForgotPasswordStore,
} from "../../../../hooks";
import { resetPassword } from "../../../../adapters/api/authApi";
import { CheckIcon, EyeIcon, EyeOffIcon, LockIcon } from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { newPasswordSchema } from "../../../../infrastructure/validation/forgotPasswordSchemas";
import styles from "../../../../styles/forgotpassword.module.css";
import StepActionBar from "./components/StepActionBar";
import PasswordRequirements from "./components/PasswordRequirements";

const ForgotPasswordStep3: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { email, otp, isOtpVerified, clearForgotPassword } =
    useForgotPasswordStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const form = useForm({
    defaultValues: { newPassword: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      const parsed = newPasswordSchema.safeParse(value);
      if (!parsed.success) {
        showToast(parsed.error.issues[0].message, "error");
        return;
      }
      updatePassword({ email, otp, newPassword: value.newPassword });
    },
  });

  const handleSubmit = () => form.handleSubmit();

  return (
    <>
      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className={styles.forgotmain}>
        <div
          style={{
            maxWidth: "42rem",
            width: "100%",
            margin: "0 auto",
            position: "relative",
            zIndex: 10,
          }}
        >
          <motion.div
            key="forgot-password-step-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ── Heading block (OUTSIDE the card, per the design) ── */}
            <div style={{ marginBottom: "2.5rem" }}>
              <h2
                style={{
                  color: colors.TextHeading,
                  fontSize: "1.875rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                New password
              </h2>
              <p
                style={{
                  color: colors.TextBody,
                  fontSize: "1.125rem",
                  lineHeight: "1.75",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Create a new strong password for your account to ensure your
                neural data remains private and your connections encrypted.
              </p>
            </div>

            {/* ── Card ─────────────────────────────────────────── */}
            <div
              className={styles.forgotcard}
              style={{
                background: colors.BackgroundSecondary,
                border: `1px solid ${colors.CardBorder}`,
                borderLeft: `4px solid ${colors.CardActiveBorder}`,
                boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                {/* New Password field */}
                <div className={styles.formField} style={{ marginBottom: 0 }}>
                  <label
                    htmlFor="new-password"
                    className="group"
                    style={{
                      color: colors.TextBody,
                      fontSize: "0.875rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    New password
                  </label>
                  <form.Field
                    name="newPassword"
                    children={(field) => (
                      <div className="relative">
                        <span
                          style={{
                            position: "absolute",
                            left: "1rem",
                            top: "19px",
                            display: "flex",
                            alignItems: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <LockIcon size={18} color={colors.IconColor} />
                        </span>
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="block w-full rounded-xl outline-none transition-all text-sm font-label"
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                            color: colors.TextPrimary,
                            paddingLeft: "3rem",
                            paddingRight: "3rem",
                            paddingTop: "0.75rem",
                            paddingBottom: "0.75rem",
                            height: "3.5rem",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          style={{
                            position: "absolute",
                            right: "1rem",
                            top: "19px",
                            display: "flex",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: colors.IconColor,
                            transition: "color 0.2s ease",
                          }}
                        >
                          {showPassword ? (
                            <EyeOffIcon size={18} color={colors.IconColor} />
                          ) : (
                            <EyeIcon size={18} color={colors.IconColor} />
                          )}
                        </button>
                      </div>
                    )}
                  />
                </div>

                {/* Confirm Password field */}
                <div className={styles.formField} style={{ marginBottom: 0 }}>
                  <label
                    htmlFor="confirm-password"
                    style={{
                      color: colors.TextBody,
                      fontSize: "0.875rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Confirm password
                  </label>
                  <form.Field
                    name="confirmPassword"
                    children={(field) => (
                      <div className="relative">
                        <span
                          style={{
                            position: "absolute",
                            left: "1rem",
                            top: "19px",
                            display: "flex",
                            alignItems: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <LockIcon size={18} color={colors.IconColor} />
                        </span>
                        <input
                          id="confirm-password"
                          type={showConfirm ? "text" : "password"}
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="block w-full rounded-xl outline-none transition-all text-sm font-label"
                          style={{
                            background: colors.Background,
                            border: `1px solid ${colors.CardBorder}`,
                            color: colors.TextPrimary,
                            paddingLeft: "3rem",
                            paddingRight: "3rem",
                            paddingTop: "0.75rem",
                            paddingBottom: "0.75rem",
                            height: "3.5rem",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          style={{
                            position: "absolute",
                            right: "1rem",
                            top: "19px",
                            display: "flex",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: colors.IconColor,
                            transition: "color 0.2s ease",
                          }}
                        >
                          {showConfirm ? (
                            <EyeOffIcon size={18} color={colors.IconColor} />
                          ) : (
                            <EyeIcon size={18} color={colors.IconColor} />
                          )}
                        </button>
                      </div>
                    )}
                  />
                </div>

                {/* Password Requirements Panel */}
                <form.Subscribe
                  selector={(state) => state.values.newPassword}
                  children={(newPassword) => (
                    <PasswordRequirements colors={colors} password={newPassword} />
                  )}
                />
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── FOOTER ACTION BAR ───────────────────────────────── */}
      <StepActionBar
        colors={colors}
        step={3}
        onSubmit={handleSubmit}
        loading={isPending}
        loadingLabel="Updating..."
        label="Update Password"
        icon={<CheckIcon size={16} color="#ffffff" />}
        variant="emerald"
      />
    </>
  );
};

export default ForgotPasswordStep3;
