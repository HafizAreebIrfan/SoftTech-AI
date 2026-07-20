import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/transport.module.css";
import { useTransportStore } from "../../../../infrastructure/store/transportStore";

interface TransportScreenProps {
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

export const TransportScreen: React.FC<TransportScreenProps> = ({
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
    bookings,
    routes,
    drivers,
    rideModalOpen,
    setPerspective,
    openRideModal,
    closeRideModal,
    requestRide,
    updateRideStatus,
    toggleRouteStatus,
    toggleDriverAvailability
  } = useTransportStore();

  const displayBookings = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const tableBlock = blocks.find((b: any) => (b?.type === "table" || b?.type === "list") && (Array.isArray(b?.tableRows) || Array.isArray(b?.listItems)));
      if (tableBlock) {
        const rows = tableBlock.tableRows || tableBlock.listItems || [];
        if (rows.length > 0) {
          return rows.map((r: any, idx: number) => ({
            id: `RIDE-40${idx + 1}`,
            passengerName: r.passenger || r.title || r[0] || "Passenger",
            pickupLocation: r.pickup || r.origin || r[1] || "Downtown",
            dropoffLocation: r.dropoff || r.destination || r[2] || "Uptown",
            fare: typeof r.fare === 'number' ? r.fare : 24.00,
            status: r.status || "Requested",
            timestamp: "Just now"
          }));
        }
      }
    }
    return bookings;
  }, [blocks, bookings]);

  const [passengerInput, setPassengerInput] = useState("");

  const [pickupInput, setPickupInput] = useState("");
  const [dropoffInput, setDropoffInput] = useState("");
  const [fareInput, setFareInput] = useState("22.50");

  const handleRequestRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerInput.trim() || !pickupInput.trim()) return;
    requestRide(passengerInput, pickupInput, dropoffInput || "Downtown HQ", parseFloat(fareInput));
    setPassengerInput("");
    setPickupInput("");
    setDropoffInput("");
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
          <p className={styles.subtitle}>{subtitle || "Urban mobility dispatch platform & active transit route telemetry"}</p>
        </div>

        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Passenger App
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            Fleet Manager Panel
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
            {/* Active Bookings */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>Active Rides</h3>
                <button onClick={openRideModal} className={styles.createHeaderBtn}>
                  + Request Ride
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ride ID</th>
                      <th>Pickup & Dropoff</th>
                      <th>Fare</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBookings.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{b.id}</td>
                        <td style={{ fontSize: "12px" }}>{b.pickupLocation} &rarr; {b.dropoffLocation}</td>
                        <td style={{ fontWeight: 700 }}>${b.fare.toFixed(2)}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              b.status === 'Requested' ? styles.statusRequested :
                              b.status === 'Assigned' ? styles.statusAssigned :
                              b.status === 'In Ride' ? styles.statusInRide : styles.statusCompleted
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Transit Schedules */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Transit Line Schedules</h3>
              {routes.map((rt) => (
                <div key={rt.id} className={styles.routeCard}>
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--app-text-heading)" }}>{rt.routeName}</div>
                    <div style={{ fontSize: "11px", color: "var(--app-text-secondary)" }}>
                      {rt.origin} &rarr; {rt.destination} ({rt.frequency})
                    </div>
                  </div>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: rt.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: rt.status === 'Active' ? '#10b981' : '#ef4444'
                    }}
                  >
                    {rt.status}
                  </span>
                </div>
              ))}
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
            {/* Drivers dispatch table */}
            <div className={styles.panel} style={{ marginBottom: "28px" }}>
              <h3 className={styles.panelTitle}>Active Fleet Drivers</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Driver Name</th>
                      <th>Vehicle Model</th>
                      <th>Driver Rating</th>
                      <th>Availability Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((drv) => (
                      <tr key={drv.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{drv.name}</td>
                        <td>{drv.vehicleModel}</td>
                        <td>★ {drv.rating}</td>
                        <td>
                          <button
                            onClick={() => toggleDriverAvailability(drv.id)}
                            className={styles.statusBadge}
                            style={{
                              background: drv.status === 'Online' ? 'rgba(16, 185, 129, 0.12)' : drv.status === 'Busy' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255,255,255,0.05)',
                              color: drv.status === 'Online' ? '#10b981' : drv.status === 'Busy' ? '#facc15' : 'var(--app-text-secondary)',
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            {drv.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ride Dispatch Table */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Passenger Dispatch Management</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Passenger</th>
                      <th>Route</th>
                      <th>Fare</th>
                      <th>Action Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBookings.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{b.id}</td>
                        <td>{b.passengerName}</td>
                        <td style={{ fontSize: "12px" }}>{b.pickupLocation} &rarr; {b.dropoffLocation}</td>
                        <td style={{ fontWeight: 700 }}>${b.fare.toFixed(2)}</td>
                        <td>
                          <select
                            value={b.status}
                            onChange={(e) => updateRideStatus(b.id, e.target.value as any)}
                            className={styles.statusSelect}
                          >
                            <option value="Requested">Requested</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Ride">In Ride</option>
                            <option value="Completed">Completed</option>
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

      {/* Ride Booking Modal */}
      <AnimatePresence>
        {rideModalOpen && (
          <motion.div
            key="ride-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeRideModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Request On-Demand Ride</h3>

              <form onSubmit={handleRequestRide} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Passenger Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miles Morales"
                    value={passengerInput}
                    onChange={(e) => setPassengerInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.formGrid2Col}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Pickup Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brooklyn, NY"
                      value={pickupInput}
                      onChange={(e) => setPickupInput(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Dropoff Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midtown Manhattan"
                      value={dropoffInput}
                      onChange={(e) => setDropoffInput(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={closeRideModal} className={styles.stopBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.actionBtn}>
                    Dispatch Ride
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
