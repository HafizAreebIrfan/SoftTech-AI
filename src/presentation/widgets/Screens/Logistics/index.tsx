import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/logistics.module.css";
import { useLogisticsStore } from "../../../../infrastructure/store/logisticsStore";
import { Shipment } from "../../../../types/logistics";

interface LogisticsScreenProps {
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

export const LogisticsScreen: React.FC<LogisticsScreenProps> = ({
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
    shipments,
    selectedShipmentId,
    drivers,
    trackingSearchQuery,
    onboardShipmentModalOpen,
    setPerspective,
    setSelectedShipmentId,
    setTrackingSearchQuery,
    openOnboardShipmentModal,
    closeOnboardShipmentModal,
    createShipment,
    updateShipmentStatus,
    toggleDriverStatus
  } = useLogisticsStore();

  const displayShipments = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const tableBlock = blocks.find((b: any) => (b?.type === "table" || b?.type === "list") && (Array.isArray(b?.tableRows) || Array.isArray(b?.listItems)));
      if (tableBlock) {
        const rows = tableBlock.tableRows || tableBlock.listItems || [];
        if (rows.length > 0) {
          return rows.map((r: any, idx: number) => ({
            id: `dyn_shp_${idx}`,
            trackingNumber: r.trackingNumber || `TRK-8890${idx}`,
            sender: r.sender || r.title || r[0] || "Global Sender",
            recipient: r.recipient || r[1] || "Recipient Client",
            origin: r.origin || "Seattle, WA",
            destination: r.destination || "Austin, TX",
            status: r.status || "In Transit",
            estimatedDelivery: "2026-07-28",
            currentLocation: "Hub Terminal 4",
            weight: "12 kg",
            carrier: "Fleet Express",
            routeHistory: Array.isArray(r.routeHistory) ? r.routeHistory : [
              { location: r.origin || "Seattle, WA", description: "Shipment departed origin facility", time: "10:00 AM" },
              { location: "Transit Hub", description: "Package in transit to next hub", time: "02:30 PM" },
              { location: r.destination || "Austin, TX", description: "Arrived at sorting facility", time: "08:15 PM" }
            ]
          }));
        }
      }
    }
    return shipments;
  }, [blocks, shipments]);


  // Modal form states
  const [senderInput, setSenderInput] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [weightInput, setWeightInput] = useState("10.0 kg");

  // Search filter
  const filteredShipments = displayShipments.filter(
    (s: any) =>
      (s.trackerCode || s.trackingNumber || "").toLowerCase().includes(trackingSearchQuery.toLowerCase()) ||
      (s.recipient || "").toLowerCase().includes(trackingSearchQuery.toLowerCase()) ||
      (s.sender || "").toLowerCase().includes(trackingSearchQuery.toLowerCase())
  );

  const selectedShipment = displayShipments.find((s: any) => s.id === selectedShipmentId) || displayShipments[0];

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderInput.trim() || !recipientInput.trim()) return;
    createShipment(senderInput, recipientInput, originInput || "Central Hub", destInput || "Destination Office", weightInput);
    setSenderInput("");
    setRecipientInput("");
    setOriginInput("");
    setDestInput("");
  };

  return (
    <div className={styles.container}>
      {/* Control panel header in preview mode */}
      {isPreview && renderPreviewControls && setPreviewIndustry && previewIndustry && (
        <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 10 }}>
          {renderPreviewControls(previewIndustry, setPreviewIndustry)}
        </div>
      )}

      {/* Main Header */}
      <header className={styles.header}>
        <div className={styles.titleSec}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle || "Live shipment routing and supply chain telemetry"}</p>
        </div>

        {/* Sliding Perspective Switcher */}
        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Package Tracker
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            Dispatch & Fleet Panel
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {perspective === 'subscriber' ? (
          /* Subscriber / Customer View: Package Search & Timeline Tracking */
          <motion.div
            key="subscriber-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={styles.mainGrid}
          >
            {/* Left side: Search & Package List */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Active Shipments</h3>

              {/* Search Bar */}
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search tracking code or recipient..."
                  value={trackingSearchQuery}
                  onChange={(e) => setTrackingSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.shipmentsList}>
                {filteredShipments.map((shp) => {
                  const isSelected = shp.id === selectedShipmentId;
                  return (
                    <div
                      key={shp.id}
                      onClick={() => setSelectedShipmentId(shp.id)}
                      className={`${styles.shipmentCard} ${isSelected ? styles.shipmentCardSelected : ""}`}
                    >
                      <div className={styles.shipmentCardHeader}>
                        <span className={styles.shipmentCode}>{shp.trackerCode}</span>
                        <span
                          className={`${styles.statusBadge} ${
                            shp.status === 'Pending' ? styles.statusPending :
                            shp.status === 'In Transit' ? styles.statusTransit :
                            shp.status === 'Out for Delivery' ? styles.statusDelivery :
                            shp.status === 'Delivered' ? styles.statusDelivered : styles.statusFailed
                          }`}
                        >
                          {shp.status}
                        </span>
                      </div>
                      <div className={styles.shipmentRoute}>
                        {shp.sender} &rarr; {shp.recipient}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Detailed Route Timeline */}
            <div className={styles.panel}>
              {selectedShipment ? (
                <>
                  <div className={styles.detailsHeader}>
                    <div>
                      <h3 className={styles.detailsTitle}>{selectedShipment.trackerCode}</h3>
                      <p className={styles.detailsMeta}>Estimated Delivery: {selectedShipment.estimatedDelivery} • Weight: {selectedShipment.weight}</p>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        selectedShipment.status === 'Pending' ? styles.statusPending :
                        selectedShipment.status === 'In Transit' ? styles.statusTransit :
                        selectedShipment.status === 'Out for Delivery' ? styles.statusDelivery :
                        selectedShipment.status === 'Delivered' ? styles.statusDelivered : styles.statusFailed
                      }`}
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                    >
                      {selectedShipment.status}
                    </span>
                  </div>

                  {/* Route Overview */}
                  <div className={styles.routeOverview}>
                    <div>
                      <div className={styles.routeLabel}>Origin</div>
                      <div className={styles.routeValue}>{selectedShipment.origin}</div>
                    </div>
                    <div>
                      <div className={styles.routeLabel}>Destination</div>
                      <div className={styles.routeValue}>{selectedShipment.destination}</div>
                    </div>
                  </div>

                  <h4 className={styles.timelineTitle}>Route History Timeline</h4>

                  {/* Vertical Timeline */}
                  <div className={styles.timeline}>
                    <div className={styles.timelineLine}></div>
                    {(selectedShipment?.routeHistory || []).map((step, idx) => (
                      <div key={idx} className={styles.checkpointRow}>
                        <div className={`${styles.nodeBullet} ${idx === (selectedShipment?.routeHistory || []).length - 1 ? styles.nodeActive : ""}`}></div>
                        <div>
                          <div className={styles.checkpointTitle}>{step.location}</div>
                          <div className={styles.checkpointDesc}>{step.description}</div>
                          <div className={styles.checkpointTime}>[{step.time}]</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm">Select a shipment to view tracking details.</div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Provider / Dispatcher View: Fleet Driver Panel & Dispatch Table */
          <motion.div
            key="provider-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Fleet Drivers Grid */}
            <div className={styles.panel} style={{ marginBottom: "28px" }}>
              <h3 className={styles.panelTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"></path>
                  <path d="M15 18h2a2 2 0 0 0 2-2V9.5L16.5 6H14"></path>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="15.5" cy="18.5" r="2.5"></circle>
                </svg>
                Active Fleet Roster
              </h3>

              <div className={styles.driverGrid}>
                {drivers.map((drv) => (
                  <div key={drv.id} className={styles.driverCard}>
                    <div className={styles.driverDetails}>
                      <div className={styles.driverName}>{drv.name}</div>
                      <div className={styles.driverMeta}>{drv.vehicle}</div>
                      <div className={styles.driverPhone}>{drv.phone}</div>
                    </div>
                    <button
                      onClick={() => toggleDriverStatus(drv.id)}
                      className={styles.statusBadge}
                      style={{
                        background: drv.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        color: drv.status === 'Active' ? '#10b981' : 'var(--app-text-secondary)',
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      {drv.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatcher Control Table */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>
                  Shipment Dispatch Management
                </h3>
                <button
                  onClick={openOnboardShipmentModal}
                  className={styles.createHeaderBtn}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Register Shipment
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tracking Code</th>
                      <th>Sender</th>
                      <th>Recipient</th>
                      <th>Destination</th>
                      <th>Current Status</th>
                      <th>Action Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shp) => (
                      <tr key={shp.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{shp.trackerCode}</td>
                        <td>{shp.sender}</td>
                        <td>{shp.recipient}</td>
                        <td>{shp.destination}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              shp.status === 'Pending' ? styles.statusPending :
                              shp.status === 'In Transit' ? styles.statusTransit :
                              shp.status === 'Out for Delivery' ? styles.statusDelivery :
                              shp.status === 'Delivered' ? styles.statusDelivered : styles.statusFailed
                            }`}
                          >
                            {shp.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={shp.status}
                            onChange={(e) => updateShipmentStatus(shp.id, e.target.value as Shipment['status'])}
                            className={styles.dispatchSelect}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Failed">Failed</option>
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

      {/* Register Shipment Modal */}
      <AnimatePresence>
        {onboardShipmentModalOpen && (
          <motion.div
            key="shipment-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeOnboardShipmentModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Register New Package</h3>

              <form onSubmit={handleCreateShipment} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Sender Company/Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Cargo"
                    value={senderInput}
                    onChange={(e) => setSenderInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stark Industries"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.formGrid2Col}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Origin</label>
                    <input
                      type="text"
                      placeholder="e.g. Chicago, IL"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Destination</label>
                    <input
                      type="text"
                      placeholder="e.g. Miami, FL"
                      value={destInput}
                      onChange={(e) => setDestInput(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={closeOnboardShipmentModal}
                    className={styles.stopBtn}
                    style={{ margin: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.actionBtn}
                  >
                    Create Shipment
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
