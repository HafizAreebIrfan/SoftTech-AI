import React, { FC } from "react";
import { useErrorStore } from "../../../infrastructure/store/errorStore";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { RefreshIcon, XMarkIcon, ShieldLockIcon } from "../../../assets/icons";

export const CriticalErrorModal: FC = () => {
  const { error, clearError } = useErrorStore();
  const { colors } = useThemeStore();

  if (!error) return null;

  const handleRetry = () => {
    if (error.onRetry) {
      error.onRetry();
    } else {
      window.location.reload();
    }
    clearError();
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 503:
        return "503 Service Unavailable";
      case 500:
        return "500 Internal Server Error";
      case 403:
        return "403 Access Forbidden";
      case 401:
        return "401 Session Expired / Unauthorized";
      case 404:
        return "404 Resource Not Found";
      default:
        return `${status} Critical Error`;
    }
  };

  return (
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
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: colors.BackgroundSecondary,
          border: `1px solid ${colors.CardActiveBorder || colors.CardBorder}`,
          borderRadius: "1rem",
          padding: "1.75rem",
          color: colors.TextHeading,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        <button
          type="button"
          onClick={clearError}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.TextBody,
            padding: "0.25rem",
          }}
          title="Dismiss dialog"
        >
          <XMarkIcon size={18} color={colors.TextBody} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "0.75rem",
              background: colors.WarningBackground || "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${colors.WarningBorder || "rgba(239, 68, 68, 0.3)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldLockIcon size={22} color={colors.WarningText || "#ef4444"} />
          </div>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: colors.WarningText || "#ef4444",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {getStatusLabel(error.status)}
            </span>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: colors.TextHeading,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {error.title || "Critical System Notice"}
            </h3>
          </div>
        </div>

        <p
          style={{
            fontSize: "0.875rem",
            color: colors.TextBody,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {error.message ||
            "An unexpected server communication issue occurred. You can retry the operation or dismiss to stay on the page."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={clearError}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              background: colors.Background,
              border: `1px solid ${colors.CardBorder}`,
              color: colors.TextBody,
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Dismiss & Keep Page
          </button>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
              border: "none",
              color: "#ffffff",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              transition: "all 0.15s ease",
            }}
          >
            <RefreshIcon size={14} color="#ffffff" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
