import React, { useEffect } from "react";
import { useCartStore, parseNumericPrice } from "../../../../infrastructure/store/cartStore";
import { renderImage } from "../../helper/RenderImage";
import { renderCurrency } from "../../helper/RenderCurrency";
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
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);

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

  let checkoutUrl = "";
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
      checkoutUrl = parsed.toString();
    } catch {
      checkoutUrl = `${externalBase}/checkout`;
    }
  } else {
    const firstItem = items[0];
    const checkoutParams = new URLSearchParams({
      title:
        items.length === 1
          ? firstItem?.title || "Item"
          : `${items.length} Cart Items`,
      price: subtotal.toFixed(2),
      qty: String(totalCount),
      image: firstItem?.image || "",
    });
    checkoutUrl = `https://softtech-ai-app.onrender.com/checkout?${checkoutParams.toString()}`;
  }

  const handleCheckout = () => {
    setIsCheckingOut(true);
    try {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } catch {
      // In case popup is blocked
    }
    setCheckoutSuccess(true);
    setIsCheckingOut(false);
  };

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
                Checkout Ready!
              </h4>
              <p className={styles.emptyText}>
                Your order for {totalCount} items ({renderCurrency(subtotal)}) is ready. Complete your purchase on the merchant page.
              </p>
              <button
                type="button"
                className={styles.checkoutBtn}
                style={{ marginTop: "16px", width: "auto", padding: "8px 24px" }}
                onClick={() => {
                  clearCart();
                  setCheckoutSuccess(false);
                  closeCart();
                }}
              >
                Continue Shopping
              </button>
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
        {items.length > 0 && (
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
