import React, { useState, useEffect, useMemo } from "react";
import styles from "./checkout.module.css";

interface LineItem {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  quantity: number;
}

const Checkout: React.FC = () => {
  const [items, setItems] = useState<LineItem[]>([]);
  const [sessionId, setSessionId] = useState<string>("REQ-0000");

  const [email, setEmail] = useState<string>("alex.morgan@example.com");
  const [cardholderName, setCardholderName] = useState<string>("Alex Morgan");
  const [cardNumber, setCardNumber] = useState<string>("4242 4242 4242 4242");
  const [expDate, setExpDate] = useState<string>("12/28");
  const [cvc, setCvc] = useState<string>("123");
  const [postalCode, setPostalCode] = useState<string>("10001");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [transactionRef, setTransactionRef] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    // Support generic identifiers (cartId, bookingId, invoiceId, sessionId)
    const rawSession =
      params.get("sessionId") ||
      params.get("cartId") ||
      params.get("invoiceId") ||
      params.get("bookingId");
    if (rawSession) setSessionId(rawSession);

    // 1. Try parsing a robust JSON array (allows multi-item checkout for any industry)
    // Example URL: ?items=[{"name":"Pro Plan","price":99,"qty":1},{"name":"Setup Fee","price":50,"qty":1}]
    const rawItems = params.get("items");
    if (rawItems) {
      try {
        const parsedItems = JSON.parse(rawItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          const formattedItems = parsedItems.map((item, idx) => ({
            id: item.id || `item-${idx}`,
            title: item.title || item.name || item.service || "Item",
            description: item.description || item.desc || "",
            price: parseFloat(item.price || item.amount || item.rate || 0),
            quantity: parseInt(item.quantity || item.qty || 1, 10),
          }));
          setItems(formattedItems);
          return; // Exit early if JSON successfully mapped
        }
      } catch (e) {
        console.warn(
          "Failed to parse items JSON from URL, falling back to scalars.",
        );
      }
    }

    // 2. Fallback to flat query parameters (handles single-item checkouts broadly)
    const rawTitle =
      params.get("title") ||
      params.get("name") ||
      params.get("product") ||
      params.get("service") ||
      params.get("plan");
    const rawPrice =
      params.get("price") ||
      params.get("amount") ||
      params.get("total") ||
      params.get("rate");
    const rawQty = params.get("quantity") || params.get("qty") || "1";
    const rawDesc = params.get("description") || params.get("desc");

    if (rawTitle && rawPrice) {
      setItems([
        {
          id: "param-item-1",
          title: rawTitle,
          description: rawDesc || "Details provided via chat session",
          price: parseFloat(rawPrice),
          quantity: Math.max(1, parseInt(rawQty, 10) || 1),
        },
      ]);
    } else if (rawPrice) {
      setItems([
        {
          id: "param-item-total",
          title: "Checkout Total",
          description: "Custom payment amount",
          price: parseFloat(rawPrice),
          quantity: 1,
        },
      ]);
    } else {
      // 3. Absolute fallback so the page is never blank during local testing
      setItems([
        {
          id: "demo-1",
          title: "Standard Tier Package",
          description: "System generated checkout session",
          price: 99.0,
          quantity: 1,
        },
      ]);
    }
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const finalTotal = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setTransactionRef(`TXN-${Date.now().toString().slice(-8)}`);
      setIsSuccess(true);
    }, 1500);
  };

  const handleReturnToChat = () => {
    window.location.href = "https://chatgpt.com";
  };

  if (isSuccess) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className={styles.badgeSuccess}>Sandbox Authorized</span>
          <h1 className={styles.successTitle}>Payment Successful</h1>
          <p className={styles.successSub}>
            Receipt confirmation sent to <strong>{email}</strong>
          </p>

          <div className={styles.receiptSummary}>
            <div className={styles.receiptRow}>
              <span>Transaction Ref</span>
              <strong>{transactionRef}</strong>
            </div>
            <div className={styles.receiptRow}>
              <span>Session ID</span>
              <span>#{sessionId}</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Amount Paid</span>
              <strong>${finalTotal.toFixed(2)}</strong>
            </div>
            <div className={styles.receiptRow}>
              <span>Payment Mode</span>
              <span>Test Visa (•••• 4242)</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleReturnToChat}
          >
            Return to Conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.stripeContainer}>
        {/* Left Column: Summary */}
        <section className={styles.leftColumn}>
          <div className={styles.brandHeader}>
            <div className={styles.brandIcon}>S</div>
            <span className={styles.brandName}>SoftTech AI Checkout</span>
          </div>

          <div className={styles.priceOverview}>
            <span className={styles.overviewLabel}>Amount Due</span>
            <div className={styles.overviewAmount}>
              ${finalTotal.toFixed(2)}
            </div>
          </div>

          <div className={styles.orderItemsList}>
            {items.map((item) => (
              <div key={item.id} className={styles.orderItem}>
                <div className={styles.itemMain}>
                  <div className={styles.itemAvatar}>
                    {/* Generic ticket/receipt icon instead of a shopping bag */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                      <path d="M4 8h16" />
                      <path d="M4 16h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                    {item.description && (
                      <p className={styles.itemDesc}>{item.description}</p>
                    )}
                    <p className={styles.itemDesc}>Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className={styles.itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.calculationBlock}>
            <div className={styles.calcRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Taxes (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className={`${styles.calcRow} ${styles.calcRowTotal}`}>
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.leftFooter}>
            <span>Session: {sessionId}</span>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleReturnToChat}
            >
              Cancel and return
            </button>
          </div>
        </section>

        {/* Right Column: Payment Form */}
        <section className={styles.rightColumn}>
          <div className={styles.sandboxBanner}>
            <span className={styles.sandboxDot} />
            <span>TEST MODE: Use 4242 4242 4242 4242 for authorization.</span>
          </div>

          <form onSubmit={handleSubmitPayment} className={styles.paymentForm}>
            <div className={styles.walletGroup}>
              <button
                type="button"
                className={styles.walletButton}
                onClick={() => setPaymentMethod("wallet")}
              >
                <span style={{ fontWeight: 700 }}>Pay</span>
              </button>
            </div>

            <div className={styles.dividerRow}>
              <span>Or pay with card</span>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionHeader}>Contact Information</h2>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="email-input">
                  Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  className={styles.inputField}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@example.com"
                  required
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionHeader}>Payment Details</h2>

              <div className={styles.fieldGroup}>
                <label
                  className={styles.fieldLabel}
                  htmlFor="card-number-input"
                >
                  Card number
                </label>
                <div className={styles.cardInputWrapper}>
                  <input
                    id="card-number-input"
                    type="text"
                    className={styles.inputField}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                  <div className={styles.cardBrandIcons}>
                    <span className={styles.brandPill}>VISA</span>
                    <span className={styles.brandPill}>MC</span>
                  </div>
                </div>
              </div>

              <div className={styles.multiFieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="exp-input">
                    Expiration
                  </label>
                  <input
                    id="exp-input"
                    type="text"
                    className={styles.inputField}
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    placeholder="MM / YY"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="cvc-input">
                    CVC
                  </label>
                  <input
                    id="cvc-input"
                    type="text"
                    className={styles.inputField}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="name-input">
                  Cardholder name
                </label>
                <input
                  id="name-input"
                  type="text"
                  className={styles.inputField}
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Full name on card"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="zip-input">
                  Postal code
                </label>
                <input
                  id="zip-input"
                  type="text"
                  className={styles.inputField}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : `Pay $${finalTotal.toFixed(2)}`}
            </button>

            <div className={styles.securityFooter}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Encrypted 256-bit checkout session</span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
export default Checkout;
