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
    root.style.setProperty(
      "--app-delete-api-button-bg",
      colors.DeleteAPIButtonBg,
    );
    root.style.setProperty(
      "--app-delete-api-button-border",
      colors.DeleteAPIButtonBorder,
    );
    root.style.setProperty(
      "--app-delete-api-button-text",
      colors.DeleteAPIButtonText,
    );
    root.style.setProperty(
      "--app-delete-api-button-bg-hover",
      colors.DeleteAPIButtonBgHover,
    );
    root.style.setProperty(
      "--app-delete-api-button-border-hover",
      colors.DeleteAPIButtonBorderHover,
    );
    root.style.setProperty(
      "--app-delete-api-button-text-hover",
      colors.DeleteAPIButtonTextHover,
    );
    root.style.setProperty(
      "--app-query-params-button-icon",
      colors.QueryParamsButtonIcon,
    );
    root.style.setProperty(
      "--app-query-params-button-bg",
      colors.QueryParamsButtonBg,
    );
    root.style.setProperty(
      "--app-query-params-button-text",
      colors.QueryParamsButtonText,
    );
    root.style.setProperty(
      "--app-query-params-button-border",
      colors.QueryParamsButtonBorder,
    );
    root.style.setProperty(
      "--app-query-params-button-bg-hover",
      colors.QueryParamsButtonBgHover,
    );
    root.style.setProperty(
      "--app-toggle-table-view-bg",
      colors.ToggleTableTextViewBg,
    );
    root.style.setProperty(
      "--app-toggle-table-view-border",
      colors.ToggleTableTextViewBorder,
    );

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
    root.style.setProperty(
      "--app-logout-button-background",
      colors.LogoutButtonBackground,
    );
    root.style.setProperty("--app-glass-bg", colors.GlassBg);
    root.style.setProperty("--app-glass-border", colors.GlassBorder);
    root.style.setProperty(
      "--app-glass-border-secondary",
      colors.GlassBorderSecondary,
    );
    root.style.setProperty("--app-method-get-bg", colors.MethodGetBg);
    root.style.setProperty("--app-method-get-text", colors.MethodGetText);
    root.style.setProperty("--app-method-get-border", colors.MethodGetBorder);
    root.style.setProperty("--app-method-post-bg", colors.MethodPostBg);
    root.style.setProperty("--app-method-post-text", colors.MethodPostText);
    root.style.setProperty("--app-method-post-border", colors.MethodPostBorder);
    root.style.setProperty("--app-method-put-bg", colors.MethodPutBg);
    root.style.setProperty("--app-method-put-text", colors.MethodPutText);
    root.style.setProperty("--app-method-put-border", colors.MethodPutBorder);
    root.style.setProperty("--app-method-patch-bg", colors.MethodPatchBg);
    root.style.setProperty("--app-method-patch-text", colors.MethodPatchText);
    root.style.setProperty(
      "--app-method-patch-border",
      colors.MethodPatchBorder,
    );
    root.style.setProperty("--app-method-delete-bg", colors.MethodDeleteBg);
    root.style.setProperty("--app-method-delete-text", colors.MethodDeleteText);
    root.style.setProperty(
      "--app-method-delete-border",
      colors.MethodDeleteBorder,
    );
    root.style.setProperty("--app-dynamic-badge-bg", colors.DynamicBadgeBg);
    root.style.setProperty(
      "--app-dynamic-badge-border",
      colors.DynamicBadgeBorder,
    );
    root.style.setProperty("--app-dynamic-badge-text", colors.DynamicBadgeText);
    root.style.setProperty("--app-success-badge-bg", colors.SuccessBadgeBg);
    root.style.setProperty("--app-success-badge-text", colors.SuccessBadgeText);
    root.style.setProperty(
      "--app-success-badge-border",
      colors.SuccessBadgeBorder,
    );
    root.style.setProperty("--app-error-badge-bg", colors.ErrorBadgeBg);
    root.style.setProperty("--app-error-badge-text", colors.ErrorBadgeText);
    root.style.setProperty("--app-error-badge-border", colors.ErrorBadgeBorder);
    root.style.setProperty("--app-table-divider", colors.TableDivider);

    /*--*/
    /* Widget Theme Variables */
    root.style.setProperty("--widget-container-bg", colors.WidgetContainerBg);
    root.style.setProperty(
      "--widget-container-border",
      colors.WidgetContainerBorder,
    );
    root.style.setProperty("--widget-card-bg", colors.WidgetCardBg);
    root.style.setProperty("--widget-card-border", colors.WidgetCardBorder);
    root.style.setProperty("--widget-card-hover", colors.WidgetCardHover);
    root.style.setProperty("--widget-header-title", colors.WidgetHeaderTitle);
    root.style.setProperty(
      "--widget-header-subtitle",
      colors.WidgetHeaderSubtitle,
    );
    root.style.setProperty("--widget-metric-val", colors.WidgetMetricVal);
    root.style.setProperty("--widget-metric-label", colors.WidgetMetricLabel);
    root.style.setProperty("--widget-badge-bg", colors.WidgetBadgeBg);
    root.style.setProperty("--widget-badge-text", colors.WidgetBadgeText);
    root.style.setProperty("--widget-badge-border", colors.WidgetBadgeBorder);
    root.style.setProperty("--widget-chart-primary", colors.WidgetChartPrimary);
    root.style.setProperty(
      "--widget-chart-secondary",
      colors.WidgetChartSecondary,
    );
    root.style.setProperty("--widget-chart-grid", colors.WidgetChartGrid);

    // Palette Swatches
    root.style.setProperty("--swatch-indigo", colors.SwatchIndigo);
    root.style.setProperty("--swatch-emerald", colors.SwatchEmerald);
    root.style.setProperty("--swatch-crimson", colors.SwatchCrimson);
    root.style.setProperty("--swatch-ocean", colors.SwatchOcean);
    root.style.setProperty("--swatch-violet", colors.SwatchViolet);
    root.style.setProperty("--swatch-amber", colors.SwatchAmber);
    root.style.setProperty("--swatch-slate", colors.SwatchSlate);

    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [colors, isDark]);
};
