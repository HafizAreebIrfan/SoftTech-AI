import React, { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore, useForgotPasswordStore } from "../../../../hooks";
import { requestPasswordResetOtp } from "../../../../adapters/api/authApi";
import { EmailIcon, RightArrowIcon } from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { emailSchema } from "../../../../infrastructure/validation/forgotPasswordSchemas";
import styles from "../../../../styles/forgotpassword.module.css";
import StepActionBar from "./components/StepActionBar";

const ForgotPasswordStep1: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { email, setEmail, setOtpVerified } = useForgotPasswordStore();

  const { mutate: sendOtp, isPending } = useMutation({
    mutationFn: requestPasswordResetOtp,
    onSuccess: (res) => {
      setOtpVerified(false);
      showToast(res.message, "success");
      navigate({ to: "/forgot-password/step2" });
    },
    onError: (err: any) => {
      showToast(
        err?.message || "Failed to send verification code. Try again.",
        "error",
      );
    },
  });

  const form = useForm({
    defaultValues: { email: email || "" },
    onSubmit: async ({ value }) => {
      const parsed = emailSchema.safeParse(value.email);
      if (!parsed.success) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
      setEmail(value.email);
      sendOtp(value.email);
    },
  });

  const handleSubmit = () => form.handleSubmit();

  return (
    <>
      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className={styles.forgotmain}>
        <motion.div
          key="forgot-password-step-1"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
          style={{ position: "relative", zIndex: 10 }}
        >
          {/* Card */}
          <div
            className={styles.forgotcard}
            style={{
              background: colors.BackgroundSecondary,
              border: `1px solid ${colors.CardBorder}`,
              borderLeft: `4px solid ${colors.CardActiveBorder}`,
              boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
            }}
          >
            {/* Heading block */}
            <div style={{ marginBottom: "2.5rem" }}>
              <h2
                className="font-headline"
                style={{
                  color: colors.TextHeading,
                  fontSize: "1.875rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Reset password
              </h2>
              <p
                style={{
                  color: colors.TextBody,
                  fontSize: "1.125rem",
                  lineHeight: "1.75",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Enter your email address to receive a 5-digit verification code.
                We'll help you secure your account.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <div className={styles.formField}>
                <label
                  className="font-label"
                  htmlFor="email"
                  style={{
                    color: colors.TextBody,
                    fontSize: "0.875rem",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Email Address
                </label>
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      const res = emailSchema.safeParse(value);
                      return res.success
                        ? undefined
                        : res.error.issues[0].message;
                    },
                  }}
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
                        <EmailIcon size={18} color={colors.IconColor} />
                      </span>
                      <input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="block w-full rounded-xl outline-none transition-all text-sm font-label"
                        style={{
                          background: colors.Background,
                          border: `1px solid ${
                            field.state.meta.errors?.length > 0
                              ? colors.WarningBorder
                              : colors.CardBorder
                          }`,
                          color: colors.TextPrimary,
                          paddingLeft: "3rem",
                          paddingRight: "1rem",
                          paddingTop: "0.75rem",
                          paddingBottom: "0.75rem",
                          height: "3.5rem",
                        }}
                      />
                      {field.state.meta.errors?.length > 0 && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "0.25rem",
                            fontSize: "0.6875rem",
                            color: "#ef4444",
                            fontWeight: 600,
                          }}
                        >
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            </form>
          </div>

          {/* ── Progress Dots (Step Indicator) ────────────── */}
          <div className={styles.progressDots}>
            <div className={styles.progressDotsRow}>
              {/* Active dot */}
              <div
                className={styles.progressDot}
                style={{ background: colors.CardActiveBorder }}
              />
              {/* Inactive dots */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={styles.progressDot}
                  style={{ background: colors.IconColor }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Bottom-right ambient visual ─────────────────── */}
        <div className={styles.ambientVisual}>
          <div
            className={styles.ambientVisualImg}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.CardActiveBorder}40 0%, transparent 70%)`,
            }}
          />
        </div>
      </main>

      {/* ── FOOTER ACTION BAR ───────────────────────────────── */}
      <StepActionBar
        colors={colors}
        step={1}
        onSubmit={handleSubmit}
        loading={isPending}
        loadingLabel="Sending..."
        label="Send OTP Code"
        icon={<RightArrowIcon size={16} color="#ffffff" />}
        variant="gradient"
      />
    </>
  );
};

export default ForgotPasswordStep1;
