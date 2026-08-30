import React, { useEffect } from "react";
import { useCartStore, parseNumericPrice } from "../../../../infrastructure/store/cartStore";
import { renderImage } from "../../helper/RenderImage";
import { renderCurrency } from "../../helper/RenderCurrency";
import {
  appendChatUrlToCheckout,
  markCheckoutPending,
  clearCheckoutPending,
  monitorCheckoutWindow,
} from "../../../../utils/checkoutHelper";
import styles from "../../../../styles/cartdrawer.module.css";

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalCount,
    setViewFullCart,
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);
  const [pendingCheckout, setPendingCheckout] = React.useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  const totalCount = getTotalCount();
  const subtotal = getSubtotal();

  const metadata = (window as any).__WIDGET_METADATA__ || {};
  const externalBase =
    metadata.webCheckoutUrl ||
    metadata.websiteURL ||
    metadata.website ||
    metadata.domain ||
    "";

  let rawCheckoutUrl = "";
  if (
    externalBase &&
    typeof externalBase === "string" &&
    externalBase.startsWith("http")
  ) {
    try {
      const parsed = new URL(externalBase);
      parsed.pathname = parsed.pathname.replace(/\/$/, "") + "/checkout";
      parsed.searchParams.set("qty", String(totalCount));
      parsed.searchParams.set("total", subtotal.toFixed(2));
      rawCheckoutUrl = parsed.toString();
    } catch {
      rawCheckoutUrl = `${externalBase}/checkout`;
    }
  } else if (items.length > 1) {
    const itemsJson = JSON.stringify(
      items.map((item) => ({
        name: item.title,
        price: parseNumericPrice(item.price),
        qty: item.quantity,
        image: item.image || "",
      })),
    );
    const checkoutParams = new URLSearchParams({
      items: itemsJson,
      total: subtotal.toFixed(2),
    });
    rawCheckoutUrl = `https://softtech-ai-app.onrender.com/checkout?${checkoutParams.toString()}`;
  } else {
    const firstItem = items[0];
    const checkoutParams = new URLSearchParams({
      title: firstItem?.title || "Item",
      price: subtotal.toFixed(2),
      qty: String(totalCount),
      image: firstItem?.image || "",
    });
    rawCheckoutUrl = `https://softtech-ai-app.onrender.com/checkout?${checkoutParams.toString()}`;
  }

  const checkoutUrl = appendChatUrlToCheckout(rawCheckoutUrl);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    markCheckoutPending();
    setPendingCheckout(true);

    let checkoutWindow: Window | null = null;
    try {
      checkoutWindow = window.open(checkoutUrl, "_blank");
    } catch {
      // Popup blocked
    }

    // Monitor the checkout window for closure
    const cleanup = monitorCheckoutWindow(checkoutWindow, {
      onSuccess: () => {
        // Checkout page sent success postMessage
        console.log("[CartDrawer] Checkout completed (postMessage success)");
        clearCart();
        setPendingCheckout(false);
        setCheckoutSuccess(true);
      },
      onClosed: () => {
        // Checkout window was closed or navigated away
        console.log("[CartDrawer] Checkout window closed");
        clearCart();
        setPendingCheckout(false);
        setCheckoutSuccess(true);
      },
    });

    // Store cleanup for later
    (window as any).__checkoutCleanup = cleanup;
    setIsCheckingOut(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cleanup = (window as any).__checkoutCleanup;
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
        onClick={closeCart}
      />
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        aria-label="Shopping Cart Drawer"
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span style={{ fontSize: "20px" }}>🛒</span>
            <h3 className={styles.headerTitle}>Your Cart</h3>
            {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={closeCart}
            aria-label="Close Cart"
          >
            ✕
          </button>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {checkoutSuccess ? (
            <div className={styles.emptyContainer} style={{ padding: "32px 16px" }}>
              <div className={styles.emptyIcon} style={{ fontSize: "40px" }}>🎉</div>
              <h4 className={styles.emptyTitle} style={{ color: "#10b981", fontSize: "18px" }}>
                Order Confirmed!
              </h4>
              <p className={styles.emptyText}>
                Your purchase was successful. Your cart has been cleared.
              </p>
              <button
                type="button"
                className={styles.checkoutBtn}
                style={{ marginTop: "16px", width: "auto", padding: "8px 24px" }}
                onClick={() => {
                  setCheckoutSuccess(false);
                  closeCart();
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : pendingCheckout ? (
            <div className={styles.emptyContainer} style={{ padding: "32px 16px" }}>
              <div className={styles.emptyIcon} style={{ fontSize: "40px" }}>⏳</div>
              <h4 className={styles.emptyTitle} style={{ color: "#f59e0b", fontSize: "16px" }}>
                Waiting for Checkout...
              </h4>
              <p className={styles.emptyText}>
                Complete your purchase in the checkout tab. This drawer will update automatically when you return.
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  style={{ flex: 1, padding: "8px 16px" }}
                  onClick={() => {
                    window.open(checkoutUrl, "_blank");
                  }}
                >
                  Reopen Checkout
                </button>
                <button
                  type="button"
                  className={styles.clearCartBtn}
                  style={{ flex: 1 }}
                  onClick={() => {
                    clearCheckoutPending();
                    setPendingCheckout(false);
                    clearCart();
                    closeCart();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>🛍️</div>
              <h4 className={styles.emptyTitle}>Your cart is empty</h4>
              <p className={styles.emptyText}>
                Add items to your cart from the catalog or detail view to get started.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const unitPrice = parseNumericPrice(item.price);
              const lineTotal = unitPrice * (item.quantity || 1);

              return (
                <div key={`${item.id}-${item.tier || "base"}`} className={styles.cartItem}>
                  {item.image && (
                    <div className={styles.itemImage}>
                      {renderImage(item.image, item.title, "cover")}
                    </div>
                  )}

                  <div className={styles.itemDetails}>
                    <span className={styles.itemTitle} title={item.title}>
                      {item.title}
                    </span>
                    {item.tier && <span className={styles.itemTier}>{item.tier}</span>}
                    <span className={styles.itemPrice}>
                      {renderCurrency(unitPrice)}
                    </span>
                  </div>

                  <div className={styles.itemActions}>
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.stepperQty}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--app-text-primary)" }}>
                        {renderCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && !pendingCheckout && !checkoutSuccess && (
          <footer className={styles.footer}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal</span>
              <span className={styles.summaryValue}>{renderCurrency(subtotal)}</span>
            </div>

            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={handleCheckout}
            >
              <span>💳 Proceed to Checkout</span>
            </button>

            <button
              type="button"
              className={styles.clearCartBtn}
              style={{ background: "var(--widget-cta-bg, rgba(99,102,241,0.15))", color: "var(--widget-cta-text, #818cf8)" }}
              onClick={() => {
                setViewFullCart(true);
                closeCart();
              }}
            >
              📋 View Full Cart
            </button>

            <button
              type="button"
              className={styles.clearCartBtn}
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </footer>
        )}
      </aside>
    </>
  );
};
