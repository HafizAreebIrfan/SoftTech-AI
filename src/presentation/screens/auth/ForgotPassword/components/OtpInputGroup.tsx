import React, { FC, useRef } from "react";
import { ThemeColors } from "../../../../../utils/theme/colors";
import styles from "../../../../../styles/forgotpassword.module.css";

interface OtpInputGroupProps {
  colors: ThemeColors;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

const OtpInputGroup: FC<OtpInputGroupProps> = ({
  colors,
  length = 5,
  value,
  onChange,
  hasError,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const updateValue = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);
    updateValue(index, digit);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      updateValue(index - 1, "");
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, "").slice(0, length));
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className={styles.otpInput}
          style={{
            background: colors.Background,
            borderColor: hasError
              ? colors.WarningBorder
              : `${colors.CardActiveBorder}80`,
            color: colors.TextHighlightedHeading,
          }}
          maxLength={1}
          inputMode="numeric"
          type="text"
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

export default OtpInputGroup;
