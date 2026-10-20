import React, { useState, useEffect, useMemo } from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";
import { getAdminAllCompanies, AdminCompanyItem } from "../../../../../adapters/api/adminApi";

/* ──────────────────────────────────────
   Types
────────────────────────────────────── */
interface CompanyDisplayItem {
  id: string;
  name: string;
  email: string;
  industry: string;
  plan: "Enterprise" | "Pro" | "Starter";
  apis: number;
  joinedDate: string;
  status: "Active" | "Suspended";
  avatarBg: string;
  avatarColor: string;
  logoUrl?: string;
}

interface CompaniesTabProps {
  onAddCompany?: () => void;
  onViewCompany?: (id: string) => void;
}

/* ──────────────────────────────────────
   Fallback mock data (for offline/initial state)
────────────────────────────────────── */
const FALLBACK_COMPANIES: CompanyDisplayItem[] = [
  {
    id: "quantum-dyn",
    name: "Quantum Dynamics",
    email: "ops@quantum.io",
    industry: "FinTech",
    plan: "Enterprise",
    apis: 24,
    joinedDate: "Oct 12, 2023",
    status: "Active",
    avatarBg: "#1a1a2e",
    avatarColor: "#818cf8",
  },
  {
    id: "nebula-sys",
    name: "Nebula Systems",
    email: "dev@nebula.ai",
    industry: "Cloud Infrastructure",
    plan: "Pro",
    apis: 8,
    joinedDate: "Jan 05, 2024",
    status: "Active",
    avatarBg: "#1a1a2e",
    avatarColor: "#a88cfb",
  },
  {
    id: "apex-core",
    name: "Apex Core",
    email: "contact@apex.co",
    industry: "Cybersecurity",
    plan: "Starter",
    apis: 3,
    joinedDate: "Mar 22, 2024",
    status: "Suspended",
    avatarBg: "#1a1a2e",
    avatarColor: "#64748b",
  },
  {
    id: "solaris-health",
    name: "Solaris Health",
    email: "admin@solaris.med",
    industry: "Healthcare",
    plan: "Enterprise",
    apis: 15,
    joinedDate: "Apr 01, 2024",
    status: "Active",
    avatarBg: "#1a1a2e",
    avatarColor: "#9fa7ff",
  },
];

const AVATAR_COLORS = ["#818cf8", "#a88cfb", "#64748b", "#9fa7ff", "#38bdf8", "#34d399", "#f472b6"];

function normalizePlan(rawPlan?: string): "Enterprise" | "Pro" | "Starter" {
  if (!rawPlan) return "Starter";
  const lower = rawPlan.toLowerCase();
  if (lower.includes("enterprise") || lower.includes("tier 3") || lower.includes("ultimate")) return "Enterprise";
  if (lower.includes("pro") || lower.includes("tier 2") || lower.includes("premium")) return "Pro";
  return "Starter";
}

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

const PLAN_CLASS: Record<string, string> = {
  Enterprise: "enterprise",
  Pro: "pro",
  Starter: "starter",
};

const ITEMS_PER_PAGE = 8;

