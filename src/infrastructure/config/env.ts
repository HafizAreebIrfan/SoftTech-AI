export const env = {
  appName: 'SoftTech AI',
  companyHQ: 'SoftTech, Gulshan e Iqbal, Karachi, Pakistan ❤️',
  supportEmail: 'support@softtechai.io',
  supportPhone: '+92-332-3941018',
  devServer: 'http://localhost:4000',
  authApiMode: ((import.meta.env.VITE_AUTH_API_MODE as string | undefined) ?? "real") === "localhost" ? "localhost" : "real"
} as const;
