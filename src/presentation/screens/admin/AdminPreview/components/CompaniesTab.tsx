import React from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";

/* ──────────────────────────────────────
   Types
────────────────────────────────────── */
interface Company {
  id: string;
  name: string;
  email: string;
  industry: string;
  plan: "Enterprise" | "Pro" | "Starter";
  apis: number;
  joinedDate: string;
  status: "Active" | "Suspended";
  /** Placeholder avatar color (indigo/purple/silver) */
  avatarBg: string;
  avatarColor: string;
  logoUrl?: string;
}

interface CompaniesTabProps {
  onAddCompany?: () => void;
  onViewCompany?: (id: string) => void;
}

/* ──────────────────────────────────────
   Mock data – matches the design exactly
────────────────────────────────────── */
const COMPANIES: Company[] = [
  {
    id: "1",
    name: "Quantum Dynamics",
    email: "ops@quantum.io",
    industry: "FinTech",
    plan: "Enterprise",
    apis: 24,
    joinedDate: "Oct 12, 2023",
    status: "Active",
    avatarBg: "#1a1a2e",
    avatarColor: "#818cf8",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA30Yvx0CxnGs5XAv8NVBbTF5FYggkJzxplALhAJfawu8z962LPapFcxm5XmyXPvrOiHFDVyqox2JUOD5j8xEV8X2X9x7WBLa-_CPS1XqakR2UjobBU6-6oJ-WhldHiBpSBRpVNUyo9cnnnHAYn1svfqRQ59h3y_NDMKesamnaNBeta7erhoRjtxd5thDneIKEODHDMz2yoo6FvhFT2zwTcXRrJYVCCZKf_imj60FdqNTr-ijnwrnu40MoxtiQgvg3yP7fY5U0GFOs",
  },
  {
    id: "2",
    name: "Nebula Systems",
    email: "dev@nebula.ai",
    industry: "Cloud Infrastructure",
    plan: "Pro",
    apis: 8,
    joinedDate: "Jan 05, 2024",
    status: "Active",
    avatarBg: "#1a1a2e",
    avatarColor: "#a88cfb",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEkLGtSEFheZKp0OODBKN9hi4QryH6MRqnNq_JbEdD2qbXUvJrFjPw1lGMV9MHo616V5rTvf2BR84TiEg7DcejB3vvmFx_vj-2VpqylHsqVHXv-wZY6Dnmr6fZCCUmhta-E9F5Ddph5IGda_sUMH3r1KqR245VugaSTT9ydyAvL7nbf9D78x0X_Vr6SWP5bXSnKXR5R6Atvx4YlCTx7M8gQ-da-pq44rG-b_kK2dOozVbbxRbIvNrwZZfF0-5usJjhaK8k-r7tlIY",
  },
  {
    id: "3",
    name: "Apex Core",
    email: "contact@apex.co",
    industry: "Cybersecurity",
    plan: "Starter",
    apis: 3,
    joinedDate: "Mar 22, 2024",
    status: "Suspended",
    avatarBg: "#1a1a2e",
    avatarColor: "#64748b",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDErKQj_DeO-yKR5n2l6_w_6ph3sOnQJnjLF8nI9fMQ-XPEcwy5Ppf_ORobFt08AIDLHxHqEHitx4wQgSGCQrFX5ThzKTWl6FIbxmIUmUKE2XsgOhgrSNerufddIq-qQuQ99RRZVP9iRqr_DjV8hXQ7DZRAq-hmY-RFQaTjbzns_ZAHUb7Rl2JIJM_r7F4Qv9tduTWblWBiAyq8nhzrwaibbQBEocYc76Qo1EebQmC45_u2vtkWgUbnT5S3wLiKstp_2OMqz59uklI",
  },
  {
    id: "4",
    name: "Solaris Health",
    email: "admin@solaris.med",
    industry: "Healthcare",
    plan: "Enterprise",
    apis: 15,
    joinedDate: "Apr 01, 2024",
    status: "Active",
    avatarBg: "#1a1a2e",
    avatarColor: "#9fa7ff",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9yxgHO--X-2Yy79PAdpRt4p55LtkiReuKd891KPCbTjQf7IbyYQYaRzlOQ7ofYeyUtWk4KKhSTJmYi1FXYKbFs4K3ajcc7vx5eLeKDMnfwn5VwXRg_dNYFl3c30_xdx42p0Wmm89RtoO4qCCt4lT7Kh2AMrLPTWiUs54gC2SsFrfF_jkLPAujkyzWaNz6W-eP3QXnKZWw9Mh07oHV3HUlahzFqqvWCR71_SGLxuZeeNjd0iSkr_7lBhlkyam3r4Y8_zhhITQBm-I",
  },
];

const PLAN_CLASS: Record<string, string> = {
  Enterprise: "enterprise",
  Pro: "pro",
  Starter: "starter",
};

