import { useEffect } from "react";
import { create } from "zustand";
import { darkColors, lightColors, ThemeColors } from "../../utils/theme/colors";

const THEME_KEY = "usertheme";

type ThemeStore = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const getSystemIsDark = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getSavedTheme = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(THEME_KEY);
};

const getInitialIsDark = () => {
  const savedTheme = getSavedTheme();
  if (savedTheme !== null) return savedTheme === "dark";
  return getSystemIsDark();
};

export const useThemeStore = create<ThemeStore>()((set) => ({
  isDark: getInitialIsDark(),
  colors: getInitialIsDark() ? darkColors : lightColors,
  toggleTheme: () =>
    set((state) => {
      const nextIsDark = !state.isDark;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_KEY, nextIsDark ? "dark" : "light");
      }
      return {
        isDark: nextIsDark,
        colors: nextIsDark ? darkColors : lightColors,
      };
    }),
}));

export const useApplyGlobalThemeVars = () => {
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Header & Navigation
    root.style.setProperty("--app-header-bg", colors.Headerbackground);
    root.style.setProperty("--app-header-box-shadow", colors.HeaderBoxShadow);
    root.style.setProperty(
      "--app-header-bottom-border",
      colors.HeaderBottomBorder,
    );
    root.style.setProperty("--app-header-item-color", colors.HeaderItemColor);
    root.style.setProperty(
      "--app-header-item-hover",
      colors.HeaderItemHoverColor,
    );
    root.style.setProperty(
      "--app-header-item-active",
      colors.HeaderItemActiveColor,
    );
    root.style.setProperty("--app-header-icon-color", colors.HeaderIconColor);

    // Global Backgrounds
    root.style.setProperty("--app-bg", colors.Background);
    root.style.setProperty("--app-bg-secondary", colors.BackgroundSecondary);
    root.style.setProperty("--app-overlay-shadow", colors.OverlayShadow);
    root.style.setProperty("--app-box-shadow", colors.OverlayShadow); // Fallback for old codebase
    root.style.setProperty(
      "--app-ui-selection-card-background",
      colors.UISelectionCardBackground,
    );

    // Cards
    root.style.setProperty("--app-surface", colors.Card); // Fallback for old codebase
    root.style.setProperty("--app-card", colors.Card);
    root.style.setProperty("--app-card-secondary", colors.CardSecondary);
    root.style.setProperty("--app-card-border", colors.CardBorder);
    root.style.setProperty(
      "--app-card-border-secondary",
      colors.CardBorderSecondary,
    );
    root.style.setProperty("--app-card-active-border", colors.CardActiveBorder);

    // Typography
    root.style.setProperty("--app-text-primary", colors.TextPrimary);
    root.style.setProperty("--app-text-secondary", colors.TextSecondary);
    root.style.setProperty("--app-text-overlay", colors.TextOverlay);
    root.style.setProperty("--app-text-heading", colors.TextHeading);
    root.style.setProperty("--app-text-body", colors.TextBody);
    root.style.setProperty("--app-text-grad-1", colors.TextGradientOne);
    root.style.setProperty("--app-text-grad-2", colors.TextGradientTwo);
    root.style.setProperty("--app-text-grad-3", colors.TextGradientThree);
    root.style.setProperty(
      "--app-text-highlighted-heading",
      colors.TextHighlightedHeading,
    );

    // Buttons & Interactivity
    root.style.setProperty("--app-accent", colors.ButtonGradientOne); // Fallback
    root.style.setProperty("--app-accent-hover", colors.ButtonGradientTwo); // Fallback
    root.style.setProperty("--app-btn-grad-1", colors.ButtonGradientOne);
    root.style.setProperty("--app-btn-grad-2", colors.ButtonGradientTwo);
    root.style.setProperty("--app-btn-secondary", colors.ButtonSecondary);
    root.style.setProperty("--app-button-secondary", colors.ButtonSecondary); // Fallback

    // Header specific Buttons
    root.style.setProperty(
      "--app-header-btn-grad-1",
      colors.HeaderButtonGradientOne,
    );
    root.style.setProperty(
      "--app-header-btn-grad-2",
      colors.HeaderButtonGradientTwo,
    );
    root.style.setProperty(
      "--app-header-btn-grad-text",
      colors.HeaderButtonGradientText,
    );
    root.style.setProperty(
      "--app-header-btn-secondary",
      colors.HeaderButtonSecondary,
    );
    root.style.setProperty(
      "--app-header-btn-secondary-text",
      colors.HeaderButtonSecondaryText,
    );

    // Pricing Buttons
    root.style.setProperty("--app-btn-pricing", colors.ButtonPricing);
    root.style.setProperty("--app-btn-pricing-text", colors.ButtonPricingText);
    root.style.setProperty(
      "--app-btn-pricing-secondary",
      colors.ButtonPricingSecondary,
    );
    root.style.setProperty(
      "--app-btn-pricing-secondary-text",
      colors.ButtonPricingSecondaryText,
    );

    // Overlay Buttons
    root.style.setProperty("--app-btn-overlay", colors.ButtonOverlay);
    root.style.setProperty("--app-btn-overlay-text", colors.ButtonOverlayText);
    root.style.setProperty(
      "--app-btn-overlay-secondary",
      colors.ButtonOverlaySecondary,
    );
    root.style.setProperty(
      "--app-btn-overlay-secondary-text",
      colors.ButtonOverlaySecondaryText,
    );

    // Footer
    root.style.setProperty("--app-footer-text", colors.FooterText);
    root.style.setProperty("--app-footer-heading", colors.FooterHeading);

    // Other System Styles
    root.style.setProperty("--app-border", colors.Border);
    root.style.setProperty("--app-bg-grad-1", colors.BackgroundGradientOne);
    root.style.setProperty("--app-bg-grad-2", colors.BackgroundGradientTwo);
    root.style.setProperty("--app-rating-icon", colors.RatingIconColor);
    root.style.setProperty("--app-icon-color", colors.IconColor);
    root.style.setProperty("--app-warning-text", colors.WarningText);
    root.style.setProperty(
      "--app-warning-background",
      colors.WarningBackground,
    );
    root.style.setProperty("--app-warning-border", colors.WarningBorder);

    // Wavy and Brand colors mapping
    root.style.setProperty("--app-wavy-indigo", colors.WavyIndigo);
    root.style.setProperty("--app-wavy-purple", colors.WavyPurple);
    root.style.setProperty("--app-wavy-blue", colors.WavyBlue);
    root.style.setProperty("--app-wavy-emerald", colors.WavyEmerald);
    root.style.setProperty("--app-wavy-fuchsia", colors.WavyFuchsia);
    root.style.setProperty("--app-wavy-white", colors.WavyWhite);
    root.style.setProperty("--app-brand-indigo", colors.BrandIndigo);
    root.style.setProperty("--app-brand-indigo-hover", colors.BrandIndigoHover);
    root.style.setProperty("--app-brand-emerald", colors.BrandEmerald);
    root.style.setProperty(
      "--app-brand-emerald-hover",
      colors.BrandEmeraldHover,
    );
    root.style.setProperty("--app-brand-blue", colors.BrandBlue);
    root.style.setProperty("--app-brand-blue-hover", colors.BrandBlueHover);
    root.style.setProperty("--app-brand-fuchsia", colors.BrandFuchsia);
    root.style.setProperty(
      "--app-brand-fuchsia-hover",
      colors.BrandFuchsiaHover,
    );
    root.style.setProperty("--app-border-error", colors.Bordererror);

    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [colors, isDark]);
};
