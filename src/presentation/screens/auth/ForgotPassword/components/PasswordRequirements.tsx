import React, { FC } from "react";
import { ThemeColors } from "../../../../../utils/theme/colors";
import { passwordRequirements } from "../../../../../infrastructure/validation/forgotPasswordSchemas";
import { CheckIcon } from "../../../../../assets/icons";
import styles from "../../../../../styles/forgotpassword.module.css";

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
    <div className={styles.passwordRequirementsCard}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REQUIREMENTS.map(({ key, label }) => {
          const met = passwordRequirements[key](password);
          return (
            <div
              key={key}
              className={`${styles.requirementRow} ${
                met ? styles.requirementMet : styles.requirementUnmet
              }`}
            >
              {met ? (
                <span className={styles.checkCircleFilled}>
                  <CheckIcon size={10} color="#ffffff" />
                </span>
              ) : (
                <span className={styles.checkCircleOutline} />
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
