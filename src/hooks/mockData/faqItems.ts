import { FAQItem } from "../../types/home";

export const faqItems: FAQItem[] = [
  {
    question: "How does the automatic MCP mapping work?",
    answer:
      "SoftTech AI parses your Swagger/OpenAPI documentation path dynamically and auto-generates Model Context Protocol specs. ChatGPT reads these schemas to understand exactly how to trigger requests, format parameters, and ingest JSON payloads from your endpoints.",
  },
  {
    question: "Is my API credential storage secure?",
    answer:
      "Yes. We utilize a secure zero-trust vault. All API keys, Client Secrets, and refresh tokens are encrypted using AES-256-GCM. Decryption occurs strictly at the edge in memory for token signing and propagation, ensuring no persistent exposure.",
  },
  {
    question: "Do you support custom authentication configurations?",
    answer:
      "Absolutely. We have pre-built integrations for OAuth 2.0 flow, JWT Bearer propagation, API Key custom headers, and dynamic session token caching. Custom variables can also be mapped directly through our schema editor.",
  },
  {
    question: "What is the latency overlay on requests?",
    answer:
      "SoftTech AI utilizes edge nodes globally via Cloudflare & Fly.io. This keeps request serialization and mapping to sub-5ms overhead. The primary component of your response latency remains the raw roundtrip speed of your target REST API.",
  },
];
