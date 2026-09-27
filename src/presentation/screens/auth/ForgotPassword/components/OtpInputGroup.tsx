import React, { FC, useRef } from "react";
import { ThemeColors } from "../../../../../utils/theme/colors";
import { useThemeStore } from "../../../../../hooks";

interface OtpInputGroupProps {
  colors?: ThemeColors;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

const OtpInputGroup: FC<OtpInputGroupProps> = ({
  length = 6,
  value,
  onChange,
  hasError,
}) => {
  const { isDark } = useThemeStore();
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
    <div className="flex justify-center gap-2 sm:gap-2.5 my-6">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border outline-none transition-all ${
            hasError
              ? "border-red-500 text-red-500 bg-red-50/10 focus:ring-2 focus:ring-red-500/20"
              : isDark
                ? "bg-[#0f1115] border-slate-800 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          }`}
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
