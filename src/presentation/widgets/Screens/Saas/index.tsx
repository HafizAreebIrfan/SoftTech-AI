import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSaaSStore } from "../../../../infrastructure/store/saasStore";
import { useThemeStore } from "../../../../hooks";
import { useApplyGlobalThemeVars } from "../../../../infrastructure/store/themeStore";
import styles from "../../../../styles/saas.module.css";
import { SAAS_PLANS } from "../../../../hooks/mockData/saas";
import { SaaSPlan, SaaSMember, SaaSClientAccount, SaaSProviderKPI } from "../../../../types/saas";
import {
  SunIcon,
  MoonIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  UserIcon,
  SlidersIcon,
  DatabaseIcon,
  TerminalIcon,
  KeyIcon,
  Plus,
} from "../../../../assets/icons";

interface SaasScreenProps {
  title: string;
  subtitle?: string;
  blocks?: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void,
  ) => React.ReactNode;
}

export const SaasScreen: React.FC<SaasScreenProps> = ({
  title,
  subtitle,
  blocks,
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  // Sync core global variables for dark/light values
  useApplyGlobalThemeVars();

  // Zustand Store SaaS metrics
  const {
    currentPlanId,
    billingInterval,
    usage,
    members,
    invoices,
    cardBrand,
    cardLast4,
    nextBillingDate,
    setBillingInterval,
    upgradePlan,
    addMember,
    removeMember,
    changeMemberRole,
    updateCard,
    perspective,
    clientAccounts,
    providerKPIs,
    setPerspective,
    addClientAccount,
    toggleClientStatus,
    changeClientPlan,
  } = useSaaSStore();

  const displayInvoices = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const tableBlock = blocks.find((b: any) => (b?.type === "table" || b?.type === "list") && (Array.isArray(b?.tableRows) || Array.isArray(b?.listItems)));
      if (tableBlock) {
        const rows = tableBlock.tableRows || tableBlock.listItems || [];
        if (rows.length > 0) {
          return rows.map((r: any, idx: number) => ({
            id: `inv_dyn_${idx}`,
            date: r.date || r.timestamp || "2026-07-01",
            amount: typeof r.amount === 'number' ? r.amount : typeof r.price === 'number' ? r.price : 99.00,
            status: r.status || "Paid",
            planName: r.plan || r.title || r[0] || "Pro Plan",
            pdfUrl: "#"
          }));
        }
      }
    }
    return invoices;
  }, [blocks, invoices]);

  const { isDark, toggleTheme } = useThemeStore();

  // Local navigation tab
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "team">(
    "overview",
  );

  // Upgrade confirmation modal state
  const [selectedUpgradePlan, setSelectedUpgradePlan] =
    useState<SaaSPlan | null>(null);

  // Card update fields state
  const [editingCard, setEditingCard] = useState(false);
  const [tempBrand, setTempBrand] = useState("Visa");
  const [tempLast4, setTempLast4] = useState("4242");

  // Team invite form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<SaaSMember["role"]>("Member");

  // Provider panel state
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientOwner, setNewClientOwner] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPlan, setNewClientPlan] = useState("starter");

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newClientCompany.trim() ||
      !newClientOwner.trim() ||
      !newClientEmail.trim()
    )
      return;
    addClientAccount(
      newClientCompany,
      newClientOwner,
      newClientEmail,
      newClientPlan,
    );
    setNewClientCompany("");
    setNewClientOwner("");
    setNewClientEmail("");
    setNewClientPlan("starter");
  };

  // Resolve currently active plan details
  const activePlan =
    SAAS_PLANS.find((p) => p.id === currentPlanId) || SAAS_PLANS[1];

  const handleUpgradeClick = (plan: SaaSPlan) => {
    if (plan.id === currentPlanId) return;
    setSelectedUpgradePlan(plan);
  };

  const handleConfirmUpgrade = () => {
    if (selectedUpgradePlan) {
      upgradePlan(selectedUpgradePlan.id);
      setSelectedUpgradePlan(null);
    }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    updateCard(tempBrand, tempLast4);
    setEditingCard(false);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    addMember(inviteName, inviteEmail, inviteRole);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Member");
  };

  // Warning metrics if utilization is near limit (> 80%)
  const showWarning =
    usage.seats.current / usage.seats.max >= 0.8 ||
    usage.storageGb.current / usage.storageGb.max >= 0.8 ||
    usage.apiCalls.current / usage.apiCalls.max >= 0.8;

  return (
    <div className={styles.container}>
      {isPreview &&
        renderPreviewControls &&
        setPreviewIndustry &&
        previewIndustry && (
          <div style={{ marginBottom: "1.5rem" }}>
            {renderPreviewControls(previewIndustry, setPreviewIndustry)}
          </div>
        )}

      {/* Main Glassmorphic Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleSec}>
          <h2>{title || "SaaS Admin Control Center"}</h2>
          <p>
            {subtitle ||
              "Manage subscription limits, active team members, and billing details"}
          </p>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.perspectiveSelector}>
            <button
              onClick={() => setPerspective("subscriber")}
              className={`${styles.perspectiveBtn} ${
                perspective === "subscriber" ? styles.perspectiveBtnActive : ""
              }`}
            >
              Customer Portal
            </button>
            <button
              onClick={() => setPerspective("provider")}
              className={`${styles.perspectiveBtn} ${
                perspective === "provider" ? styles.perspectiveBtnActive : ""
              }`}
            >
              Provider Console
            </button>
          </div>

          <button
            onClick={() => toggleTheme()}
            className={styles.themeToggleBtn}
            title="Toggle theme"
          >
            {isDark ? (
              <>
                <SunIcon size={14} color="currentColor" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <MoonIcon size={14} color="currentColor" />
                <span>Dark Theme</span>
              </>
            )}
          </button>
        </div>
      </header>

      {perspective === "provider" ? (
        <div className={styles.providerConsole}>
          {/* Provider metrics KPIs */}
          <div className={styles.overviewGrid}>
            {providerKPIs.map((kpi) => (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.metricCard}
              >
                <div className={styles.metricHeader}>
                  <span className={styles.metricTitle}>{kpi.label}</span>
                </div>
                <div className={styles.metricVal}>{kpi.value}</div>
                <div className={styles.metricFooter}>
                  <span className={styles.kpiChangePositive}>{kpi.change}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main client account management and adding client */}
          <div className={styles.subscriptionOverview}>
            <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className={styles.invoiceCard} style={{ margin: 0 }}>
                <h3 className={styles.billingTitle} style={{ marginBottom: "20px" }}>
                  Registered Client Workspaces
                </h3>
                <div className={styles.invoiceTableWrapper}>
                  <table className={styles.invoiceTable}>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Owner</th>
                        <th>Tier Plan</th>
                        <th>Spend/Month</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAccounts.map((client) => (
                        <tr key={client.id}>
                          <td>
                            <div className={styles.memberName} style={{ fontWeight: "700" }}>{client.companyName}</div>
                            <div className={styles.memberEmail} style={{ fontSize: "11px", opacity: 0.7 }}>Joined {client.joinDate}</div>
                          </td>
                          <td>
                            <div className={styles.memberName}>{client.ownerName}</div>
                            <div className={styles.memberEmail}>{client.ownerEmail}</div>
                          </td>
                          <td>
                            <select
                              value={client.planId}
                              onChange={(e) => changeClientPlan(client.id, e.target.value)}
                              className={styles.roleSelect}
                              style={{ width: "100%" }}
                            >
                              {SAAS_PLANS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ fontWeight: "700" }}>
                            ${client.monthlySpend}/mo
                          </td>
                          <td>
                            <span
                              className={
                                client.status === "active"
                                  ? styles.statusPaid
                                  : client.status === "trialing"
                                  ? styles.statusTrial
                                  : styles.statusSuspended
                              }
                            >
                              {client.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => toggleClientStatus(client.id)}
                              className={
                                client.status === "active"
                                  ? styles.suspendBtn
                                  : styles.activateBtn
                              }
                            >
                              {client.status === "active" ? "Suspend" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.addMemberCard} style={{ flex: 1, minWidth: "300px" }}>
              <h3 className={styles.addMemberTitle}>Onboard Client Company</h3>
              <p className={styles.subMeta} style={{ marginBottom: "1.5rem" }}>
                Quick-add a new subscriber account into the provider database.
              </p>

              <form onSubmit={handleAddClientSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="new-client-company">Company Name</label>
                  <input
                    id="new-client-company"
                    type="text"
                    placeholder="e.g. Stark Industries"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="new-client-owner">Owner Full Name</label>
                  <input
                    id="new-client-owner"
                    type="text"
                    placeholder="e.g. Tony Stark"
                    value={newClientOwner}
                    onChange={(e) => setNewClientOwner(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="new-client-email">Owner Email</label>
                  <input
                    id="new-client-email"
                    type="email"
                    placeholder="owner@company.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="new-client-plan">Select Tier Plan</label>
                  <select
                    id="new-client-plan"
                    value={newClientPlan}
                    onChange={(e) => setNewClientPlan(e.target.value)}
                    className={styles.formSelect}
                  >
                    {SAAS_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className={styles.addBtn}>
                  <span>Create Subscription</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation tabs */}
          <div className={styles.tabNav}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
            >
              <SlidersIcon size={16} color="currentColor" />
              <span>Workspace Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`${styles.tabBtn} ${activeTab === "billing" ? styles.tabBtnActive : ""}`}
            >
              <KeyIcon size={16} color="currentColor" />
              <span>Plans & Billing</span>
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`${styles.tabBtn} ${activeTab === "team" ? styles.tabBtnActive : ""}`}
            >
              <UserIcon size={16} color="currentColor" />
              <span>Team Members ({members.length})</span>
            </button>
          </div>

          {/* Warning banner */}
          {showWarning && (
            <div className={styles.warningBanner}>
              <div className={styles.warningText}>
                <span style={{ fontSize: "18px" }}>⚠️</span>
                <span>
                  Warning: Some resource limits in your workspace are approaching
                  100% capacity.
                </span>
              </div>
              {currentPlanId !== "enterprise" && (
                <button
                  onClick={() => setActiveTab("billing")}
                  className={styles.upgradeBtnSmall}
                >
                  Upgrade Workspace
                </button>
              )}
            </div>
          )}

          {/* Tab Contents with Framer Motion transitions */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className={styles.overviewGrid}
              >
                {/* Metric Card: Team Seats */}
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricTitle}>Active Seats</span>
                    <UserIcon size={20} color="currentColor" />
                  </div>
                  <div className={styles.metricVal}>
                    {usage.seats.current} / {usage.seats.max}
                  </div>
                  <div className={styles.meterContainer}>
                    <div
                      className={`${styles.meterBar} ${
                        usage.seats.current / usage.seats.max >= 0.8
                          ? styles.meterWarning
                          : ""
                      }`}
                      style={{
                        width: `${Math.min((usage.seats.current / usage.seats.max) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className={styles.metricFooter}>
                    <span>Utilization</span>
                    <span>
                      {Math.round((usage.seats.current / usage.seats.max) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Metric Card: Cloud Storage */}
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricTitle}>Database Storage</span>
                    <DatabaseIcon size={20} color="currentColor" />
                  </div>
                  <div className={styles.metricVal}>
                    {usage.storageGb.current} GB / {usage.storageGb.max} GB
                  </div>
                  <div className={styles.meterContainer}>
                    <div
                      className={`${styles.meterBar} ${
                        usage.storageGb.current / usage.storageGb.max >= 0.8
                          ? styles.meterWarning
                          : ""
                      }`}
                      style={{
                        width: `${Math.min((usage.storageGb.current / usage.storageGb.max) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className={styles.metricFooter}>
                    <span>Utilization</span>
                    <span>
                      {Math.round(
                        (usage.storageGb.current / usage.storageGb.max) * 100,
                      )}
                      %
                    </span>
                  </div>
                </div>

                {/* Metric Card: API Operations */}
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricTitle}>Monthly API Requests</span>
                    <TerminalIcon size={20} color="currentColor" />
                  </div>
                  <div className={styles.metricVal}>
                    {usage.apiCalls.current.toLocaleString()} /{" "}
                    {usage.apiCalls.max.toLocaleString()}
                  </div>
                  <div className={styles.meterContainer}>
                    <div
                      className={`${styles.meterBar} ${
                        usage.apiCalls.current / usage.apiCalls.max >= 0.8
                          ? styles.meterWarning
                          : ""
                      }`}
                      style={{
                        width: `${Math.min((usage.apiCalls.current / usage.apiCalls.max) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className={styles.metricFooter}>
                    <span>Utilization</span>
                    <span>
                      {Math.round(
                        (usage.apiCalls.current / usage.apiCalls.max) * 100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                {/* Current Active Plan Overview */}
                <div className={styles.subscriptionOverview}>
                  <div className={styles.subCard}>
                    <span className={styles.subTitle}>Current Subscription</span>
                    <div className={styles.subValue}>{activePlan.name}</div>
                    <div className={styles.subMeta}>
                      ${activePlan.price} / month billed {billingInterval}
                    </div>
                  </div>

                  <div className={styles.subCard}>
                    <span className={styles.subTitle}>Next Billing Cycle</span>
                    <div className={styles.subValue}>{nextBillingDate}</div>
                    <div className={styles.subMeta}>
                      Renews automatically via card on file
                    </div>
                  </div>

                  <div className={styles.subCard}>
                    <span className={styles.subTitle}>Card details</span>
                    <div className={styles.subValue}>
                      {cardBrand} •••• {cardLast4}
                    </div>
                    {!editingCard ? (
                      <button
                        onClick={() => setEditingCard(true)}
                        className={styles.cardSaveBtn}
                        style={{ marginTop: "8px" }}
                      >
                        Edit Payment Card
                      </button>
                    ) : (
                      <form
                        onSubmit={handleSaveCard}
                        className={styles.cardUpdateForm}
                      >
                        <input
                          type="text"
                          className={styles.cardInput}
                          value={tempBrand}
                          onChange={(e) => setTempBrand(e.target.value)}
                          placeholder="Brand (e.g. Mastercard)"
                          required
                        />
                        <input
                          type="text"
                          className={styles.cardInput}
                          value={tempLast4}
                          onChange={(e) => setTempLast4(e.target.value)}
                          placeholder="Last 4"
                          maxLength={4}
                          required
                        />
                        <button type="submit" className={styles.cardSaveBtn}>
                          Save
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Billing Interval & Grid Comparison */}
                <div className={styles.billingHeader}>
                  <h3 className={styles.billingTitle}>
                    Available Subscription Plans
                  </h3>
                  <div className={styles.billingToggleSec}>
                    <button
                      onClick={() => setBillingInterval("monthly")}
                      className={`${styles.billingToggleBtn} ${
                        billingInterval === "monthly"
                          ? styles.billingToggleBtnActive
                          : ""
                      }`}
                    >
                      Billed Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval("yearly")}
                      className={`${styles.billingToggleBtn} ${
                        billingInterval === "yearly"
                          ? styles.billingToggleBtnActive
                          : ""
                      }`}
                    >
                      Billed Annually
                    </button>
                  </div>
                </div>

                {/* Plans List Grid */}
                <div className={styles.plansGrid}>
                  {SAAS_PLANS.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const yearlyPrice = Math.round(plan.price * 0.8);
                    const displayPrice =
                      billingInterval === "yearly" ? yearlyPrice : plan.price;

                    return (
                      <div
                        key={plan.id}
                        className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ""}`}
                      >
                        {plan.popular && (
                          <span className={styles.popularBadge}>Most Popular</span>
                        )}
                        <h4 className={plan.name}>{plan.name}</h4>
                        <div className={styles.planPriceSec}>
                          <span className={styles.planPrice}>${displayPrice}</span>
                          <span className={styles.planPeriod}> / month</span>
                        </div>

                        <ul className={styles.planFeatures}>
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className={styles.featureItem}>
                              <CheckIcon size={12} color="currentColor" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrent ? (
                          <button
                            className={`${styles.planBtn} ${styles.planBtnCurrent}`}
                            disabled
                          >
                            Your Active Workspace
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpgradeClick(plan)}
                            className={`${styles.planBtn} ${
                              plan.popular
                                ? styles.planBtnUpgrade
                                : styles.planBtnSelect
                            }`}
                          >
                            Upgrade to {plan.name}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Billing Invoice history log */}
                <div className={styles.invoiceCard}>
                  <h3
                    className={styles.billingTitle}
                    style={{ marginBottom: "20px" }}
                  >
                    Payment Invoice Log
                  </h3>
                  <div className={styles.invoiceTableWrapper}>
                    <table className={styles.invoiceTable}>
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Billing Date</th>
                          <th>Billed Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: "bold" }}>{inv.id}</td>
                            <td>{inv.date}</td>
                            <td>${inv.amount.toFixed(2)}</td>
                            <td>
                              <span className={styles.statusPaid}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "team" && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className={styles.teamPanel}
              >
                {/* Team grid list card */}
                <div className={styles.membersListCard}>
                  <div className={styles.membersHeader}>
                    <h3 className={styles.membersTitle}>Active Team Workspaces</h3>
                    <span className={styles.subMeta}>
                      {members.filter((m) => m.status === "active").length} of{" "}
                      {usage.seats.max} seats occupied
                    </span>
                  </div>

                  <div className={styles.membersGrid}>
                    {members.map((member) => (
                      <div key={member.id} className={styles.memberRow}>
                        <div className={styles.memberInfoSec}>
                          <img
                            src={member.avatar}
                            className={styles.memberAvatar}
                            alt=""
                          />
                          <div>
                            <div className={styles.memberName}>{member.name}</div>
                            <div className={styles.memberEmail}>
                              {member.email}{" "}
                              {member.status === "invited" && (
                                <span style={{ fontStyle: "italic", opacity: 0.6 }}>
                                  (Invited)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.memberActions}>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              changeMemberRole(
                                member.id,
                                e.target.value as SaaSMember["role"],
                              )
                            }
                            className={styles.roleSelect}
                            disabled={member.role === "Owner"}
                          >
                            <option value="Owner">Owner</option>
                            <option value="Admin">Admin</option>
                            <option value="Member">Member</option>
                            <option value="Viewer">Viewer</option>
                          </select>

                          {member.role !== "Owner" && (
                            <button
                              onClick={() => removeMember(member.id)}
                              className={styles.removeBtn}
                              title="Remove member"
                            >
                              <TrashIcon size={16} color="currentColor" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite team section */}
                <div className={styles.addMemberCard}>
                  <h3 className={styles.addMemberTitle}>Invite Team Seat</h3>
                  <form onSubmit={handleInviteSubmit}>
                    <div className={styles.formGroup}>
                      <label htmlFor="invite-name">Full Name</label>
                      <input
                        type="text"
                        id="invite-name"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="invite-email">Work Email</label>
                      <input
                        type="email"
                        id="invite-email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className={styles.formInput}
                        placeholder="name@company.com"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="invite-role">Workspace Role</label>
                      <select
                        id="invite-role"
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(e.target.value as SaaSMember["role"])
                        }
                        className={styles.formSelect}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>

                    <button type="submit" className={styles.addBtn}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Plus size={16} color="currentColor" />
                        Send Workspace Invite
                      </span>
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Confirmation Upgrade plan Modal */}
      <AnimatePresence>
        {selectedUpgradePlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={styles.modalContent}
            >
              <div className={styles.modalIcon}>
                <SlidersIcon size={24} color="currentColor" />
              </div>
              <h3 className={styles.modalTitle}>Confirm Workspace Upgrade</h3>
              <p className={styles.modalDescription}>
                You are about to switch your active subscription plan to the{" "}
                <strong>{selectedUpgradePlan.name}</strong>. This plan costs{" "}
                <strong>
                  $
                  {billingInterval === "yearly"
                    ? Math.round(selectedUpgradePlan.price * 0.8)
                    : selectedUpgradePlan.price}
                </strong>
                /month, billed {billingInterval}. Your billing limits and seats
                will be updated immediately.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setSelectedUpgradePlan(null)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  className={styles.modalConfirmBtn}
                >
                  Confirm Upgrade
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
