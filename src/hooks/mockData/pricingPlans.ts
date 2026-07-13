import { PricingPlan } from "../../types/home";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Ideal for hacking side projects and testing ideas.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["1 Developer Seat", "5,000 requests / month", "Basic UI Templates"],
    unsupportedFeatures: ["Custom Branding"],
    ctaText: "Get Started",
  },
  {
    name: "Pro",
    description: "Perfect for production apps ready to scale.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "5 Developer Seats",
      "100,000 requests / month",
      "Advanced Custom Widgets",
      "Custom CSS & Branding",
      "Priority Support",
    ],
    ctaText: "Upgrade Now",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Dedicated infrastructure, strict SLA, and custom integration setup.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    isCustomPrice: true,
    features: [
      "Unlimited Seats",
      "Dedicated Edge Server",
      "HIPAA & GDPR Compliance",
      "24/7 Phone SLA Support",
    ],
    ctaText: "Contact Sales",
  },
];
