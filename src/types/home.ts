export interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isCustomPrice?: boolean;
  features: string[];
  unsupportedFeatures?: string[];
  ctaText: string;
  popular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface IndustryTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  bgImage: string;
  widgetName: string;
  widgetStatus: string;
  accentColor: "indigo" | "emerald" | "blue" | "fuchsia";
}

export interface HomeState {
  isYearly: boolean;
  isMobileMenuOpen: boolean;
  activeFaqIndex: number | null;
  showScrollToTop: boolean;
}
