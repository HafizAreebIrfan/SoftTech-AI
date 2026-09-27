/**
 * Centralized Design System Colors & Theme Tokens
 *
 * Semantic Hierarchy:
 * - Surface Background: Dark #0b0f19 | Light #ffffff
 * - Card Background (on top of surface): Dark #1e293b | Light #eff5fc
 * - Elevated / On-top-of-card / Borders: Dark #475569 | Light #e2e8f0 (slate-200)
 * - Brand Accent: Purple / Blue Gradient & Solid Indigo (#4f46e5, #6366f1, #7c3aed, #8b5cf6, #3b82f6)
 * - Button System: 3 tiers (Primary, Secondary, Tertiary)
 */

export type ThemeColors = {
  // --- Surface & Structural Tokens ---
  Background: string;
  BackgroundSecondary: string;
  SurfaceElevated: string;
  OverlayShadow: string;

  Headerbackground: string;
  HeaderBoxShadow: string;
  HeaderBottomBorder: string;
  HeaderItemColor: string;
  HeaderItemHoverColor: string;
  HeaderItemActiveColor: string;
  HeaderIconColor: string;

  // --- Cards & Elevation ---
  Card: string;
  CardSecondary: string;
  CardBorder: string;
  CardBorderSecondary: string;
  CardActiveBorder: string;

  // --- Typography ---
  TextPrimary: string;
  TextSecondary: string;
  TextOverlay: string;
  TextHeading: string;
  TextBody: string;
  TextGradientOne: string;
  TextGradientTwo: string;
  TextGradientThree: string;
  TextHighlightedHeading: string;

  // --- 3-Tier Button System ---
  // Tier 1: Primary (Brand Gradient / High Emphasis)
  ButtonPrimaryBg: string;
  ButtonPrimaryText: string;
  ButtonPrimaryHover: string;
  ButtonGradientOne: string;
  ButtonGradientTwo: string;

  // Tier 2: Secondary (Card Background + Slate Border / Medium Emphasis)
  ButtonSecondaryBg: string;
  ButtonSecondaryText: string;
  ButtonSecondaryBorder: string;
  ButtonSecondaryHover: string;
  ButtonSecondary: string;

  // Tier 3: Tertiary (Ghost / Subtle / Low Emphasis)
  ButtonTertiaryBg: string;
  ButtonTertiaryText: string;
  ButtonTertiaryHover: string;

  // Header, Pricing, & Overlay Button Aliases (Backward-Compatibility)
  HeaderButtonGradientOne: string;
  HeaderButtonGradientTwo: string;
  HeaderButtonGradientText: string;
  HeaderButtonSecondary: string;
  HeaderButtonSecondaryText: string;
  ButtonPricing: string;
  ButtonPricingText: string;
  ButtonPricingSecondary: string;
  ButtonPricingSecondaryText: string;
  ButtonOverlay: string;
  ButtonOverlayText: string;
  ButtonOverlaySecondary: string;
  ButtonOverlaySecondaryText: string;

  // --- Footer ---
  FooterText: string;
  FooterHeading: string;

  // --- Borders & Dividers ---
  Border: string;
  DividerColor: string;
  TableDivider: string;
  Bordererror: string;
  BackgroundGradientOne: string;
  BackgroundGradientTwo: string;

  // --- Icons ---
  RatingIconColor: string;
  AuthIconColor: string;
  IconColor: string;

  // --- Interactive States & Feedback ---
  UISelectionCardBackground: string;
  WarningText: string;
  WarningBackground: string;
  WarningBorder: string;
  LogoutButtonBackground: string;

  // --- Wavy Background & Brand Accents (Purple / Blue / Indigo) ---
  WavyIndigo: string;
  WavyPurple: string;
  WavyBlue: string;
  WavyEmerald: string;
  WavyFuchsia: string;
  WavyWhite: string;

  BrandIndigo: string;
  BrandIndigoHover: string;
  BrandEmerald: string;
  BrandEmeraldHover: string;
  BrandBlue: string;
  BrandBlueHover: string;
  BrandFuchsia: string;
  BrandFuchsiaHover: string;

  // --- Glassmorphism ---
  GlassBg: string;
  GlassBorder: string;
  GlassBorderSecondary: string;

  // --- HTTP Method Chips ---
  MethodGetBg: string;
  MethodGetText: string;
  MethodGetBorder: string;
  MethodPostBg: string;
  MethodPostText: string;
  MethodPostBorder: string;
  MethodPutBg: string;
  MethodPutText: string;
  MethodPutBorder: string;
  MethodPatchBg: string;
  MethodPatchText: string;
  MethodPatchBorder: string;
  MethodDeleteBg: string;
  MethodDeleteText: string;
  MethodDeleteBorder: string;

  // --- Badges & Actions ---
  DynamicBadgeBg: string;
  DynamicBadgeBorder: string;
  DynamicBadgeText: string;
  SuccessBadgeBg: string;
  SuccessBadgeText: string;
  SuccessBadgeBorder: string;
  ErrorBadgeBg: string;
  ErrorBadgeText: string;
  ErrorBadgeBorder: string;

  DeleteAPIButtonBg: string;
  DeleteAPIButtonBorder: string;
  DeleteAPIButtonText: string;
  DeleteAPIButtonBgHover: string;
  DeleteAPIButtonBorderHover: string;
  DeleteAPIButtonTextHover: string;

  QueryParamsButtonIcon: string;
  QueryParamsButtonBg: string;
  QueryParamsButtonText: string;
  QueryParamsButtonBorder: string;
  QueryParamsButtonBgHover: string;

  ToggleTableTextViewBg: string;
  ToggleTableTextViewBorder: string;

  TestApiBtnBg: string;
  TestApiBtnText: string;
  UploadSampleBtnBg: string;
  UploadSampleBtnBorder: string;
  UploadSampleBtnText: string;
  SuccessBtnBg: string;
  ModalBackdrop: string;

  // --- Widget Theme Tokens ---
  WidgetContainerBg: string;
  WidgetContainerBorder: string;
  WidgetCardBg: string;
  WidgetCardBorder: string;
  WidgetCardHover: string;
  WidgetHeaderTitle: string;
  WidgetHeaderSubtitle: string;
  WidgetMetricVal: string;
  WidgetMetricLabel: string;
  WidgetBadgeBg: string;
  WidgetBadgeText: string;
  WidgetBadgeBorder: string;
  WidgetChartPrimary: string;
  WidgetChartSecondary: string;
  WidgetChartGrid: string;

  // --- Palette Swatches ---
  SwatchIndigo: string;
  SwatchEmerald: string;
  SwatchCrimson: string;
  SwatchOcean: string;
  SwatchViolet: string;
  SwatchAmber: string;
  SwatchSlate: string;
};

