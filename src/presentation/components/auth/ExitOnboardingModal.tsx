import React, { FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import {
  AlertCircleIcon,
  SpinnerIcon,
  XMarkIcon,
  CheckIcon,
} from "../../../assets/icons";

interface ExitOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isSaving?: boolean;
}

export const ExitOnboardingModal: FC<ExitOnboardingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSaving = false,
}) => {
  const { colors, isDark } = useThemeStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.ModalBackdrop || "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          padding: "1rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            width: "100%",
            maxWidth: "460px",
            background: colors.BackgroundSecondary,
            border: `1px solid ${colors.CardActiveBorder || colors.CardBorder}`,
            borderRadius: "1.25rem",
            padding: "1.75rem",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            position: "relative",
          }}
        >
          {/* Close button */}
          {!isSaving && (
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "transparent",
                border: "none",
                color: colors.TextBody,
                cursor: "pointer",
                padding: "0.25rem",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Close"
            >
              <XMarkIcon size={18} color="currentColor" />
            </button>
          )}

          {/* Icon Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDark
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                flexShrink: 0,
              }}
            >
              <AlertCircleIcon size={24} color="#f59e0b" />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  margin: 0,
                  color: colors.TextHeading,
                  letterSpacing: "-0.01em",
                }}
              >
                Exit Onboarding Setup?
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#f59e0b",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Progress Will Be Preserved
              </span>
            </div>
          </div>

          {/* Body Description */}
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: "1.5",
              color: colors.TextBody,
              margin: "0 0 1.5rem 0",
            }}
          >
            Are you sure you want to go back? Your current configurations and
            API setups will be safely saved to your account and local workspace.
            You will be logged out so you can log back in at any time to resume
            right where you left off.
          </p>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: "0.625rem 1.125rem",
                borderRadius: "0.75rem",
                border: `1px solid ${colors.CardBorder}`,
                background: "transparent",
                color: colors.TextHeading,
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Stay on Page
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSaving}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              {isSaving ? (
                <>
                  <span
                    style={{
                      display: "inline-flex",
                      animation: "spin 1s linear infinite",
                    }}
                  >
                    <SpinnerIcon size={16} color="#ffffff" />
                  </span>
                  <span>Saving & Logging Out...</span>
                </>
              ) : (
                <>
                  <span>Save Progress & Log Out</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExitOnboardingModal;
