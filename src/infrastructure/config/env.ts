const rawMode = (import.meta.env.VITE_AUTH_API_MODE as string | undefined) ?? "real";

export const env = {
  appName: "SoftTech AI",
  authApiMode: rawMode === "localhost" ? "localhost" : "real",
} as const;