// ==========================================
// DARK THEME (Surface: #0b0f19 | Card: #1e293b | On-Top: #475569)
// ==========================================
export const darkColors: ThemeColors = {
  // Surface & Structural
  Background: "#0b0f19",
  BackgroundSecondary: "#111827",
  SurfaceElevated: "#475569",
  OverlayShadow: "rgba(0, 0, 0, 0.75)",

  Headerbackground: "#0b0f19",
  HeaderBoxShadow: "rgba(0, 0, 0, 0.45)",
  HeaderBottomBorder: "rgba(255, 255, 255, 0.08)",
  HeaderItemColor: "#94a3b8",
  HeaderItemHoverColor: "#a5b4fc",
  HeaderItemActiveColor: "#818cf8",
  HeaderIconColor: "#94a3b8",

  // Cards
  Card: "#1e293b",
  CardSecondary: "#334155",
  CardBorder: "rgba(255, 255, 255, 0.08)",
  CardBorderSecondary: "#475569",
  CardActiveBorder: "#6366f1",

  // Typography
  TextPrimary: "#f8fafc",
  TextSecondary: "#94a3b8",
  TextOverlay: "#ffffff",
  TextHeading: "#f8fafc",
  TextBody: "#94a3b8",
  TextGradientOne: "#6366f1",
  TextGradientTwo: "#8b5cf6",
  TextGradientThree: "#3b82f6",
  TextHighlightedHeading: "#818cf8",

  // 3-Tier Buttons
  // 1. Primary: Indigo-to-Purple brand gradient
  ButtonPrimaryBg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  ButtonPrimaryText: "#ffffff",
  ButtonPrimaryHover: "#4338ca",
  ButtonGradientOne: "#4f46e5",
  ButtonGradientTwo: "#7c3aed",

  // 2. Secondary: Slate card background with elevated border
  ButtonSecondaryBg: "#1e293b",
  ButtonSecondaryText: "#f8fafc",
  ButtonSecondaryBorder: "#475569",
  ButtonSecondaryHover: "#334155",
  ButtonSecondary: "#1e293b",

  // 3. Tertiary: Transparent ghost with smooth hover
  ButtonTertiaryBg: "transparent",
  ButtonTertiaryText: "#94a3b8",
  ButtonTertiaryHover: "rgba(255, 255, 255, 0.08)",

  // Legacy Button Aliases
  HeaderButtonGradientOne: "#4f46e5",
  HeaderButtonGradientTwo: "#7c3aed",
  HeaderButtonGradientText: "#ffffff",
  HeaderButtonSecondary: "transparent",
  HeaderButtonSecondaryText: "#94a3b8",

  ButtonPricing: "#6366f1",
  ButtonPricingText: "#ffffff",
  ButtonPricingSecondary: "#1e293b",
  ButtonPricingSecondaryText: "#f8fafc",

  ButtonOverlay: "#ffffff",
  ButtonOverlayText: "#4f46e5",
  ButtonOverlaySecondary: "transparent",
  ButtonOverlaySecondaryText: "#ffffff",

  // Footer
  FooterText: "#94a3b8",
  FooterHeading: "#f8fafc",

  // Borders & Dividers
  Border: "#475569",
  DividerColor: "#334155",
  TableDivider: "rgba(255, 255, 255, 0.08)",
  Bordererror: "#ef4444",

  BackgroundGradientOne: "rgba(79, 70, 229, 0.15)",
  BackgroundGradientTwo: "rgba(124, 58, 237, 0.12)",

  // Icons
  RatingIconColor: "#fbbf24",
  AuthIconColor: "#94a3b8",
  IconColor: "#94a3b8",

  // Interactive & Feedback
  UISelectionCardBackground: "rgba(99, 102, 241, 0.12)",
  WarningText: "#f59e0b",
  WarningBackground: "rgba(245, 158, 11, 0.10)",
  WarningBorder: "rgba(245, 158, 11, 0.25)",
  LogoutButtonBackground: "rgba(239, 68, 68, 0.08)",

  // Wavy Accents (Indigo / Purple / Blue)
  WavyIndigo: "#818cf8",
  WavyPurple: "#c084fc",
  WavyBlue: "#60a5fa",
  WavyEmerald: "#34d399",
  WavyFuchsia: "#e879f9",
  WavyWhite: "rgba(255, 255, 255, 0.65)",

  BrandIndigo: "#6366f1",
  BrandIndigoHover: "#4f46e5",
  BrandEmerald: "#10b981",
  BrandEmeraldHover: "#059669",
  BrandBlue: "#3b82f6",
  BrandBlueHover: "#2563eb",
  BrandFuchsia: "#c026d3",
  BrandFuchsiaHover: "#a21caf",

  // Glassmorphism
  GlassBg: "rgba(15, 23, 42, 0.75)",
  GlassBorder: "rgba(255, 255, 255, 0.08)",
  GlassBorderSecondary: "rgba(255, 255, 255, 0.04)",

  // HTTP Methods
  MethodGetBg: "rgba(16, 185, 129, 0.12)",
  MethodGetText: "#34d399",
  MethodGetBorder: "rgba(16, 185, 129, 0.28)",

  MethodPostBg: "rgba(99, 102, 241, 0.15)",
  MethodPostText: "#818cf8",
  MethodPostBorder: "rgba(99, 102, 241, 0.35)",

  MethodPutBg: "rgba(245, 158, 11, 0.12)",
  MethodPutText: "#fbbf24",
  MethodPutBorder: "rgba(245, 158, 11, 0.28)",

  MethodPatchBg: "rgba(6, 182, 212, 0.12)",
  MethodPatchText: "#22d3ee",
  MethodPatchBorder: "rgba(6, 182, 212, 0.28)",

  MethodDeleteBg: "rgba(239, 68, 68, 0.12)",
  MethodDeleteText: "#f87171",
  MethodDeleteBorder: "rgba(239, 68, 68, 0.28)",

  // Badges & Actions
  DynamicBadgeBg: "rgba(99, 102, 241, 0.12)",
  DynamicBadgeBorder: "rgba(99, 102, 241, 0.32)",
  DynamicBadgeText: "#818cf8",

  SuccessBadgeBg: "rgba(16, 185, 129, 0.12)",
  SuccessBadgeText: "#34d399",
  SuccessBadgeBorder: "rgba(16, 185, 129, 0.28)",

  ErrorBadgeBg: "rgba(239, 68, 68, 0.12)",
  ErrorBadgeText: "#f87171",
  ErrorBadgeBorder: "rgba(239, 68, 68, 0.28)",

  DeleteAPIButtonBg: "rgba(239, 68, 68, 0.12)",
  DeleteAPIButtonBorder: "rgba(239, 68, 68, 0.28)",
  DeleteAPIButtonText: "#f87171",
  DeleteAPIButtonBgHover: "#dc2626",
  DeleteAPIButtonBorderHover: "rgba(239, 68, 68, 0.50)",
  DeleteAPIButtonTextHover: "#ffffff",

  QueryParamsButtonIcon: "#818cf8",
  QueryParamsButtonBg: "rgba(99, 102, 241, 0.12)",
  QueryParamsButtonText: "#818cf8",
  QueryParamsButtonBorder: "rgba(99, 102, 241, 0.25)",
  QueryParamsButtonBgHover: "rgba(99, 102, 241, 0.20)",

  ToggleTableTextViewBg: "rgba(255, 255, 255, 0.05)",
  ToggleTableTextViewBorder: "rgba(255, 255, 255, 0.10)",

  TestApiBtnBg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  TestApiBtnText: "#ffffff",

  UploadSampleBtnBg: "rgba(99, 102, 241, 0.12)",
  UploadSampleBtnBorder: "rgba(99, 102, 241, 0.28)",
  UploadSampleBtnText: "#818cf8",

  SuccessBtnBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  ModalBackdrop: "rgba(0, 0, 0, 0.82)",

  // Widget Theme Tokens
  WidgetContainerBg: "#0b0f19",
  WidgetContainerBorder: "#475569",
  WidgetCardBg: "#1e293b",
  WidgetCardBorder: "#334155",
  WidgetCardHover: "#334155",
  WidgetHeaderTitle: "#f8fafc",
  WidgetHeaderSubtitle: "#94a3b8",
  WidgetMetricVal: "#818cf8",
  WidgetMetricLabel: "#94a3b8",
  WidgetBadgeBg: "rgba(99, 102, 241, 0.15)",
  WidgetBadgeText: "#a5b4fc",
  WidgetBadgeBorder: "rgba(99, 102, 241, 0.30)",
  WidgetChartPrimary: "#6366f1",
  WidgetChartSecondary: "#8b5cf6",
  WidgetChartGrid: "rgba(255, 255, 255, 0.08)",

  // Swatches
  SwatchIndigo: "#6366f1",
  SwatchEmerald: "#10b981",
  SwatchCrimson: "#ef4444",
  SwatchOcean: "#3b82f6",
  SwatchViolet: "#a855f7",
  SwatchAmber: "#f59e0b",
  SwatchSlate: "#475569",
};

