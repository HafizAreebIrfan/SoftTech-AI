import React, { useState, useEffect } from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";
import { getAdminCompanyDetail, updateAdminCompanyRole } from "../../../../../adapters/api/adminApi";
import { showToast } from "../../../../../utils";

/* ──────────────────────────────────────
   Types
────────────────────────────────────── */
interface ApiEntry {
  name: string;
  url: string;
  method: "POST" | "GET" | "PATCH" | "DELETE" | "PUT";
  auth: string;
  status: "active" | "disabled";
}

interface CompanyDetailScreenProps {
  companyId?: string;
  onBack?: () => void;
}

const FALLBACK_APIS: ApiEntry[] = [
  { name: "User Authentication", url: "/api/v1/auth/login", method: "POST", auth: "Bearer Token", status: "active" },
  { name: "Data Streamer", url: "/api/v1/stream/realtime", method: "GET", auth: "OAuth 2.0", status: "active" },
  { name: "Profile Updater", url: "/api/v1/user/update", method: "PATCH", auth: "Bearer Token", status: "disabled" },
  { name: "Asset Manager", url: "/api/v1/assets/batch", method: "DELETE", auth: "API Key", status: "active" },
];

function formatDate(raw?: string): string {
  if (!raw) return "Recent";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Recent";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return "Recent";
  }
}

