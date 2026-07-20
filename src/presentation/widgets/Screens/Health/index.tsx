import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/health.module.css";
import { useHealthStore } from "../../../../infrastructure/store/healthStore";

interface HealthScreenProps {
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

export const HealthScreen: React.FC<HealthScreenProps> = ({
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
    appointments,
    records,
    providers,
    appointmentModalOpen,
    setPerspective,
    openAppointmentModal,
    closeAppointmentModal,
    bookAppointment,
    updateAppointmentStatus,
    toggleProviderAvailability
  } = useHealthStore();

  const displayAppointments = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const tableBlock = blocks.find((b: any) => (b?.type === "table" || b?.type === "list") && (Array.isArray(b?.tableRows) || Array.isArray(b?.listItems)));
      if (tableBlock) {
        const rows = tableBlock.tableRows || tableBlock.listItems || [];
        if (rows.length > 0) {
          return rows.map((r: any, idx: number) => ({
            id: `dyn_apt_${idx}`,
            patientName: r.patient || r.title || r[0] || "Patient",
            doctorName: r.doctor || r[1] || "Dr. Stephen Strange",
            specialty: r.specialty || r[2] || "General Medicine",
            date: r.date || "2026-07-28",
            time: r.time || "10:30 AM",
            status: r.status || "Scheduled"
          }));
        }
      }
    }
    return appointments;
  }, [blocks, appointments]);

  const [patientInput, setPatientInput] = useState("");

  const [doctorInput, setDoctorInput] = useState("Dr. Stephen Strange");
  const [specialtyInput, setSpecialtyInput] = useState("Neurology");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("10:00 AM");

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInput.trim()) return;
    bookAppointment(patientInput, doctorInput, specialtyInput, dateInput || "2026-07-25", timeInput);
    setPatientInput("");
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
          <p className={styles.subtitle}>{subtitle || "Telehealth consultation platform & patient EHR telemetry"}</p>
        </div>

        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Patient Portal
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            Clinic Admin View
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
            {/* Appointments */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>My Appointments</h3>
                <button onClick={openAppointmentModal} className={styles.createHeaderBtn}>
                  + Book Appointment
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{apt.doctorName}</td>
                        <td>{apt.specialty}</td>
                        <td>{apt.date} • {apt.time}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              apt.status === 'Scheduled' ? styles.statusScheduled :
                              apt.status === 'Completed' ? styles.statusCompleted : styles.statusCancelled
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EHR Records */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>EHR Medical Records</h3>
              {records.map((rec) => (
                <div key={rec.id} className={styles.recordCard}>
                  <div style={{ fontWeight: 800, color: "var(--app-text-heading)" }}>{rec.condition}</div>
                  <div style={{ fontSize: "12px", color: "var(--app-text-secondary)", marginTop: "4px" }}>
                    Prescriptions: {rec.prescriptions.join(", ")}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>
                    Last Examined: {rec.lastVisited}
                  </div>
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
            {/* Doctors roster */}
            <div className={styles.panel} style={{ marginBottom: "28px" }}>
              <h3 className={styles.panelTitle}>On-Duty Physicians Roster</h3>
              <div className={styles.providerGrid}>
                {providers.map((p) => (
                  <div key={p.id} className={styles.providerCard}>
                    <div>
                      <div style={{ fontWeight: 800, color: "var(--app-text-heading)" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--app-text-secondary)" }}>{p.specialty} • ★ {p.rating}</div>
                    </div>
                    <button
                      onClick={() => toggleProviderAvailability(p.id)}
                      className={styles.statusBadge}
                      style={{
                        background: p.available ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        color: p.available ? '#06b6d4' : 'var(--app-text-secondary)',
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      {p.available ? "Available" : "On Leave"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinic Master Appointments List */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Clinic Schedule Management</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{apt.patientName}</td>
                        <td>{apt.doctorName}</td>
                        <td>{apt.date} [{apt.time}]</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              apt.status === 'Scheduled' ? styles.statusScheduled :
                              apt.status === 'Completed' ? styles.statusCompleted : styles.statusCancelled
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={apt.status}
                            onChange={(e) => updateAppointmentStatus(apt.id, e.target.value as any)}
                            className={styles.statusSelect}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
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

      {/* Appointment Modal */}
      <AnimatePresence>
        {appointmentModalOpen && (
          <motion.div
            key="apt-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeAppointmentModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Book Telehealth Consultation</h3>

              <form onSubmit={handleBook} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={patientInput}
                    onChange={(e) => setPatientInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Select Physician</label>
                  <input
                    type="text"
                    required
                    value={doctorInput}
                    onChange={(e) => setDoctorInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.formGrid2Col}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Date</label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Time</label>
                    <input
                      type="text"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={closeAppointmentModal} className={styles.stopBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.actionBtn}>
                    Confirm Appointment
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
