import { IndustryTemplate } from "../../types/home";

export const industryTemplates: IndustryTemplate[] = [
  {
    id: "ecommerce",
    category: "E-Commerce Integration",
    title: "Instant E-Commerce Checkout",
    description:
      "Deploy shopping assistance directly in ChatGPT. Let customers search catalog endpoints, add products to cart, and execute secure checkout in a unified conversational interface.",
    tags: ["REST API", "OAuth 2.0", "Stripe Link"],
    bgImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    widgetName: "order_checkout_widget",
    widgetStatus: "Secure Mode",
    accentColor: "indigo",
  },
  {
    id: "fintech",
    category: "Fintech & SaaS Ops",
    title: "Automated SaaS Dashboards",
    description:
      "Connect internal tool endpoints and allow users to query subscription states, fetch account usage, trigger invoices, and update settings in real-time.",
    tags: ["Charts", "Audited Logs", "Invoices"],
    bgImage: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
    widgetName: "invoice_query_widget",
    widgetStatus: "Active",
    accentColor: "emerald",
  },
  {
    id: "healthcare",
    category: "Healthcare & Scheduling",
    title: "Secure HIPAA Integrations",
    description:
      "Map patient records and appointment scheduling endpoints. Secure communication flows through zero-knowledge encryption pipelines that satisfy standard compliance audits.",
    tags: ["AES-256", "HIPAA Secure", "Scheduling"],
    bgImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    widgetName: "ehr_scheduler_widget",
    widgetStatus: "HIPAA Secure",
    accentColor: "blue",
  },
  {
    id: "travel",
    category: "Travel & Logistics",
    title: "Global Booking Engines",
    description:
      "Connect travel GDS systems and flight search databases. Translate complex flight routes, hotel options, and seat selections into interactive map widgets on the fly.",
    tags: ["GDS Systems", "Real-time mapping", "Cache Vault"],
    bgImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    widgetName: "gds_flight_routing_widget",
    widgetStatus: "Live Sync",
    accentColor: "fuchsia",
  },
];
