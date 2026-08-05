import { CSSProperties } from "react";
import { ThemeColors } from "../../../utils/theme/colors";

type AccountFlowThemeStyle = CSSProperties & Record<`--flow-${string}`, string>;

const withAlpha = (color: string, alpha: number) => {
  const hex = color.replace("#", "");

  if (color.startsWith("#") && (hex.length === 3 || hex.length === 6)) {
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;
    const value = Number.parseInt(normalized, 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }

  const rgbMatch = color.match(/\d+(\.\d+)?/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${alpha})`;
  }

  return color;
};

export const getAccountFlowThemeVars = (
  colors: ThemeColors,
): AccountFlowThemeStyle => ({
  "--flow-bg": colors.Card,
  "--flow-header": withAlpha(colors.Card, 0.82),
  "--flow-surface": colors.Background,
  "--flow-surface-high": colors.BackgroundSecondary,
  "--flow-surface-highest": colors.CardSecondary,
  "--flow-surface-soft": withAlpha(colors.BackgroundSecondary, 0.3),
  "--flow-surface-low-alpha": withAlpha(colors.Background, 0.5),
  "--flow-glass": colors.GlassBg,
  "--flow-border": colors.GlassBorder,
  "--flow-shadow": colors.HeaderBoxShadow,
  "--flow-text": colors.TextPrimary,
  "--flow-heading": colors.TextOverlay,
  "--flow-muted": colors.TextBody,
  "--flow-primary": colors.TextGradientOne,
  "--flow-secondary": colors.TextGradientTwo,
  "--flow-primary-container": colors.BackgroundGradientOne,
  "--flow-secondary-container": colors.BackgroundGradientTwo,
  "--flow-primary-soft": colors.UISelectionCardBackground,
  "--flow-primary-faint": withAlpha(colors.HeaderItemActiveColor, 0.1),
  "--flow-primary-glow": withAlpha(colors.HeaderItemActiveColor, 0.16),
  "--flow-secondary-glow": withAlpha(colors.TextGradientTwo, 0.12),
  "--flow-overlay-muted": withAlpha(colors.TextOverlay, 0.72),
  "--flow-error": colors.WarningText,
  "--flow-error-soft": colors.WarningBackground,
  "--flow-warning": colors.RatingIconColor,
  "--flow-ready": colors.BrandEmerald,
  "--flow-log-bg": colors.Card,
  "--flow-field-muted": colors.FooterText,
  "--flow-button-one": colors.ButtonGradientOne,
  "--flow-button-two": colors.ButtonGradientTwo,
  "--flow-button-text": colors.TextOverlay,
  "--flow-button-glow": withAlpha(colors.HeaderItemActiveColor, 0.26),
});
