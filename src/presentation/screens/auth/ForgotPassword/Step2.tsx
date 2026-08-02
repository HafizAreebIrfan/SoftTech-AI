import React, { FC, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore, useForgotPasswordStore } from "../../../../hooks";
import {
  DEMO_OTP,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
} from "../../../../adapters/api/authApi";
import { CheckIcon, RefreshIcon } from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { otpSchema } from "../../../../infrastructure/validation/forgotPasswordSchemas";
import styles from "../../../../styles/forgotpassword.module.css";
import StepActionBar from "./components/StepActionBar";
import OtpInputGroup from "./components/OtpInputGroup";

const RESEND_COOLDOWN = 30;

const ForgotPasswordStep2: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { email, otp, setOtp, isOtpVerified, setOtpVerified } =
    useForgotPasswordStore();
  const [error, setError] = useState<string | null>(null);
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
    mutationFn: verifyPasswordResetOtp,
    onSuccess: (res) => {
      if (res.success) {
        setError(null);
        setOtpVerified(true);
      } else {
        setOtpVerified(false);
        setError(res.message);
      }
    },
    onError: () => {
      setOtpVerified(false);
      setError("Invalid code, please try again.");
    },
  });

  const { mutate: resendOtp, isPending: isResending } = useMutation({
    mutationFn: () => requestPasswordResetOtp(email),
    onSuccess: (res) => {
      setOtp("");
      setOtpVerified(false);
      setError(null);
      setCooldown(RESEND_COOLDOWN);
      showToast(res.message, "success");
    },
  });

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError(null);
    if (otpSchema.safeParse(value).success) {
      verifyOtp(value);
    } else {
      setOtpVerified(false);
    }
  };

  const handleContinue = () => {
    if (!isOtpVerified) {
      setError("Please enter and verify the code first.");
      return;
    }
    navigate({ to: "/forgot-password/step3" });
  };

  return (
    <>
      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className={styles.forgotmain}>
        <motion.div
          key="forgot-password-step-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: "100%", maxWidth: "28rem", position: "relative", zIndex: 10 }}
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
            {/* Blur accent blob (top-right of card) */}
            <div
              className={styles.cardAccentBlob}
              style={{ background: `${colors.CardActiveBorder}0d` }}
            />

            <div style={{ position: "relative", zIndex: 10 }}>
              {/* Heading */}
              <h1
                style={{
                  color: colors.TextHeading,
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  letterSpacing: "-0.025em",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Enter OTP
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  color: colors.TextBody,
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  marginBottom: "2.5rem",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                We've sent a verification code to your email.{" "}
                <br />
                Demo OTP:{" "}
                <span
                  style={{
                    color: colors.TextHighlightedHeading,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    marginLeft: "0.25rem",
                  }}
                >
                  {DEMO_OTP}
                </span>
              </p>

              {/* OTP Input Group + Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <OtpInputGroup
                  colors={colors}
                  value={otp}
                  onChange={handleOtpChange}
                  hasError={!!error}
                />

                {/* Verified success badge */}
                {isOtpVerified && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "9999px",
                      color: colors.BrandEmerald,
                      background: `${colors.BrandEmerald}1a`,
                      border: `1px solid ${colors.BrandEmerald}33`,
                    }}
                  >
                    <CheckIcon size={14} color={colors.BrandEmerald} />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Verified successfully!
                    </span>
                  </div>
                )}

                {/* Error message */}
                {!isOtpVerified && error && (
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#ef4444",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {isVerifying ? "Checking code..." : error}
                  </p>
                )}

                {/* Resend code */}
                <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => resendOtp()}
                    disabled={isResending || cooldown > 0}
                    style={{
                      color: colors.TextBody,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "color 0.2s ease",
                      opacity: isResending || cooldown > 0 ? 0.5 : 1,
                    }}
                  >
                    <RefreshIcon size={14} color={colors.IconColor} />
                    {cooldown > 0
                      ? `Resend available in ${cooldown}s`
                      : isResending
                        ? "Resending..."
                        : "Resend verification code"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── "Secured by Protocol" divider ─────────────── */}
          <div
            className={styles.securedDivider}
            style={{ color: colors.IconColor }}
          >
            <div
              className={styles.securedLine}
              style={{ background: colors.IconColor }}
            />
            <span className={styles.securedText}>Secured by Protocol</span>
            <div
              className={styles.securedLine}
              style={{ background: colors.IconColor }}
            />
          </div>
        </motion.div>

        {/* ── Page Number Decoration ──────────────────────── */}
        <div
          className={styles.pageNumDecoration}
          style={{ color: colors.CardActiveBorder }}
        >
          02
        </div>
      </main>

      {/* ── FOOTER ACTION BAR ───────────────────────────────── */}
      <StepActionBar
        colors={colors}
        step={2}
        onSubmit={handleContinue}
        disabled={!isOtpVerified}
        label="Continue"
        icon={<CheckIcon size={16} color="#ffffff" />}
        variant="emerald"
      />
    </>
  );
};

export default ForgotPasswordStep2;
