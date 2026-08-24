export interface CheckoutConfig {
  isCheckout: boolean;
  webCheckoutUrl?: string;
  mobileDeepLinkUrl?: string;
}

export interface FormatCheckoutOptions {
  response: any;
  config: CheckoutConfig;
  platformType?: "web" | "mobile" | "desktop";
}
