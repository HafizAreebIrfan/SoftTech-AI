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
    metadata.globalCheckoutUrl ||
    metadata.checkoutUrl ||
    metadata.websiteURL ||
    metadata.website ||
    metadata.domain ||
    "";

  // Check item-specific checkout URL first
  const itemWithCheckout = items.find((i) => i.checkoutUrl);
  let rawCheckoutUrl = itemWithCheckout?.checkoutUrl || "";

  if (!rawCheckoutUrl && externalBase && typeof externalBase === "string") {
    const safeBase = externalBase.startsWith("http")
      ? externalBase
      : `https://${externalBase}`;
    try {
      const parsed = new URL(safeBase);
      if (!parsed.pathname.includes("checkout")) {
        parsed.pathname = parsed.pathname.replace(/\/$/, "") + "/checkout";
      }
      parsed.searchParams.set("qty", String(totalCount));
      parsed.searchParams.set("total", subtotal.toFixed(2));
      rawCheckoutUrl = parsed.toString();
    } catch {
      rawCheckoutUrl = `${safeBase}/checkout`;
    }
  }

  // Fallback to company product URL if available
  if (!rawCheckoutUrl) {
    const itemWithUrl = items.find((i) => i.productUrl);
    if (itemWithUrl?.productUrl) {
      rawCheckoutUrl = itemWithUrl.productUrl;
    }
  }

  const checkoutUrl = rawCheckoutUrl ? appendChatUrlToCheckout(rawCheckoutUrl) : "";

  const handleCheckout = () => {
    if (!checkoutUrl) {
      alert("Checkout URL is not configured for this company.");
      return;
    }

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
            <span className={styles.headerIcon}>🛒</span>
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
            <div className={`${styles.emptyContainer} ${styles.emptyContainerPadding}`}>
              <div className={`${styles.emptyIcon} ${styles.emptyIconLg}`}>🎉</div>
              <h4 className={`${styles.emptyTitle} ${styles.emptyTitleSuccess}`}>
                Order Confirmed!
              </h4>
              <p className={styles.emptyText}>
                Your purchase was successful. Your cart has been cleared.
              </p>
              <button
                type="button"
                className={`${styles.checkoutBtn} ${styles.continueShoppingBtn}`}
                onClick={() => {
                  setCheckoutSuccess(false);
                  closeCart();
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : pendingCheckout ? (
            <div className={`${styles.emptyContainer} ${styles.emptyContainerPadding}`}>
              <div className={`${styles.emptyIcon} ${styles.emptyIconLg}`}>⏳</div>
              <h4 className={`${styles.emptyTitle} ${styles.emptyTitleWarning}`}>
                Waiting for Checkout...
              </h4>
              <p className={styles.emptyText}>
                Complete your purchase in the checkout tab. This drawer will update automatically when you return.
              </p>
              <div className={styles.pendingBtnRow}>
                <button
                  type="button"
                  className={`${styles.checkoutBtn} ${styles.reopenBtn}`}
                  onClick={() => {
                    window.open(checkoutUrl, "_blank");
                  }}
                >
                  Reopen Checkout
                </button>
                <button
                  type="button"
                  className={`${styles.clearCartBtn} ${styles.flexBtn}`}
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

                    <div className={styles.itemPriceRow}>
                      <span className={styles.itemPriceVal}>
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
              className={styles.viewFullCartBtn}
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
