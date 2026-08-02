import React, { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LeftArrowIcon, RightArrowIcon } from "../../../../../assets/icons";
import { ThemeColors } from "../../../../../utils/theme/colors";
import styles from "../../../../../styles/forgotpassword.module.css";

interface StepActionBarProps {
  colors: ThemeColors;
  step: 1 | 2 | 3;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  label: string;
  icon: React.ReactNode;
  variant?: "gradient" | "emerald";
}

const StepActionBar: FC<StepActionBarProps> = ({
  colors,
  step,
  onSubmit,
  disabled,
  loading,
  loadingLabel = "Please wait...",
  label,
  icon,
  variant = "gradient",
}) => {
  const navigate = useNavigate();

  return (
    <footer
      className={styles.stepFooter}
      style={{
        background: colors.BackgroundSecondary,
        borderTop: `1px solid ${colors.HeaderBottomBorder}`,
      }}
    >
      <div className={styles.stepFooterInner}>
        {/* Back to Login */}
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className={styles.backBtn}
          style={{ color: colors.TextBody }}
        >
          <LeftArrowIcon size={16} color={colors.IconColor} />
          Back to Login
        </button>

        {/* Right side: CTA button */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || loading}
            className={variant === "emerald" ? styles.btnEmerald : styles.btn}
            style={
              variant === "emerald"
                ? { background: colors.BrandEmerald }
                : {
                    background: `linear-gradient(135deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                    boxShadow: `0 10px 30px ${colors.ButtonGradientOne}33`,
                  }
            }
          >
            {loading ? (
              loadingLabel
            ) : (
              <>
                {label}
                {icon}
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default StepActionBar;