/* ──────────────────────────────────────
   Component
────────────────────────────────────── */
const CompaniesTab: React.FC<CompaniesTabProps> = ({ onAddCompany, onViewCompany }) => {
  const { colors } = useThemeStore();
  const [companies, setCompanies] = useState<CompanyDisplayItem[]>(FALLBACK_COMPANIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await getAdminAllCompanies();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: CompanyDisplayItem[] = res.data.map((c: AdminCompanyItem, index: number) => {
            const id = (c.id || c._id || `co-${index}`).toString();
            const name = c.companyName || c.name || "Unnamed Company";
            const email = c.email || "no-email@softtech.ai";
            const industry = c.industry || "Technology";
            const plan = normalizePlan(c.currentPlan || c.plan);
            const apisCount = Array.isArray(c.apis) ? c.apis.length : (c.apisCount ?? c.apiCount ?? 0);
            const joinedDate = formatDate(c.createdAt);
            const isSuspended = (c.status || "").toLowerCase().includes("suspend");
            const status: "Active" | "Suspended" = isSuspended ? "Suspended" : "Active";
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

            return {
              id,
              name,
              email,
              industry,
              plan,
              apis: apisCount,
              joinedDate,
              status,
              avatarBg: "#1a1a2e",
              avatarColor,
            };
          });
          setCompanies(mapped);
        }
      } catch (err) {
        console.warn("Failed to load admin all companies, using fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered companies
  const filtered = useMemo(() => {
    return companies.filter((co) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        co.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        co.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        co.industry.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan =
        planFilter === "all" || co.plan.toLowerCase() === planFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || co.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [companies, searchQuery, planFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Dynamic summary metrics
  const totalOrgs = companies.length;
  const enterpriseCount = companies.filter((c) => c.plan === "Enterprise").length;
  const totalApis = companies.reduce((acc, c) => acc + c.apis, 0);

  return (
    <div className={s.contentCanvas}>
      {/* ── Page header ── */}
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Companies</h2>
          <p className={s.pageSubtitle}>
            <span className={s.pulseDot} />
            {loading ? "Refreshing..." : `${totalOrgs} total registered organizations`}
          </p>
        </div>

        <div className={s.pageActions}>
          <div style={{ position: "relative" }}>
            <button
              className={s.filterBtn}
              onClick={() => setShowFilterMenu((prev) => !prev)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>filter_list</span>
              {planFilter !== "all" || statusFilter !== "all" ? "Filtered" : "Filter"}
            </button>

            {showFilterMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  zIndex: 40,
                  background: "#101322",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "1rem",
                  width: "220px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                    Plan
                  </label>
                  <select
                    value={planFilter}
                    onChange={(e) => {
                      setPlanFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "#0c0e17",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="all">All Plans</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Pro">Pro</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "#0c0e17",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setPlanFilter("all");
                    setStatusFilter("all");
                    setShowFilterMenu(false);
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#818cf8",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textAlign: "right",
                    marginTop: "4px",
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          <button className={s.addBtn} onClick={onAddCompany}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>add</span>
            Add Company
          </button>
        </div>
      </div>

      {/* ── Search Input ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            position: "relative",
            maxWidth: "420px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              left: "14px",
              color: "#64748b",
              fontSize: "1.2rem",
              pointerEvents: "none",
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search companies by name, email, industry..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "10px 14px 10px 42px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              color: "#f8fafc",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Metrics bento row ── */}
      <div className={s.metricsGrid}>
        {/* Growth Rate / Active Orgs */}
        <div className={s.metricCard}>
          <span className={`material-symbols-outlined ${s.metricCardBg}`}>trending_up</span>
          <span className={s.metricCardLabel}>Registered Orgs</span>
          <div className={s.metricCardBottom}>
            <span className={s.metricCardValue}>{totalOrgs}</span>
            <span className={`${s.metricCardSub} ${s.primary}`}>Verified Tenants</span>
          </div>
        </div>

        {/* Active Enterprise */}
        <div className={s.metricCard}>
          <span className={`material-symbols-outlined ${s.metricCardBg}`}>star</span>
          <span className={s.metricCardLabel}>Enterprise Tier</span>
          <div className={s.metricCardBottom}>
            <span className={s.metricCardValue}>{enterpriseCount}</span>
            <span className={`${s.metricCardSub} ${s.muted}`}>Tier 1 Partners</span>
          </div>
        </div>

        {/* Total API Traffic / Endpoints */}
        <div className={s.metricCard}>
          <span className={`material-symbols-outlined ${s.metricCardBg}`}>api</span>
          <span className={s.metricCardLabel}>Active Endpoints</span>
          <div className={s.metricCardBottom}>
            <span className={s.metricCardValue}>{totalApis}</span>
            <span className={`${s.metricCardSub} ${s.secondary}`}>Connected APIs</span>
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
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    No organizations match the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((co) => (
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
                      <span className={`${s.planBadgeLg} ${s[PLAN_CLASS[co.plan] as keyof typeof s] || s.starter}`}>
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
                        <span className={`${s.statusDotLg} ${s[co.status.toLowerCase() as keyof typeof s] || s.active}`} />
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={s.pagination}>
          <p className={s.paginationLabel}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} companies
          </p>
          <div className={s.paginationBtns}>
            <button
              className={s.paginationArrow}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`${s.paginationNum} ${n === currentPage ? s.paginationNumActive : ""}`}
              >
                {n}
              </button>
            ))}
            <button
              className={s.paginationArrow}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesTab;