/* ──────────────────────────────────────
   Component
────────────────────────────────────── */
const CompaniesTab: React.FC<CompaniesTabProps> = ({ onAddCompany, onViewCompany }) => {
  const { colors } = useThemeStore();

  return (
    <div className={s.contentCanvas}>
      {/* ── Page header ── */}
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Companies</h2>
          <p className={s.pageSubtitle}>
            <span className={s.pulseDot} />
            128 total registered organizations
          </p>
        </div>

        <div className={s.pageActions}>
          <button className={s.filterBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>filter_list</span>
            Filter
          </button>
          <button className={s.addBtn} onClick={onAddCompany}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>add</span>
            Add Company
          </button>
        </div>
      </div>

      {/* ── Metrics bento row ── */}
      <div className={s.metricsGrid}>
        {/* Growth Rate */}
        <div className={s.metricCard}>
          <span className={`material-symbols-outlined ${s.metricCardBg}`}>trending_up</span>
          <span className={s.metricCardLabel}>Growth Rate</span>
          <div className={s.metricCardBottom}>
            <span className={s.metricCardValue}>+24%</span>
            <span className={`${s.metricCardSub} ${s.primary}`}>vs last month</span>
          </div>
        </div>

        {/* Active Enterprise */}
        <div className={s.metricCard}>
          <span className={`material-symbols-outlined ${s.metricCardBg}`}>star</span>
          <span className={s.metricCardLabel}>Active Enterprise</span>
          <div className={s.metricCardBottom}>
            <span className={s.metricCardValue}>42</span>
            <span className={`${s.metricCardSub} ${s.muted}`}>Tier 1 Partners</span>
          </div>
        </div>

        {/* Total API Traffic */}
        <div className={s.metricCard}>
          <span className={`material-symbols-outlined ${s.metricCardBg}`}>api</span>
          <span className={s.metricCardLabel}>Total API Traffic</span>
          <div className={s.metricCardBottom}>
            <span className={s.metricCardValue}>1.2M</span>
            <span className={`${s.metricCardSub} ${s.secondary}`}>Requests / hr</span>
          </div>
        </div>
      </div>

      {/* ── Full companies table ── */}
      <div className={s.companiesTableCard}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr className={s.companiesTableHead}>
                {["Company", "Industry", "Plan", "APIs", "Joined Date", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Actions" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {COMPANIES.map((co) => (
                <tr key={co.id} className={s.companiesTableRow}>
                  {/* Company cell */}
                  <td style={{ padding: "1.5rem 2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div className={s.companyLogoLg}>
                        {co.logoUrl ? (
                          <img src={co.logoUrl} alt={co.name} />
                        ) : (
                          <span style={{ fontWeight: 700, color: co.avatarColor, fontSize: "0.75rem" }}>
                            {co.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={s.companyNameLg}>{co.name}</p>
                        <p className={s.companyEmail}>{co.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Industry */}
                  <td style={{ padding: "1.5rem 2rem", color: colors.TextSecondary, fontSize: "0.875rem", fontWeight: 500 }}>
                    {co.industry}
                  </td>

                  {/* Plan badge */}
                  <td style={{ padding: "1.5rem 2rem" }}>
                    <span className={`${s.planBadgeLg} ${s[PLAN_CLASS[co.plan] as keyof typeof s]}`}>
                      {co.plan}
                    </span>
                  </td>

                  {/* APIs */}
                  <td style={{ padding: "1.5rem 2rem", color: colors.TextPrimary, fontWeight: 500 }}>
                    {co.apis}
                  </td>

                  {/* Joined date */}
                  <td style={{ padding: "1.5rem 2rem", color: "#64748b", fontSize: "0.875rem" }}>
                    {co.joinedDate}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "1.5rem 2rem" }}>
                    <div className={s.statusBadge}>
                      <span className={`${s.statusDotLg} ${s[co.status.toLowerCase() as keyof typeof s]}`} />
                      <span className={co.status === "Active" ? s.statusTextActive : s.statusTextSuspended}>
                        {co.status}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "1.5rem 2rem", textAlign: "right" }}>
                    <button
                      className={s.visibilityBtn}
                      onClick={() => onViewCompany?.(co.id)}
                      title={`View ${co.name}`}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={s.pagination}>
          <p className={s.paginationLabel}>Showing 1 to 10 of 128 companies</p>
          <div className={s.paginationBtns}>
            <button className={s.paginationArrow} disabled>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_left</span>
            </button>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`${s.paginationNum} ${n === 1 ? s.paginationNumActive : ""}`}
              >
                {n}
              </button>
            ))}
            <span className={s.paginationEllipsis}>...</span>
            <button className={s.paginationNum}>13</button>
            <button className={s.paginationArrow}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesTab;
