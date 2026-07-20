import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/general.module.css";
import { useGeneralStore } from "../../../../infrastructure/store/generalStore";
import { MetricBlock } from "../../components/MetricBlock";
import { ListBlock } from "../../components/ListBlock";
import { KeyValueBlock } from "../../components/KeyValueBlock";
import { TableBlock } from "../../components/TableBlock";
import { FormBlock } from "../../components/FormBlock";
import { WidgetBlock } from "../../../../domain/entities/GenericWidget";
import { TrashIcon } from "../../../../assets/icons";

interface GeneralScreenProps {
  title: string;
  subtitle?: string;
  blocks: WidgetBlock[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void
  ) => React.ReactNode;
}

export const GeneralScreen: React.FC<GeneralScreenProps> = ({
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
    invoices,
    teamMembers,
    invoiceModalOpen,
    globalMetrics,
    setPerspective,
    openInvoiceModal,
    closeInvoiceModal,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    toggleTeamMemberStatus
  } = useGeneralStore();

  // Invoice creation form states
  const [clientInput, setClientInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");

  // Support request form states
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInput.trim() || !amountInput.trim()) return;
    createInvoice(clientInput, parseFloat(amountInput), dueDateInput || new Date().toISOString().split('T')[0]);
    setClientInput("");
    setAmountInput("");
    setDueDateInput("");
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSuccess(false);
      setTicketSubject("");
      setTicketMsg("");
    }, 3000);
  };

  // Filter valid blocks for generic render at the bottom
  const validBlocks = blocks.filter((block: WidgetBlock) => {
    if (!block || typeof block !== "object") return false;
    switch (block.type) {
      case "metrics":
        return Array.isArray(block.metrics) && block.metrics.length > 0;
      case "list":
        return Array.isArray(block.listItems) && block.listItems.length > 0;
      case "keyValue":
        return (
          Array.isArray(block.keyValueItems) && block.keyValueItems.length > 0
        );
      case "table":
        return Array.isArray(block.tableRows) && block.tableRows.length > 0;
      case "form":
        return Array.isArray(block.formFields) && block.formFields.length > 0;
      default:
        return false;
    }
  });

  if (!isPreview) {
    return (
      <div className={styles.container}>
        {/* Main Header */}
        <header className={styles.header}>
          <div className={styles.titleSec}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle || "Live API response"}</p>
          </div>
        </header>

        {/* Render generic blocks */}
        {validBlocks.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {validBlocks.map((block, index) => {
              switch (block.type) {
                case "metrics":
                  return (
                    <MetricBlock
                      key={index}
                      metrics={block.metrics!}
                      title={block.title}
                    />
                  );
                case "list":
                  return (
                    <ListBlock
                      key={index}
                      listItems={block.listItems!}
                      title={block.title}
                    />
                  );
                case "keyValue":
                  return (
                    <KeyValueBlock
                      key={index}
                      keyValueItems={block.keyValueItems!}
                      title={block.title}
                    />
                  );
                case "table":
                  return (
                    <TableBlock
                      key={index}
                      tableHeaders={block.tableHeaders}
                      tableRows={block.tableRows!}
                      title={block.title}
                    />
                  );
                case "form":
                  return (
                    <FormBlock
                      key={index}
                      title={block.title}
                      formFields={block.formFields!}
                      submitLabel={block.submitLabel}
                      actionUrl={block.actionUrl}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        ) : (
          <div className={styles.panel} style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "var(--app-text-body)" }}>No data blocks returned from the API.</p>
          </div>
        )}
      </div>
    );
  }

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
          <p className={styles.subtitle}>{subtitle || "General enterprise operation metrics and client ledger"}</p>
        </div>

        {/* Sliding Perspective Switcher */}
        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Client Portal
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            Owner Admin Panel
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {perspective === 'subscriber' ? (
          /* Client Portal View */
          <motion.div
            key="subscriber-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={styles.mainGrid}
          >
            {/* Outstanding invoices */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Your Pending Invoices</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Due Date</th>
                      <th>Amount Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{inv.id.substring(4, 9).toUpperCase()}</td>
                        <td>{inv.dueDate}</td>
                        <td style={{ fontWeight: 700 }}>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              inv.status === 'Paid' ? styles.statusPaid :
                              inv.status === 'Unpaid' ? styles.statusUnpaid : styles.statusOverdue
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Ticket Submission */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Open Support Case</h3>
              {ticketSuccess ? (
                <div className={styles.successCenter}>
                  <div className={styles.successIconCircle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h4 className={styles.successTitle}>Case Submitted Successfully</h4>
                  <p className={styles.successText}>A support engineer will reply to your registered account email shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className={styles.formContainer}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Subject / Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Invoicing discrepancy or account access"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Details / Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe the issue you are experiencing..."
                      value={ticketMsg}
                      onChange={(e) => setTicketMsg(e.target.value)}
                      className={styles.textInput}
                      style={{ resize: "none" }}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.actionBtn}
                    style={{ width: "100%" }}
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        ) : (
          /* Owner Admin Panel View */
          <motion.div
            key="provider-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Financial Metrics Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Revenue</div>
                <div className={styles.statVal}>
                  ${globalMetrics.revenue.toLocaleString()}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Expenses</div>
                <div className={styles.statVal}>
                  ${globalMetrics.expenses.toLocaleString()}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Profit Margin</div>
                <div className={styles.statVal}>{globalMetrics.margin}%</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Quarterly Growth</div>
                <div className={styles.statVal}>+{globalMetrics.growth}%</div>
              </div>
            </div>

            <div className={styles.mainGrid}>
              {/* Invoices List Panel */}
              <div className={styles.panel}>
                <div className={styles.panelHeaderRow}>
                  <h3 className={styles.panelTitle} style={{ margin: 0 }}>
                    Invoicing & Ledger
                  </h3>
                  <button
                    onClick={openInvoiceModal}
                    className={styles.createHeaderBtn}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Invoice
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Control</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{inv.clientName}</td>
                          <td style={{ fontWeight: 700 }}>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                inv.status === 'Paid' ? styles.statusPaid :
                                inv.status === 'Unpaid' ? styles.statusUnpaid : styles.statusOverdue
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={inv.status}
                              onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as any)}
                              className={styles.statusSelect}
                            >
                              <option value="Paid">Paid</option>
                              <option value="Unpaid">Unpaid</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              style={{ background: "transparent", border: "none", color: "var(--app-text-secondary)", cursor: "pointer" }}
                            >
                              <TrashIcon size={14} color="currentColor" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Team Roster Panel */}
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Team Roster Members</h3>
                <div className={styles.teamList}>
                  {teamMembers.map((tm) => (
                    <div key={tm.id} className={styles.teamCard}>
                      <div>
                        <div className={styles.teamName}>{tm.name}</div>
                        <div className={styles.teamRole}>{tm.role} • {tm.email}</div>
                      </div>
                      <button
                        onClick={() => toggleTeamMemberStatus(tm.id)}
                        className={styles.statusBadge}
                        style={{
                          background: tm.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                          color: tm.status === 'Active' ? '#10b981' : 'var(--app-text-secondary)',
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        {tm.status}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {invoiceModalOpen && (
          <motion.div
            key="invoice-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeInvoiceModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Issue New Bill Invoice</h3>

              <form onSubmit={handleCreateInvoice} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Client / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stark Industries"
                    value={clientInput}
                    onChange={(e) => setClientInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Amount (USD)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Due Date</label>
                  <input
                    type="date"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={closeInvoiceModal}
                    className={styles.stopBtn}
                    style={{ margin: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.actionBtn}
                  >
                    Generate Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render generic blocks at the bottom if provided */}
      {validBlocks.length > 0 && (
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--app-glass-border-secondary)", paddingTop: "2rem" }}>
          {validBlocks.map((block, index) => {
            switch (block.type) {
              case "metrics":
                return (
                  <MetricBlock
                    key={index}
                    metrics={block.metrics!}
                    title={block.title}
                  />
                );
              case "list":
                return (
                  <ListBlock
                    key={index}
                    listItems={block.listItems!}
                    title={block.title}
                  />
                );
              case "keyValue":
                return (
                  <KeyValueBlock
                    key={index}
                    keyValueItems={block.keyValueItems!}
                    title={block.title}
                  />
                );
              case "table":
                return (
                  <TableBlock
                    key={index}
                    tableHeaders={block.tableHeaders}
                    tableRows={block.tableRows!}
                    title={block.title}
                  />
                );
              case "form":
                return (
                  <FormBlock
                    key={index}
                    title={block.title}
                    formFields={block.formFields!}
                    submitLabel={block.submitLabel}
                    actionUrl={block.actionUrl}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
};
