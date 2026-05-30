export interface AnalyticsPort {
  getAnalytics: () => Promise<{ visits: number; conversions: number }>;
}
