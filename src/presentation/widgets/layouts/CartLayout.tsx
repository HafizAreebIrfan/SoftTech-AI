import React, { useMemo, useEffect } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { renderImage } from "../helper/RenderImage";
import { renderCurrency } from "../helper/RenderCurrency";
import { useCartStore, parseNumericPrice } from "../../../infrastructure/store/cartStore";
import { callMcpTool } from "../../../utils/mcpBridge";
import {
  appendChatUrlToCheckout,
  markCheckoutPending,
  clearCheckoutPending,
  monitorCheckoutWindow,
} from "../../../utils/checkoutHelper";
import styles from "../../../styles/cartlayout.module.css";

interface CartLineItem {
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage?: number;
  discountedTotal?: number;
  thumbnail?: string;
}

export const CartLayout: React.FC<WidgetLayoutProps> = ({
  title = "Shopping Cart",
  subtitle,
  data,
  records = [],
  actions = [],
}) => {
  const zustandItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const { lineItems, cartSummary } = useMemo(() => {
    const rawData = (data || {}) as Record<string, any>;
    let targetCart: Record<string, any> = {};

    if (Array.isArray(rawData.carts) && rawData.carts.length > 0) {
      targetCart = rawData.carts[0];
    } else if (rawData.products && Array.isArray(rawData.products)) {
      targetCart = rawData;
    } else if (records.length > 0 && typeof records[0] === "object") {
      targetCart = records[0] as Record<string, any>;
    }

    const rawProducts: any[] =
      targetCart.products ||
      (Array.isArray(rawData.products) ? rawData.products : []) ||
      [];

    let items: CartLineItem[] = [];

    if (rawProducts.length > 0) {
      items = rawProducts.map((p, idx) => ({
        id: p.id ?? idx,
        title: p.title || p.$title || `Product #${idx + 1}`,
        price: Number(p.price || p.$price || 0),
        quantity: Number(p.quantity || 1),
        total: Number(p.total || p.price * (p.quantity || 1) || 0),
        discountPercentage: p.discountPercentage,
        discountedTotal: p.discountedTotal,
        thumbnail: p.thumbnail || p.$image || p.image,
      }));
    } else if (zustandItems.length > 0) {
      items = zustandItems.map((zi) => {
        const priceNum = parseNumericPrice(zi.price);
        const qty = zi.quantity || 1;
        return {
          id: zi.id,
          title: zi.title,
          price: priceNum,
          quantity: qty,
          total: priceNum * qty,
          thumbnail: zi.image || undefined,
        };
      });
    }

    const totalAmount =
      Number(targetCart.total || rawData.total) ||
      items.reduce((acc, i) => acc + (i.total || i.price * i.quantity), 0);

    const discountedTotal =
      Number(targetCart.discountedTotal || rawData.discountedTotal) ||
      items.reduce(
        (acc, i) =>
          acc + (i.discountedTotal || i.total || i.price * i.quantity),
        0,
      );

    const totalQuantity =
      Number(targetCart.totalQuantity || rawData.totalQuantity) ||
      items.reduce((acc, i) => acc + i.quantity, 0);

    return {
      lineItems: items,
      cartSummary: {
        totalAmount,
        discountedTotal,
        totalQuantity,
        userId: targetCart.userId || rawData.userId,
        cartId: targetCart.id || rawData.id,
      },
    };
  }, [data, records, zustandItems]);

  const handleUpdateQty = async (id: string | number, newQty: number) => {
    if (newQty <= 0) {
      handleRemove(id);
      return;
    }
    updateQuantity(id, newQty);

    const updateTool = actions.find((a: any) =>
      /update.*cart|edit.*cart|cart.*quantity/i.test(a?.id || a?.tool || a?.label || ""),
    )?.tool;
    if (updateTool) {
      try {
        await callMcpTool(updateTool, { id, productId: id, quantity: newQty });
      } catch (err) {
        console.warn("[CartLayout] Update cart tool call:", err);
      }
    }
  };

  const handleRemove = async (id: string | number) => {
    removeItem(id);

    const deleteTool = actions.find((a: any) =>
      /delete.*cart|remove.*cart|cart.*delete/i.test(a?.id || a?.tool || a?.label || ""),
    )?.tool;
    if (deleteTool) {
      try {
        await callMcpTool(deleteTool, { id, productId: id });
      } catch (err) {
        console.warn("[CartLayout] Remove cart item tool call:", err);
      }
    }
  };

  const handleClear = async () => {
    clearCart();

    const clearTool = actions.find((a: any) =>
      /clear.*cart|empty.*cart/i.test(a?.id || a?.tool || a?.label || ""),
    )?.tool;
    if (clearTool) {
      try {
        await callMcpTool(clearTool, {});
      } catch (err) {
        console.warn("[CartLayout] Clear cart tool call:", err);
      }
    }
  };

  const [checkoutComplete, setCheckoutComplete] = React.useState(false);
  const [pendingCheckout, setPendingCheckout] = React.useState(false);

  const checkoutUrl = useMemo(() => {
    // 1. Direct url from data or actions
    const rawData = data as any;
    if (
      rawData?.url &&
      typeof rawData.url === "string" &&
      rawData.url.startsWith("http")
    ) {
      return rawData.url;
    }
    if (
      rawData?.link &&
      typeof rawData.link === "string" &&
      rawData.link.startsWith("http")
    ) {
      return rawData.link;
    }
    const checkoutAction: any = actions.find(
      (a: any) =>
        /checkout|buy|pay|purchase/i.test(a?.id || "") ||
        /checkout|buy|pay|purchase/i.test(a?.tool || ""),
    );
    if (checkoutAction?.url || checkoutAction?.href) {
      return checkoutAction.url || checkoutAction.href;
    }

    // 2. Company metadata domain / webCheckoutUrl
    const metadata = (window as any).__WIDGET_METADATA__ || {};
    const externalBase =
      metadata.webCheckoutUrl ||
      metadata.websiteURL ||
      metadata.website ||
      metadata.domain ||
      "";

    if (
      externalBase &&
      typeof externalBase === "string" &&
      externalBase.startsWith("http")
    ) {
      try {
        const parsed = new URL(externalBase);
        parsed.pathname = parsed.pathname.replace(/\/$/, "") + "/checkout";
        parsed.searchParams.set("qty", String(cartSummary.totalQuantity));
        parsed.searchParams.set(
          "total",
          (cartSummary.discountedTotal || cartSummary.totalAmount).toFixed(2),
        );
        return parsed.toString();
      } catch {
        return `${externalBase}/checkout`;
      }
    }

    // 3. Render fallback checkout URL
    if (lineItems.length > 1) {
      const itemsJson = JSON.stringify(
        lineItems.map((item) => ({
          name: item.title,
          price: item.discountedTotal || item.total || item.price,
          qty: item.quantity,
          image: item.thumbnail || "",
        })),
      );
      const checkoutParams = new URLSearchParams({
        items: itemsJson,
        total: (cartSummary.discountedTotal || cartSummary.totalAmount).toFixed(2),
      });
      return `https://softtech-ai-app.onrender.com/checkout?${checkoutParams.toString()}`;
    }
    const firstItem = lineItems[0];
    const checkoutParams = new URLSearchParams({
      title: firstItem?.title || "Item",
      price: (cartSummary.discountedTotal || cartSummary.totalAmount).toFixed(2),
      qty: String(cartSummary.totalQuantity),
      image: firstItem?.thumbnail || "",
    });
    return `https://softtech-ai-app.onrender.com/checkout?${checkoutParams.toString()}`;
  }, [data, actions, cartSummary, lineItems]);

  const finalCheckoutUrl = appendChatUrlToCheckout(checkoutUrl);

  const handleCheckout = () => {
    markCheckoutPending();
    setPendingCheckout(true);

    let checkoutWindow: Window | null = null;
    try {
      checkoutWindow = window.open(finalCheckoutUrl, "_blank");
    } catch {
      // Popup blocked
    }

    const cleanup = monitorCheckoutWindow(checkoutWindow, {
      onSuccess: () => {
        console.log("[CartLayout] Checkout completed (postMessage success)");
        setPendingCheckout(false);
        setCheckoutComplete(true);
      },
      onClosed: () => {
        console.log("[CartLayout] Checkout window closed");
        setPendingCheckout(false);
        setCheckoutComplete(true);
      },
    });

    (window as any).__checkoutCleanup = cleanup;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cleanup = (window as any).__checkoutCleanup;
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return (
    <section className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {title === "Get Cart" || !title ? "Shopping Cart" : title}
          </h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headerActions}>
          {cartSummary.totalQuantity > 0 && (
            <span className={styles.badge}>
              {cartSummary.totalQuantity} Item
              {cartSummary.totalQuantity === 1 ? "" : "s"}
            </span>
          )}
          {lineItems.length > 0 && (
            <button
              type="button"
              className={styles.clearCartBtn}
              onClick={handleClear}
              title="Clear all items from cart"
            >
              🗑️ Clear Cart
            </button>
          )}
        </div>
      </header>

      {/* Cart Content Grid */}
      <div className={styles.cartGrid}>
        {/* Left Column: Products List */}
        <div className={styles.itemsCard}>
          <h3 className={styles.sectionTitle}>
            Cart Items ({lineItems.length})
          </h3>

          <div className={styles.itemsList}>
            {lineItems.length === 0 ? (
              <p style={{ color: "var(--app-text-secondary)", margin: "20px 0" }}>
                No items found in this cart.
              </p>
            ) : (
              lineItems.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  {item.thumbnail && (
                    <div className={styles.itemImage}>
                      {renderImage(item.thumbnail, item.title, "cover")}
                    </div>
                  )}

                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <div className={styles.itemMeta}>
                      <span>{renderCurrency(item.price)} each</span>
                      {item.discountPercentage ? (
                        <span style={{ color: "#10b981", fontWeight: 600 }}>
                          -{item.discountPercentage}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className={styles.stepperQty}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.itemPriceGroup}>
                    <span className={styles.itemTotal}>
                      {renderCurrency(item.discountedTotal || item.total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleRemove(item.id)}
                    aria-label={`Remove ${item.title}`}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className={styles.summaryCard}>
          <h3 className={styles.sectionTitle}>Order Summary</h3>

          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Items Total ({cartSummary.totalQuantity})</span>
              <span>{renderCurrency(cartSummary.totalAmount)}</span>
            </div>

            {cartSummary.discountedTotal < cartSummary.totalAmount && (
              <div className={styles.summaryRow} style={{ color: "#10b981" }}>
                <span>Discounts Applied</span>
                <span>
                  -
                  {renderCurrency(
                    cartSummary.totalAmount - cartSummary.discountedTotal,
                  )}
                </span>
              </div>
            )}

            <div className={styles.summaryRowTotal}>
              <span>Total</span>
              <span className={styles.totalAmount}>
                {renderCurrency(
                  cartSummary.discountedTotal || cartSummary.totalAmount,
                )}
              </span>
            </div>
          </div>

          <a
            href={finalCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.checkoutButton}
            onClick={handleCheckout}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>💳 Proceed to Checkout</span>
          </a>
        </div>
      </div>
    </section>
  );
};
