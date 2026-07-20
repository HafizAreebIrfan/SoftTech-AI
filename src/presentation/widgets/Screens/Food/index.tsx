import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/food.module.css";
import { useFoodStore } from "../../../../infrastructure/store/foodStore";

interface FoodScreenProps {
  title: string;
  subtitle?: string;
  blocks?: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void
  ) => React.ReactNode;
}

export const FoodScreen: React.FC<FoodScreenProps> = ({
  title,
  subtitle,
  blocks = [],
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  const {
    perspective,
    menu,
    orders,
    stats,
    menuModalOpen,
    setPerspective,
    openMenuModal,
    closeMenuModal,
    placeOrder,
    updateOrderStatus,
    addMenuItem,
    toggleItemAvailability
  } = useFoodStore();

  const displayOrders = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const tableBlock = blocks.find((b: any) => (b?.type === "table" || b?.type === "list") && (Array.isArray(b?.tableRows) || Array.isArray(b?.listItems)));
      if (tableBlock) {
        const rows = tableBlock.tableRows || tableBlock.listItems || [];
        if (rows.length > 0) {
          return rows.map((r: any, idx: number) => ({
            id: `ORD-90${idx + 1}`,
            customerName: r.customer || r.title || r[0] || "Guest Diner",
            items: Array.isArray(r.items) ? r.items : [r.description || r[1] || "Gourmet Meal"],
            totalAmount: typeof r.amount === 'number' ? r.amount : typeof r.price === 'number' ? r.price : 28.50,
            status: r.status || "Placed",
            createdAt: "Just now"
          }));
        }
      }
    }
    return orders;
  }, [blocks, orders]);

  const [itemNameInput, setItemNameInput] = useState("");

  const [categoryInput, setCategoryInput] = useState("Gourmet Mains");
  const [priceInput, setPriceInput] = useState("14.50");

  const [customerNameInput, setCustomerNameInput] = useState("");
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(false);

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameInput.trim()) return;
    addMenuItem(itemNameInput, categoryInput, parseFloat(priceInput));
    setItemNameInput("");
  };

  const handlePlaceOrder = (item: any) => {
    placeOrder(customerNameInput || "Guest Diner", [item.name], item.price);
    setOrderSuccessMsg(true);
    setTimeout(() => setOrderSuccessMsg(false), 2500);
  };

  return (
    <div className={styles.container}>
      {isPreview && renderPreviewControls && setPreviewIndustry && previewIndustry && (
        <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 10 }}>
          {renderPreviewControls(previewIndustry, setPreviewIndustry)}
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.titleSec}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle || "Gourmet dining ordering platform & kitchen dispatch engine"}</p>
        </div>

        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Diner Portal
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            Kitchen Console
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {perspective === 'subscriber' ? (
          <motion.div
            key="subscriber-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={styles.mainGrid}
          >
            {/* Menu catalog */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Featured Gourmet Menu</h3>
              {orderSuccessMsg && (
                <div style={{ padding: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "10px", fontSize: "12px", marginBottom: "16px", fontWeight: "bold" }}>
                  ✓ Order dispatched to kitchen!
                </div>
              )}

              <div className={styles.menuGrid}>
                {menu.map((itm) => (
                  <div key={itm.id} className={styles.menuCard}>
                    <div>
                      <div className={styles.menuItemName}>{itm.name}</div>
                      <div className={styles.menuItemCategory}>{itm.category}</div>
                    </div>
                    <div className="flex justify-between items-center" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className={styles.menuItemPrice}>${itm.price.toFixed(2)}</div>
                      <button
                        disabled={!itm.available}
                        onClick={() => handlePlaceOrder(itm)}
                        className={styles.actionBtn}
                        style={{ opacity: itm.available ? 1 : 0.4, cursor: itm.available ? "pointer" : "not-allowed", padding: "6px 12px", fontSize: "11px" }}
                      >
                        {itm.available ? "Order Now" : "Sold Out"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Order History */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Your Order Telemetry</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{ord.id}</td>
                        <td style={{ fontSize: "12px" }}>{ord.items.join(", ")}</td>
                        <td style={{ fontWeight: 700 }}>${ord.totalAmount.toFixed(2)}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              ord.status === 'Placed' ? styles.statusPlaced :
                              ord.status === 'Preparing' ? styles.statusPreparing :
                              ord.status === 'Out for Delivery' ? styles.statusDelivery : styles.statusDelivered
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="provider-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Restaurant KPIs */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Orders</div>
                <div className={styles.statVal}>{stats.ordersCount}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Gross Revenue</div>
                <div className={styles.statVal}>${stats.grossRevenue.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg Prep Time</div>
                <div className={styles.statVal}>{stats.averagePrepTime} Mins</div>
              </div>
            </div>

            {/* Kitchen Dispatch Table */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Kitchen Active Tickets</h3>
                <button onClick={openMenuModal} className={styles.createHeaderBtn}>
                  + Add Menu Dish
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Customer</th>
                      <th>Order Contents</th>
                      <th>Amount</th>
                      <th>Kitchen Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{ord.id}</td>
                        <td>{ord.customerName}</td>
                        <td>{ord.items.join(", ")}</td>
                        <td style={{ fontWeight: 700 }}>${ord.totalAmount.toFixed(2)}</td>
                        <td>
                          <select
                            value={ord.status}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                            className={styles.statusSelect}
                          >
                            <option value="Placed">Placed</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Dish Creation Modal */}
      <AnimatePresence>
        {menuModalOpen && (
          <motion.div
            key="menu-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeMenuModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Add Dish to Menu</h3>

              <form onSubmit={handleCreateMenuItem} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Dish Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wagyu Steak Truffle Frites"
                    value={itemNameInput}
                    onChange={(e) => setItemNameInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Category</label>
                  <input
                    type="text"
                    required
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={closeMenuModal} className={styles.stopBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.actionBtn}>
                    Save Menu Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