// ==========================================
// LIGHT THEME (Surface: #ffffff | Card: #eff5fc | On-Top: #e2e8f0)
// ==========================================
export const lightColors: ThemeColors = {
  // Surface & Structural
  Background: "#ffffff",
  BackgroundSecondary: "#f8fafc",
  SurfaceElevated: "#e2e8f0",
  OverlayShadow: "rgba(15, 23, 42, 0.08)",

  Headerbackground: "#ffffff",
  HeaderBoxShadow: "rgba(15, 23, 42, 0.05)",
  HeaderBottomBorder: "#e2e8f0",
  HeaderItemColor: "#64748b",
  HeaderItemHoverColor: "#4f46e5",
  HeaderItemActiveColor: "#4f46e5",
  HeaderIconColor: "#64748b",

  // Cards
  Card: "#eff5fc",
  CardSecondary: "#e2e8f0",
  CardBorder: "#e2e8f0",
  CardBorderSecondary: "#cbd5e1",
  CardActiveBorder: "#4f46e5",

  // Typography
  TextPrimary: "#0f172a",
  TextSecondary: "#64748b",
  TextOverlay: "#ffffff",
  TextHeading: "#0f172a",
  TextBody: "#475569",
  TextGradientOne: "#4f46e5",
  TextGradientTwo: "#7c3aed",
  TextGradientThree: "#2563eb",
  TextHighlightedHeading: "#4f46e5",

  // 3-Tier Buttons
  // 1. Primary: Indigo-to-Purple brand gradient
  ButtonPrimaryBg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  ButtonPrimaryText: "#ffffff",
  ButtonPrimaryHover: "#4338ca",
  ButtonGradientOne: "#4f46e5",
  ButtonGradientTwo: "#7c3aed",

  // 2. Secondary: Light card surface with slate-200 border
  ButtonSecondaryBg: "#eff5fc",
  ButtonSecondaryText: "#0f172a",
  ButtonSecondaryBorder: "#e2e8f0",
  ButtonSecondaryHover: "#e2e8f0",
  ButtonSecondary: "#eff5fc",

  // 3. Tertiary: Transparent ghost with smooth hover
  ButtonTertiaryBg: "transparent",
  ButtonTertiaryText: "#64748b",
  ButtonTertiaryHover: "rgba(15, 23, 42, 0.05)",

  // Legacy Button Aliases
  HeaderButtonGradientOne: "#4f46e5",
  HeaderButtonGradientTwo: "#7c3aed",
  HeaderButtonGradientText: "#ffffff",
  HeaderButtonSecondary: "transparent",
  HeaderButtonSecondaryText: "#475569",

  ButtonPricing: "#4f46e5",
  ButtonPricingText: "#ffffff",
  ButtonPricingSecondary: "#eff5fc",
  ButtonPricingSecondaryText: "#0f172a",

  ButtonOverlay: "#ffffff",
  ButtonOverlayText: "#4f46e5",
  ButtonOverlaySecondary: "transparent",
  ButtonOverlaySecondaryText: "#ffffff",

  // Footer
  FooterText: "#64748b",
  FooterHeading: "#0f172a",

  // Borders & Dividers
  Border: "#e2e8f0",
  DividerColor: "#e2e8f0",
  TableDivider: "#e2e8f0",
  Bordererror: "#dc2626",

  BackgroundGradientOne: "#e0e7ff",
  BackgroundGradientTwo: "#ede9fe",

  // Icons
  RatingIconColor: "#d97706",
  AuthIconColor: "#64748b",
  IconColor: "#64748b",

  // Interactive & Feedback
  UISelectionCardBackground: "rgba(79, 70, 229, 0.08)",
  WarningText: "#b45309",
  WarningBackground: "rgba(245, 158, 11, 0.08)",
  WarningBorder: "rgba(180, 83, 9, 0.20)",
  LogoutButtonBackground: "rgba(220, 38, 38, 0.06)",

  // Wavy Accents (Indigo / Purple / Blue)
  WavyIndigo: "#4f46e5",
  WavyPurple: "#7c3aed",
  WavyBlue: "#2563eb",
  WavyEmerald: "#059669",
  WavyFuchsia: "#c026d3",
  WavyWhite: "rgba(15, 23, 42, 0.55)",

  BrandIndigo: "#4f46e5",
  BrandIndigoHover: "#4338ca",
  BrandEmerald: "#059669",
  BrandEmeraldHover: "#047857",
  BrandBlue: "#2563eb",
  BrandBlueHover: "#1d4ed8",
  BrandFuchsia: "#c026d3",
  BrandFuchsiaHover: "#a21caf",

  // Glassmorphism
  GlassBg: "rgba(255, 255, 255, 0.85)",
  GlassBorder: "#e2e8f0",
  GlassBorderSecondary: "#f1f5f9",

  // HTTP Methods
  MethodGetBg: "rgba(16, 185, 129, 0.10)",
  MethodGetText: "#059669",
  MethodGetBorder: "rgba(16, 185, 129, 0.25)",

  MethodPostBg: "rgba(99, 102, 241, 0.12)",
  MethodPostText: "#4f46e5",
  MethodPostBorder: "rgba(99, 102, 241, 0.28)",

  MethodPutBg: "rgba(217, 119, 6, 0.10)",
  MethodPutText: "#b45309",
  MethodPutBorder: "rgba(217, 119, 6, 0.22)",

  MethodPatchBg: "rgba(13, 148, 136, 0.10)",
  MethodPatchText: "#0f766e",
  MethodPatchBorder: "rgba(13, 148, 136, 0.22)",

  MethodDeleteBg: "rgba(220, 38, 38, 0.09)",
  MethodDeleteText: "#dc2626",
  MethodDeleteBorder: "rgba(220, 38, 38, 0.22)",

  // Badges & Actions
  DynamicBadgeBg: "rgba(79, 70, 229, 0.09)",
  DynamicBadgeBorder: "rgba(79, 70, 229, 0.25)",
  DynamicBadgeText: "#4f46e5",

  SuccessBadgeBg: "rgba(16, 185, 129, 0.10)",
  SuccessBadgeText: "#059669",
  SuccessBadgeBorder: "rgba(16, 185, 129, 0.24)",

  ErrorBadgeBg: "rgba(220, 38, 38, 0.09)",
  ErrorBadgeText: "#dc2626",
  ErrorBadgeBorder: "rgba(220, 38, 38, 0.22)",

  DeleteAPIButtonBg: "rgba(220, 38, 38, 0.08)",
  DeleteAPIButtonBorder: "rgba(220, 38, 38, 0.22)",
  DeleteAPIButtonText: "#dc2626",
  DeleteAPIButtonBgHover: "#dc2626",
  DeleteAPIButtonBorderHover: "rgba(220, 38, 38, 0.40)",
  DeleteAPIButtonTextHover: "#ffffff",

  QueryParamsButtonIcon: "#4f46e5",
  QueryParamsButtonBg: "rgba(79, 70, 229, 0.08)",
  QueryParamsButtonText: "#4f46e5",
  QueryParamsButtonBorder: "rgba(79, 70, 229, 0.20)",
  QueryParamsButtonBgHover: "rgba(79, 70, 229, 0.14)",

  ToggleTableTextViewBg: "#f1f5f9",
  ToggleTableTextViewBorder: "#e2e8f0",

  TestApiBtnBg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  TestApiBtnText: "#ffffff",

  UploadSampleBtnBg: "rgba(79, 70, 229, 0.08)",
  UploadSampleBtnBorder: "rgba(79, 70, 229, 0.22)",
  UploadSampleBtnText: "#4f46e5",

  SuccessBtnBg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  ModalBackdrop: "rgba(15, 23, 42, 0.60)",

  // Widget Theme Tokens
  WidgetContainerBg: "#ffffff",
  WidgetContainerBorder: "#e2e8f0",
  WidgetCardBg: "#eff5fc",
  WidgetCardBorder: "#e2e8f0",
  WidgetCardHover: "#e2e8f0",
  WidgetHeaderTitle: "#0f172a",
  WidgetHeaderSubtitle: "#64748b",
  WidgetMetricVal: "#4f46e5",
  WidgetMetricLabel: "#64748b",
  WidgetBadgeBg: "rgba(79, 70, 229, 0.10)",
  WidgetBadgeText: "#4f46e5",
  WidgetBadgeBorder: "rgba(79, 70, 229, 0.22)",
  WidgetChartPrimary: "#4f46e5",
  WidgetChartSecondary: "#7c3aed",
  WidgetChartGrid: "rgba(15, 23, 42, 0.08)",

  // Swatches
  SwatchIndigo: "#6366f1",
  SwatchEmerald: "#10b981",
  SwatchCrimson: "#ef4444",
  SwatchOcean: "#3b82f6",
  SwatchViolet: "#a855f7",
  SwatchAmber: "#f59e0b",
  SwatchSlate: "#475569",
};
