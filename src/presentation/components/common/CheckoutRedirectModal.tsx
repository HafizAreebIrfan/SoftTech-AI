import React, { FC } from "react";
import { XMarkIcon } from "../../../assets/icons";

interface CheckoutRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformType?: "web" | "mobile" | "both";
  webCheckoutUrl?: string;
  mobileDeepLink?: string;
  paramsContext?: Record<string, any>;
  colors: Record<string, string>;
}

export const CheckoutRedirectModal: FC<CheckoutRedirectModalProps> = ({
  isOpen,
  onClose,
  platformType = "web",
  webCheckoutUrl,
  mobileDeepLink,
  paramsContext = {},
  colors,
}) => {
  if (!isOpen) return null;

  const isMobileDevice = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const buildUrlWithParams = (baseUrl?: string): string => {
    if (!baseUrl) return "#";
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      Object.entries(paramsContext).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      });
      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  const finalWebUrl = buildUrlWithParams(webCheckoutUrl);
  const finalMobileUrl = buildUrlWithParams(mobileDeepLink);

  const handleWebOpen = () => {
    if (finalWebUrl && finalWebUrl !== "#") {
      window.open(finalWebUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleMobileOpen = () => {
    if (finalMobileUrl && finalMobileUrl !== "#") {
      window.location.href = finalMobileUrl;
    }
  };

  // Generate Google Chart API QR Code URL for desktop mobile fallback
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    finalMobileUrl !== "#" ? finalMobileUrl : finalWebUrl,
  )}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "460px",
          background: colors.BackgroundSecondary || "#18181b",
          border: `1px solid ${colors.CardBorder || "#27272a"}`,
          borderRadius: "1rem",
          padding: "1.5rem",
          color: colors.TextHeading || "#ffffff",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.TextBody || "#a1a1aa",
          }}
        >
          <XMarkIcon size={18} color={colors.TextBody || "#a1a1aa"} />
        </button>

        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {platformType === "mobile" && !isMobileDevice ? "Scan QR for Mobile App Checkout" : "Proceed to Official Checkout"}
        </h3>

        <p style={{ fontSize: "0.8125rem", color: colors.TextBody || "#a1a1aa", marginBottom: "1.25rem", lineHeight: 1.4 }}>
          {platformType === "mobile" && !isMobileDevice
            ? "This checkout is configured for Mobile App. Scan the QR code below on your mobile phone to complete checkout."
            : "Complete your payment & checkout securely on the official platform with pre-filled context."}
        </p>

        {/* Mobile App Only on Desktop: Render QR Code */}
        {platformType === "mobile" && !isMobileDevice ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", margin: "1rem 0" }}>
            <div style={{ padding: "0.75rem", background: "#ffffff", borderRadius: "0.75rem" }}>
              <img src={qrCodeUrl} alt="Mobile Checkout QR Code" style={{ width: "160px", height: "160px", display: "block" }} />
            </div>
            <span style={{ fontSize: "0.75rem", color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "0.375rem 0.75rem", borderRadius: "0.375rem" }}>
              ⚠️ Mobile App Deep Link detected on Desktop PC
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", margin: "1rem 0" }}>
            {(platformType === "web" || platformType === "both") && webCheckoutUrl && (
              <button
                onClick={handleWebOpen}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Open Official Web Checkout ↗
              </button>
            )}

            {(platformType === "mobile" || platformType === "both") && mobileDeepLink && isMobileDevice && (
              <button
                onClick={handleMobileOpen}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "#10b981",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Open Mobile App Deep Link 📱
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
