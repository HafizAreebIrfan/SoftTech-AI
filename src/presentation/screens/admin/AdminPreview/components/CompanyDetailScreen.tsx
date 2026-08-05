import React from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";

/* ──────────────────────────────────────
   Types
────────────────────────────────────── */
interface ApiEntry {
  name: string;
  url: string;
  method: "POST" | "GET" | "PATCH" | "DELETE";
  auth: string;
  status: "active" | "disabled";
}

interface CompanyDetailScreenProps {
  onBack?: () => void;
}

/* ──────────────────────────────────────
   Static mock – matches company_detail_refined
────────────────────────────────────── */
const COMPANY_NAME = "Quantum Leap Technologies";
const COMPANY_EMAIL = "contact@quantumleap.tech";
const COMPANY_INITIALS = "QL";

const GENERAL_INFO = [
  { label: "Industry",       value: "Artificial Intelligence",  type: "text" },
  { label: "Subdomain",      value: "quantum.softtech.ai",      type: "link" },
  { label: "Joined Date",    value: "Oct 12, 2023",             type: "text" },
  { label: "API Endpoints",  value: "14 Total",                 type: "text" },
  { label: "Setup Status",   value: "Complete",                 type: "status" },
];

const API_ENTRIES: ApiEntry[] = [
  { name: "User Authentication", url: "/api/v1/auth/login",      method: "POST",   auth: "Bearer Token", status: "active" },
  { name: "Data Streamer",        url: "/api/v1/stream/realtime", method: "GET",    auth: "OAuth 2.0",    status: "active" },
  { name: "Profile Updater",      url: "/api/v1/user/update",     method: "PATCH",  auth: "Bearer Token", status: "disabled" },
  { name: "Asset Manager",        url: "/api/v1/assets/batch",    method: "DELETE", auth: "API Key",       status: "active" },
];

/* ──────────────────────────────────────
   Component
────────────────────────────────────── */
const CompanyDetailScreen: React.FC<CompanyDetailScreenProps> = ({ onBack }) => {
  const { colors } = useThemeStore();

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
          <h2 className={s.companyDetailTitle}>{COMPANY_NAME}</h2>
          <div className={s.companyDetailMeta}>
            <span>{COMPANY_EMAIL}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className={s.companyDetailActions}>
          <button className={s.suspendBtn}>Suspend</button>
          <button className={s.deleteBtn}>Delete</button>
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
                  <span className={s.profileAvatarInitials}>{COMPANY_INITIALS}</span>
                </div>
              </div>

              <h3 className={s.profileName}>Quantum Leap</h3>
              <p className={s.profileRole}>Enterprise Member</p>

              <div className={s.profileBadges}>
                <span className={`${s.profileBadge} ${s.active}`}>Active</span>
                <span className={`${s.profileBadge} ${s.tier}`}>Tier 3 Plan</span>
              </div>
            </div>
          </div>

          {/* General Information Card */}
          <div className={s.infoCard}>
            <h4 className={s.infoCardTitle}>General Information</h4>

            {GENERAL_INFO.map((row) => (
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
                Registered APIs
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className={s.apisTable}>
                <thead>
                  <tr>
                    {["Name", "URL", "Method", "Auth", "Status"].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 4 ? "center" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {API_ENTRIES.map((api) => (
                    <tr key={api.name}>
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
                        <span className={`${s.methodBadge} ${s[api.method.toLowerCase() as keyof typeof s]}`}>
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
                          <span className={`${s.apiStatusDot} ${s[api.status]}`} />
                          <span className={`${s.apiStatusText} ${s[api.status]}`}>
                            {api.status === "active" ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={s.apisCardFooter}>
              <button className={s.viewAllBtn}>
                View all 14 endpoints
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>keyboard_arrow_down</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailScreen;
