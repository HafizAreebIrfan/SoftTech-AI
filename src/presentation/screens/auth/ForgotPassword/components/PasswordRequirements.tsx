import React, { FC } from "react";
import { ThemeColors } from "../../../../../utils/theme/colors";
import { passwordRequirements } from "../../../../../infrastructure/validation/forgotPasswordSchemas";

interface PasswordRequirementsProps {
  colors: ThemeColors;
  password: string;
}

const REQUIREMENTS: { key: keyof typeof passwordRequirements; label: string }[] = [
  { key: "minLength", label: "8+ Characters" },
  { key: "uppercase", label: "Uppercase" },
  { key: "number", label: "Number" },
  { key: "specialChar", label: "Special Char" },
];

const PasswordRequirements: FC<PasswordRequirementsProps> = ({
  colors,
  password,
}) => {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        background: colors.Background,
        border: `1px solid ${colors.CardBorderSecondary}`,
      }}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {REQUIREMENTS.map(({ key, label }) => {
          const met = passwordRequirements[key](password);
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
                fontFamily: "'Inter', sans-serif",
                color: met ? colors.TextHighlightedHeading : colors.TextBody,
                opacity: met ? 1 : 0.6,
                transition: "all 0.2s ease",
              }}
            >
              {met ? (
                /* Filled circle with check mark */
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: "9999px",
                    flexShrink: 0,
                    background: colors.TextHighlightedHeading,
                  }}
                >
                  {/* Inline tiny check */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={10}
                    height={10}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.Background}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              ) : (
                /* Outline circle */
                <span
                  style={{
                    display: "block",
                    width: 16,
                    height: 16,
                    borderRadius: "9999px",
                    flexShrink: 0,
                    border: `2px solid ${colors.TextBody}`,
                    opacity: 0.5,
                  }}
                />
              )}
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordRequirements;
