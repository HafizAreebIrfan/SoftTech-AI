import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/ai.module.css";
import { useAIStore } from "../../../../infrastructure/store/aiStore";
import {
  TerminalIcon,
  SlidersIcon,
  DatabaseIcon,
  TrashIcon,
  BoltIcon
} from "../../../../assets/icons";

interface AiScreenProps {
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

export const AiScreen: React.FC<AiScreenProps> = ({
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
    agents,
    selectedAgentId,
    logs,
    providers,
    clientAccounts,
    globalMetrics,
    agentModalOpen,
    editingAgent,
    onboardModalOpen,
    setPerspective,
    setSelectedAgentId,
    openAgentModal,
    closeAgentModal,
    saveAgent,
    deleteAgent,
    triggerAgent,
    stopAgent,
    openOnboardModal,
    closeOnboardModal,
    onboardClient,
    toggleClientStatus,
    clearLogs
  } = useAIStore();

  const displayAgents = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const listBlock = blocks.find((b: any) => (b?.type === "list" || b?.type === "table") && (Array.isArray(b?.listItems) || Array.isArray(b?.tableRows)));
      if (listBlock) {
        const items = listBlock.listItems || listBlock.tableRows || [];
        if (items.length > 0) {
          return items.map((itm: any, idx: number) => ({
            id: `dyn_agent_${idx}`,
            name: itm.title || itm.name || itm[0] || "AI Agent Node",
            model: itm.model || "gpt-4o",
            role: itm.description || itm[1] || "Autonomous Automation Agent",
            status: itm.status || "Idle",
            totalExecutions: 450 + idx * 30,
            tokensUsed: 125000 + idx * 8000
          }));
        }
      }
    }
    return agents;
  }, [blocks, agents]);


  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Form states for modals
  const [agentTitleInput, setAgentTitleInput] = useState("");
  const [agentDescInput, setAgentDescInput] = useState("");
  
  const [clientCompanyInput, setClientCompanyInput] = useState("");
  const [clientEmailInput, setClientEmailInput] = useState("");
  const [clientTierInput, setClientTierInput] = useState<'Free' | 'Pro' | 'Enterprise'>("Pro");

  // Load editing agent details when modal opens
  useEffect(() => {
    if (editingAgent) {
      setAgentTitleInput(editingAgent.title);
      setAgentDescInput(editingAgent.description);
    } else {
      setAgentTitleInput("");
      setAgentDescInput("");
    }
  }, [editingAgent, agentModalOpen]);

  // Auto-scroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, selectedAgentId]);

  // Filter logs for selected agent, or general system logs
  const filteredLogs = logs.filter(
    (log) => log.agentId === selectedAgentId || log.agentId === undefined
  );

  const activeAgent = agents.find((a) => a.id === selectedAgentId);

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentTitleInput.trim()) return;
    saveAgent(agentTitleInput, agentDescInput);
  };

  const handleOnboardClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCompanyInput.trim() || !clientEmailInput.trim()) return;
    onboardClient(clientCompanyInput, clientEmailInput, clientTierInput);
    // Clear inputs
    setClientCompanyInput("");
    setClientEmailInput("");
    setClientTierInput("Pro");
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
          <p className={styles.subtitle}>{subtitle || "Autonomous pipelines and task workloads"}</p>
        </div>

        {/* Sliding Perspective Switcher */}
        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Agent Workspace
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            System Infra Panel
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {perspective === 'subscriber' ? (
          /* Subscriber View: Workspace and Agent Thread Executor */
          <motion.div
            key="subscriber-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={styles.mainGrid}
          >
            {/* Left side: List of Agents */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>
                  <SlidersIcon size={18} color="currentColor" />
                  Active Agent Threads
                </h3>
                <button
                  onClick={() => openAgentModal()}
                  className={styles.createAgentHeaderBtn}
                >
                  {/* Plus Icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Agent
                </button>
              </div>

              <div className={styles.agentsList}>
                {displayAgents.map((agent: any) => {
                  const isRunning = agent.status === "Running";
                  const isSelected = agent.id === selectedAgentId;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`${styles.agentCard} ${isRunning ? styles.agentCardRunning : ""} ${
                        isSelected ? styles.agentCardSelected : ""
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={styles.agentHeader}>
                        <div className={styles.cardTitleRow}>
                          <h4 className={styles.agentTitle}>
                            {agent.title}
                            {isRunning && <span className={styles.pulseDot}></span>}
                          </h4>
                          
                          {/* Hover Edit/Delete controls */}
                          <div className={styles.cardActionIcons} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openAgentModal(agent)}
                              className={styles.iconActionBtn}
                              title="Edit Agent"
                            >
                              {/* Edit Pencil Icon */}
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteAgent(agent.id)}
                              className={`${styles.iconActionBtn} ${styles.iconActionBtnDelete}`}
                              title="Delete Agent"
                            >
                              <TrashIcon size={13} color="currentColor" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className={isRunning ? styles.logMsgSuccess : styles.agentDesc}>{agent.description}</p>

                      <div className={styles.agentFooter}>
                        <div className={styles.agentStats}>
                          <div>Success: <span>{agent.successRate}%</span></div>
                          <div>Duration: <span>{agent.lastExecutionStats.duration}</span></div>
                          <div>Cost: <span>${agent.lastExecutionStats.cost.toFixed(3)}</span></div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isRunning ? stopAgent(agent.id) : triggerAgent(agent.id);
                          }}
                          className={isRunning ? styles.stopBtn : styles.actionBtn}
                        >
                          {isRunning ? "Stop Run" : "Trigger Agent"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Live Log Output Terminal */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>
                <TerminalIcon size={18} color="currentColor" />
                {activeAgent ? `Logs: ${activeAgent.title}` : "System Event logs"}
              </h3>

              <div className={styles.consoleWrapper}>
                <div className={styles.consoleHeader}>
                  <div className={styles.consoleTitle}>
                    <BoltIcon size={12} color="currentColor" />
                    stdout Console Output
                  </div>
                  <button onClick={clearLogs} className={styles.consoleControl}>
                    <TrashIcon size={12} color="currentColor" /> Clear Terminal
                  </button>
                </div>

                <div className={styles.consoleTerminal}>
                  {filteredLogs.length === 0 ? (
                    <div className={styles.logLine} style={{ opacity: 0.5 }}>
                      <span className={styles.logTimestamp}>[SYSTEM]</span>
                      <span className={styles.logMsgInfo}>No console prints found for this thread. Trigger the agent to see real-time stdout logs.</span>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className={styles.logLine}>
                        <span className={styles.logTimestamp}>[{log.timestamp}]</span>
                        <span
                          className={
                            log.level === 'info' ? styles.logMsgInfo :
                            log.level === 'warn' ? styles.logMsgWarn :
                            log.level === 'error' ? styles.logMsgError : styles.logMsgSuccess
                          }
                        >
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Provider View: Global Telemetry & Client Registries */
          <motion.div
            key="provider-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Global Metrics Row */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Executions</div>
                <div className={styles.statVal}>
                  {globalMetrics.totalExecutions.toLocaleString()}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg Latency</div>
                <div className={styles.statVal}>{globalMetrics.avgDuration}s</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Tokens Processed</div>
                <div className={styles.statVal}>
                  {(globalMetrics.totalTokens / 1000000).toFixed(2)}M
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Cost Savings</div>
                <div className={styles.statVal}>
                  ${globalMetrics.costSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Model Provider Latency Cards */}
            <div className={styles.panel} style={{ marginBottom: "28px" }}>
              <h3 className={styles.panelTitle}>
                <DatabaseIcon size={18} color="currentColor" />
                Active LLM Provider Node Statuses
              </h3>

              <div className={styles.providerGrid}>
                {providers.map((p) => (
                  <div key={p.name} className={styles.providerCard}>
                    <div className={styles.providerTitle}>
                      {p.name}
                      <span className={styles.providerState}>
                        <span className={styles.providerDotOnline}></span>
                        {p.status}
                      </span>
                    </div>
                    <div className={styles.providerStatRow}>
                      Latency: <span>{p.latency}ms</span>
                    </div>
                    <div className={styles.providerStatRow}>
                      Uptime: <span>{p.uptime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Managed Client Accounts List */}
            <div className={styles.panel} style={{ marginBottom: "28px" }}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Managed B2B Client Accounts
                </h3>
                <button
                  onClick={openOnboardModal}
                  className={styles.createAgentHeaderBtn}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Onboard Company
                </button>
              </div>

              <div className={styles.clientTableWrapper}>
                <table className={styles.clientTable}>
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Owner Email</th>
                      <th>License Tier</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientAccounts.map((cli) => (
                      <tr key={cli.id}>
                        <td style={{ fontWeight: 700, color: "var(--app-text-heading)" }}>{cli.companyName}</td>
                        <td>{cli.email}</td>
                        <td>
                          <span style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: cli.tier === 'Enterprise' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: cli.tier === 'Enterprise' ? '#c084fc' : 'var(--app-text-primary)'
                          }}>
                            {cli.tier}
                          </span>
                        </td>
                        <td>
                          <span className={cli.status === 'Active' ? styles.statusActiveTag : styles.statusSuspendedTag}>
                            {cli.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleClientStatus(cli.id)}
                            className={styles.btnStatusToggle}
                          >
                            {cli.status === 'Active' ? "Suspend" : "Activate"}
                          </button>
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

      {/* Modal Overlays */}
      <AnimatePresence>
        {/* Agent Form Modal (Create or Edit) */}
        {agentModalOpen && (
          <motion.div
            key="agent-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeAgentModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>
                {editingAgent ? "Edit AI Agent Thread" : "Configure New AI Agent"}
              </h3>

              <form onSubmit={handleSaveAgent} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Agent Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Enrichment Pipeline"
                    value={agentTitleInput}
                    onChange={(e) => setAgentTitleInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe what model nodes this agent runs and how it enriches outputs..."
                    value={agentDescInput}
                    onChange={(e) => setAgentDescInput(e.target.value)}
                    className={styles.textArea}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={closeAgentModal}
                    className={styles.stopBtn}
                    style={{ margin: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.actionBtn}
                  >
                    {editingAgent ? "Save Changes" : "Create Agent"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Client Onboard Modal */}
        {onboardModalOpen && (
          <motion.div
            key="onboard-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeOnboardModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Onboard B2B Client Company</h3>

              <form onSubmit={handleOnboardClient} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stark Industries"
                    value={clientCompanyInput}
                    onChange={(e) => setClientCompanyInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Admin/Owner Email</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@company.com"
                    value={clientEmailInput}
                    onChange={(e) => setClientEmailInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>License Tier</label>
                  <select
                    value={clientTierInput}
                    onChange={(e: any) => setClientTierInput(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="Free">Free Tier</option>
                    <option value="Pro">Pro License</option>
                    <option value="Enterprise">Enterprise License</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={closeOnboardModal}
                    className={styles.stopBtn}
                    style={{ margin: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.actionBtn}
                  >
                    Register Tenant
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
