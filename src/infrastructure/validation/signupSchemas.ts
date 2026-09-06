import { z } from "zod";

export const stepOneSchema = z.object({
  companyName: z.string().min(2, "Company Name must be at least 2 characters"),
  adminEmail: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mcpSlug: z
    .string()
    .min(2, "Subdomain must be at least 2 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Only letters, numbers, and hyphens"),
  primaryIndustry: z.string().min(1, "Please select an industry"),
});

export const authStrategySchema = z
  .object({
    strategyType: z.enum([
      "none",
      "api_key",
      "bearer",
      "oauth2",
      "custom_header",
    ]),
    apiKey: z.string().optional(),
    authHeader: z.string().optional(),
    bearerToken: z.string().optional(),
    authorizationServer: z.string().optional(),
    authorizationEndpoint: z.string().optional(),
    tokenEndpoint: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    globalStreamUrl: z.string().optional(),
    hasGlobalCheckout: z.boolean().optional(),
    globalCheckoutUrl: z.string().optional(),
    hasProductPages: z.boolean().optional(),
    shopCatalogUrl: z.string().optional(),
    productItemUrlTemplate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.strategyType === "api_key") {
      if (!data.authHeader?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Header / Parameter Name is required for API Key authentication.",
          path: ["authHeader"],
        });
      }
      if (!data.apiKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "API Key Value is required.",
          path: ["apiKey"],
        });
      }
    }
    if (data.strategyType === "custom_header") {
      if (!data.authHeader?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom Header Name is required.",
          path: ["authHeader"],
        });
      }
      if (!data.apiKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Header Value is required.",
          path: ["apiKey"],
        });
      }
    }
    if (data.strategyType === "oauth2") {
      if (!data.authorizationServer?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Authorization Server URL is required for User OAuth 2.0.",
          path: ["authorizationServer"],
        });
      }
      if (!data.clientId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "OAuth Client ID is required for User OAuth 2.0.",
          path: ["clientId"],
        });
      }
      if (!data.authorizationEndpoint?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Authorization / Login URL is required for User OAuth 2.0.",
          path: ["authorizationEndpoint"],
        });
      }
      if (!data.tokenEndpoint?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Token Endpoint URL is required for User OAuth 2.0.",
          path: ["tokenEndpoint"],
        });
      }
    }
  });

export const stepTwoSchema = z.array(
  z.object({
    apiName: z.string().min(1, "API Name is required"),
    apiMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    apiEndpoint: z.string().refine(
      (val) => {
        try {
          const url = new URL(val);
          return url.protocol === "https:" && url.hostname.length > 0;
        } catch {
          return false;
        }
      },
      { message: "Invalid URL (must start with https:// and have a domain)" },
    ),
    apiAuthType: z.string().optional(),
    apiCredentials: z.string().optional(),
    apiQueryParams: z.string().optional(),
    apiCheckoutTemplate: z.string().optional(),
    apiAuthHeader: z.string().optional(),
    oauthTokenUrl: z.string().optional(),
    oauthClientId: z.string().optional(),
    apiHeaders: z.string().optional(),
  }),
);

export const stepThreeSchema = z.object({
  layout: z.enum([
    "dashboard",
    "catalog",
    "table",
    "timeline",
    "grid",
    "list",
    "cards",
  ]),
});
