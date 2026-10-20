import React, { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LeftArrowIcon } from "../../../../../assets/icons";
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
    <footer className={styles.stepFooter}>
      <div className={styles.stepFooterInner}>
        {/* Back to Login */}
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className={styles.backBtn}
        >
          <LeftArrowIcon size={16} color={colors.IconColor} />
          Back to Login
        </button>

        {/* Right side: CTA button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || loading}
            className={variant === "emerald" ? styles.btnEmerald : styles.btn}
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
