import { CSSProperties } from "react";
import { ThemeColors } from "../../../utils/theme/colors";

type CompanyThemeStyle = CSSProperties & Record<`--company-${string}`, string>;

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

export const getCompanyThemeVars = (colors: ThemeColors): CompanyThemeStyle => ({
  "--company-bg": colors.Card,
  "--company-sidebar": colors.Headerbackground,
  "--company-topbar": withAlpha(colors.Card, 0.82),
  "--company-surface": colors.Background,
  "--company-surface-high": withAlpha(colors.BackgroundSecondary, 0.5),
  "--company-surface-highest": colors.BackgroundSecondary,
  "--company-surface-bright": colors.CardSecondary,
  "--company-text": colors.TextPrimary,
  "--company-heading": colors.TextHeading,
  "--company-brand-heading": colors.TextOverlay,
  "--company-muted": colors.TextBody,
  "--company-faint": colors.FooterText,
  "--company-border": colors.GlassBorderSecondary,
  "--company-border-strong": colors.GlassBorder,
  "--company-shadow": colors.HeaderBoxShadow,
  "--company-card-shadow": withAlpha(colors.TextGradientOne, 0.2),
  "--company-hover": withAlpha(colors.TextOverlay, 0.05),
  "--company-primary": colors.TextGradientOne,
  "--company-primary-soft": colors.UISelectionCardBackground,
  "--company-primary-border": withAlpha(colors.TextGradientOne, 0.2),
  "--company-primary-wash": withAlpha(colors.TextGradientOne, 0.1),
  "--company-secondary-wash": withAlpha(colors.TextGradientTwo, 0.06),
  "--company-error": colors.WarningText,
  "--company-error-soft": colors.WarningBackground,
  "--company-button-one": colors.ButtonGradientOne,
  "--company-button-two": colors.ButtonGradientTwo,
  "--company-button-text": colors.TextOverlay,
  "--company-button-glow": withAlpha(colors.HeaderItemActiveColor, 0.24),
});
