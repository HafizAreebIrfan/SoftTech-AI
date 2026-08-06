import { z } from "zod";

export const stepOneSchema = z.object({
  companyName: z.string().min(2, "Company Name must be at least 2 characters"),
  adminEmail: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mcpSlug: z.string().min(2, "Subdomain must be at least 2 characters").regex(/^[a-zA-Z0-9-]+$/, "Only letters, numbers, and hyphens"),
  primaryIndustry: z.string().min(1, "Please select an industry")
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
      { message: "Invalid URL (must start with https:// and have a domain)" }
    ),
    apiAuthType: z.string(),
    apiCredentials: z.string().optional(),
    apiQueryParams: z.string().optional(),
    apiCheckoutTemplate: z.string().optional(),
    apiAuthHeader: z.string().optional(),
    oauthTokenUrl: z.string().optional(),
    oauthClientId: z.string().optional(),
    apiHeaders: z.string().optional(),
  })
).superRefine((apis, ctx) => {
  apis.forEach((api, idx) => {
    if (api.apiAuthType === "Bearer Token" && !api.apiCredentials?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Bearer Token is required for "${api.apiName}".`,
        path: [idx, "apiCredentials"],
      });
    }
    if (api.apiAuthType === "API Key") {
      if (!api.apiAuthHeader?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `API Key Header Name is required for "${api.apiName}".`,
          path: [idx, "apiAuthHeader"],
        });
      }
      if (!api.apiCredentials?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `API Key Value is required for "${api.apiName}".`,
          path: [idx, "apiCredentials"],
        });
      }
    }
    if (api.apiAuthType === "OAuth 2.0") {
      if (!api.oauthTokenUrl?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `OAuth 2.0 Token URL is required for "${api.apiName}".`,
          path: [idx, "oauthTokenUrl"],
        });
      } else {
        try {
          new URL(api.oauthTokenUrl);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid OAuth Token URL format for "${api.apiName}".`,
            path: [idx, "oauthTokenUrl"],
          });
        }
      }
      if (!api.oauthClientId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `OAuth 2.0 Client ID is required for "${api.apiName}".`,
          path: [idx, "oauthClientId"],
        });
      }
      if (!api.apiCredentials?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `OAuth 2.0 Client Secret is required for "${api.apiName}".`,
          path: [idx, "apiCredentials"],
        });
      }
    }
    if (api.apiHeaders && api.apiHeaders.trim()) {
      try {
        JSON.parse(api.apiHeaders);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid JSON structure in Custom Headers for "${api.apiName}".`,
          path: [idx, "apiHeaders"],
        });
      }
    }
    if (api.apiQueryParams && api.apiQueryParams.trim()) {
      try {
        JSON.parse(api.apiQueryParams);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid JSON structure in Query Parameters for "${api.apiName}".`,
          path: [idx, "apiQueryParams"],
        });
      }
    }
  });
});

export const stepThreeSchema = z.object({
  layout: z.enum(["dashboard", "catalog", "table", "timeline", "grid", "list", "cards"]),
});
