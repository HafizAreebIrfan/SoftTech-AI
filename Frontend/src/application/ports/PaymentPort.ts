export interface PaymentPort {
  createCheckout: () => Promise<{ checkoutUrl: string }>;
}
