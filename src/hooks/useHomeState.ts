import { useHomeStore } from "../infrastructure/store/homeStore";
import { useEffect } from "react";

export const useHomeState = () => {
  const isYearly = useHomeStore((state) => state.isYearly);
  const isMobileMenuOpen = useHomeStore((state) => state.isMobileMenuOpen);
  const activeFaqIndex = useHomeStore((state) => state.activeFaqIndex);
  const showScrollToTop = useHomeStore((state) => state.showScrollToTop);

  const toggleBillingCycle = useHomeStore((state) => state.toggleBillingCycle);
  const toggleMobileMenu = useHomeStore((state) => state.toggleMobileMenu);
  const closeMobileMenu = useHomeStore((state) => state.closeMobileMenu);
  const toggleFaq = useHomeStore((state) => state.toggleFaq);
  const setScrollToTop = useHomeStore((state) => state.setScrollToTop);
  const scrollToTop = useHomeStore((state) => state.scrollToTop);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const shouldShow = window.scrollY > 400;
      if (showScrollToTop !== shouldShow) {
        setScrollToTop(shouldShow);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showScrollToTop, setScrollToTop]);

  return {
    isYearly,
    isMobileMenuOpen,
    activeFaqIndex,
    showScrollToTop,
    toggleBillingCycle,
    toggleMobileMenu,
    closeMobileMenu,
    toggleFaq,
    scrollToTop,
  };
};
