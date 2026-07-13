import { create } from "zustand";

interface HomeStore {
  isYearly: boolean;
  isMobileMenuOpen: boolean;
  activeFaqIndex: number | null;
  showScrollToTop: boolean;
  toggleBillingCycle: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleFaq: (index: number) => void;
  setScrollToTop: (show: boolean) => void;
  scrollToTop: () => void;
}

export const useHomeStore = create<HomeStore>((set) => ({
  isYearly: false,
  isMobileMenuOpen: false,
  activeFaqIndex: null,
  showScrollToTop: false,
  toggleBillingCycle: () => set((state) => ({ isYearly: !state.isYearly })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleFaq: (index) => set((state) => ({ activeFaqIndex: state.activeFaqIndex === index ? null : index })),
  setScrollToTop: (show) => set({ showScrollToTop: show }),
  scrollToTop: () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  },
}));