/* ──────────────────────────────────────
   Component
────────────────────────────────────── */
const CompanyDetailScreen: React.FC<CompanyDetailScreenProps> = ({ companyId, onBack }) => {
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState<boolean>(Boolean(companyId));
  const [company, setCompany] = useState<any>(null);
  const [apis, setApis] = useState<ApiEntry[]>(FALLBACK_APIS);

  useEffect(() => {
    if (!companyId) return;

    let isMounted = true;
    const loadDetail = async () => {
      try {
        setLoading(true);
        const res = await getAdminCompanyDetail(companyId);
        if (isMounted && res.success && res.data) {
          const data = res.data;
          setCompany(data);

          // Map company's registered APIs if present
          if (Array.isArray(data.apis) && data.apis.length > 0) {
            const mappedApis: ApiEntry[] = data.apis.map((a: any, idx: number) => {
              const method = (a.method || "POST").toUpperCase() as ApiEntry["method"];
              const validMethod = ["POST", "GET", "PATCH", "DELETE", "PUT"].includes(method) ? method : "POST";
              return {
                name: a.name || a.title || `API #${idx + 1}`,
                url: a.endpoint || a.url || `/api/v1/action-${idx + 1}`,
                method: validMethod,
                auth: a.authType || a.auth || (a.headers?.Authorization ? "Bearer Token" : "None"),
                status: a.status === "disabled" ? "disabled" : "active",
              };
            });
            setApis(mappedApis);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch admin company detail, using fallback preview:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const companyName = company?.companyName || company?.name || "Quantum Leap Technologies";
  const companyEmail = company?.email || "contact@quantumleap.tech";
  const initials = companyName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "QL";
  const industry = company?.industry || "Artificial Intelligence";
  const mcpSlug = company?.mcpSlug || "quantum";
  const subdomain = `${mcpSlug}.softtech.ai`;
  const joinedDate = formatDate(company?.registrationDate || company?.createdAt);
  const plan = company?.currentPlan || company?.plan || "Enterprise";
  const status = company?.status || "Active";
  // Canonical flags: isDashboardOnboardingDone=true → complete; otherwise
  // show the current dashboard step (legacy `onboardingStep` as fallback).
  const onboardingStatus = company?.isDashboardOnboardingDone
    ? "Complete"
    : company?.dashboardOnboardingStep
      ? `Dashboard Step ${company.dashboardOnboardingStep}`
      : company?.onboardingStep
        ? `Step ${company.onboardingStep}`
        : "Complete";

  const handleRoleToggle = async () => {
    if (!companyId) return;
    try {
      const newRole = company?.role === "admin" ? "company" : "admin";
      const res = await updateAdminCompanyRole(companyId, newRole);
      if (res.success) {
        setCompany((prev: any) => ({ ...prev, role: newRole }));
        showToast(`Role changed to ${newRole}`, "success");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to change role", "error");
    }
  };

  const generalInfo = [
    { label: "Industry", value: industry, type: "text" },
    { label: "MCP Subdomain", value: subdomain, type: "link" },
    { label: "Joined Date", value: joinedDate, type: "text" },
    { label: "API Endpoints", value: `${apis.length} Total`, type: "text" },
    { label: "Setup Status", value: onboardingStatus, type: "status" },
  ];

  return (
    <div className={s.companyDetailPage}>
      {/* ── Top header ── */}
      <div className={s.companyDetailHeader}>
        <div>
          {/* Back button */}
          <button className={s.backBtn} onClick={onBack}>
            <span className={`material-symbols-outlined ${s.backBtnIcon}`}>arrow_back</span>
            <span>Back to Companies</span>
          </button>

          {/* Company name + email */}
          <h2 className={s.companyDetailTitle}>
            {loading ? "Loading Tenant..." : companyName}
          </h2>
          <div className={s.companyDetailMeta}>
            <span>{companyEmail}</span>
            {company?.phone && <span> • {company.phone}</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className={s.companyDetailActions}>
          <button className={s.suspendBtn} onClick={handleRoleToggle}>
            {company?.role === "admin" ? "Demote to Company" : "Promote to Admin"}
          </button>
          <button
            className={s.deleteBtn}
            onClick={() => showToast("Tenant action requested", "info")}
          >
            Manage Status
          </button>
        </div>
      </div>

      {/* ── Main bento grid ── */}
      <div className={s.companyDetailGrid}>
        {/* ── Left column ── */}
        <div>
          {/* Profile Card */}
          <div className={s.profileCard}>
            <div className={s.profileCardGradient} />
            <div className={s.profileCardInner}>
              {/* Avatar */}
              <div className={s.profileAvatar}>
                <div className={s.profileAvatarInner}>
                  <span className={s.profileAvatarInitials}>{initials}</span>
                </div>
              </div>

              <h3 className={s.profileName}>{companyName}</h3>
              <p className={s.profileRole}>{plan} Member</p>

              <div className={s.profileBadges}>
                <span className={`${s.profileBadge} ${s.active}`}>{status}</span>
                <span className={`${s.profileBadge} ${s.tier}`}>{plan} Tier</span>
              </div>
            </div>
          </div>

          {/* General Information Card */}
          <div className={s.infoCard}>
            <h4 className={s.infoCardTitle}>General Information</h4>

            {generalInfo.map((row) => (
              <div key={row.label} className={s.infoRow}>
                <span className={s.infoLabel}>{row.label}</span>

                {row.type === "link" ? (
                  <span className={s.infoValueLink}>{row.value}</span>
                ) : row.type === "status" ? (
                  <div className={s.infoValueStatus}>
                    <span className={s.infoStatusDot} />
                    <span className={s.infoValue}>{row.value}</span>
                  </div>
                ) : (
                  <span className={s.infoValue}>{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div>
          <div className={s.apisCard}>
            {/* Card header */}
            <div className={s.apisCardHeader}>
              <div className={s.apisCardTitle}>
                <span className={`material-symbols-outlined ${s.apisCardTitleIcon}`}>api</span>
                Registered APIs ({apis.length})
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className={s.apisTable}>
                <thead>
                  <tr>
                    {["Name", "URL", "Method", "Auth", "Status"].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 4 ? "center" : "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apis.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                        No endpoints registered for this tenant yet.
                      </td>
                    </tr>
                  ) : (
                    apis.map((api, idx) => (
                      <tr key={`${api.name}-${idx}`}>
                        {/* Name */}
                        <td>
                          <span className={s.apiName}>{api.name}</span>
                        </td>

                        {/* URL */}
                        <td>
                          <code className={s.apiUrlCode}>{api.url}</code>
                        </td>

                        {/* Method */}
                        <td>
                          <span
                            className={`${s.methodBadge} ${
                              s[api.method.toLowerCase() as keyof typeof s] || s.post
                            }`}
                          >
                            {api.method}
                          </span>
                        </td>

                        {/* Auth */}
                        <td>
                          <span className={s.authLabel}>{api.auth}</span>
                        </td>

                        {/* Status */}
                        <td>
                          <div className={s.apiStatusCell}>
                            <span className={`${s.apiStatusDot} ${s[api.status] || s.active}`} />
                            <span className={`${s.apiStatusText} ${s[api.status] || s.active}`}>
                              {api.status === "active" ? "Active" : "Disabled"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={s.apisCardFooter}>
              <button className={s.viewAllBtn}>
                Total {apis.length} endpoint{apis.length === 1 ? "" : "s"} monitored
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                  keyboard_arrow_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailScreen;
