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
    root.style.setProperty("--app-header-bg", colors.Headerbackground);
    root.style.setProperty("--app-bg", colors.Background);
    root.style.setProperty("--app-surface", colors.Card);
    root.style.setProperty("--app-border", colors.Border);
    root.style.setProperty("--app-text-primary", colors.TextPrimary);
    root.style.setProperty("--app-text-secondary", colors.TextSecondary);
    root.style.setProperty("--app-text-red", colors.TextRed);
    root.style.setProperty("--app-text-overlay", colors.TextOverlay);
    root.style.setProperty("--app-text-overlaylight", colors.TextOverlayLight);
    root.style.setProperty("--app-accent", colors.ButtonPrimary);
    root.style.setProperty("--app-accent-hover", colors.ButtonHover);
    root.style.setProperty("--app-button-secondary", colors.ButtonSecondary);
    root.style.setProperty("--app-button-darktext", colors.ButtonDarktext);
    root.style.setProperty("--app-box-shadow", colors.BoxShadow);
    root.style.setProperty("--app-rating-icon", colors.RatingIconColor);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [colors, isDark]);
};
