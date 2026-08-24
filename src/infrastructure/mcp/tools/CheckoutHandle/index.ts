import { FormatCheckoutOptions } from "../../../../domain/interface/checkoutinterface";

export function formatCheckoutToolResult({
  response,
  config,
  platformType = "web",
}: FormatCheckoutOptions) {
  if (!config.isCheckout || !response) {
    return response;
  }

  // 1. Resolve base URL by platform
  const baseUrl =
    platformType === "mobile" && config.mobileDeepLinkUrl
      ? config.mobileDeepLinkUrl
      : config.webCheckoutUrl ||
        "https://softtech-ai-app.onrender.com/checkout";

  // 2. Extract metrics from cart response
  const cartId = response.id || response.cartId;
  const total = response.total;
  const discountedTotal = response.discountedTotal || total;
  const primaryProduct = Array.isArray(response.products)
    ? response.products[0]
    : null;
  const title = primaryProduct?.title || response.title || "Cart Items";
  const quantity = primaryProduct?.quantity || response.quantity || 1;

  // 3. Build parameterized URL
  let finalUrl = baseUrl;
  try {
    const checkoutUrl = new URL(baseUrl);
    if (cartId) checkoutUrl.searchParams.set("cartId", String(cartId));
    if (discountedTotal !== undefined)
      checkoutUrl.searchParams.set("total", String(discountedTotal));
    if (title) checkoutUrl.searchParams.set("title", String(title));
    if (quantity) checkoutUrl.searchParams.set("quantity", String(quantity));
    finalUrl = checkoutUrl.toString();
  } catch {
    finalUrl = baseUrl;
  }

  // 4. Return normalized response
  return {
    ...response,
    $title: `Ready for Checkout (Cart #${cartId})`,
    $price: discountedTotal,
    $status: "Pending Payment",
    url: finalUrl,
    link: finalUrl,
    actions: [
      {
        id: "proceed_checkout",
        label:
          platformType === "mobile"
            ? "Open App to Pay"
            : "Proceed to Web Checkout",
        type: "url",
        url: finalUrl,
      },
    ],
  };
}
