import React, { useState, useMemo } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import styles from "../../../styles/dashboardlayout.module.css";
import { useCartStore } from "../../../infrastructure/store/cartStore";
import { TableBlock } from "../components/TableBlock";
import { ChartBlock } from "../components/ChartsBlock/ChartBlock";

export const DashboardLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  data,
  records = [],
  fields = [],
  collection,
  capabilities,
  pagination,
  actions = [],
  audience,
  presentationPlan,
}) => {
  const entityName = String(
    collection?.entity || (data as any)?.entity || title || "",
  ).toLowerCase();

  // Check if this is an Admin / Analytics / Multi-entity Dashboard
  const hasCollectionMetrics = Boolean(
    collection?.metrics &&
      Array.isArray(collection.metrics) &&
      collection.metrics.length > 0,
  );

  const hasCollectionCharts = Boolean(
    collection?.charts &&
      Array.isArray(collection.charts) &&
      collection.charts.length > 0,
  );

  const isAdminDashboard =
    audience === "admin" ||
    hasCollectionMetrics ||
    hasCollectionCharts ||
    collection?.layout === "dashboard" ||
    /orders|sales|revenue|inventory|companies|users|fleet|cars|vehicles/.test(
      entityName,
    );

  // Extract user / account information for personal profile fallback
  const userRecord = useMemo(() => {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, any>;
      if (obj.user && typeof obj.user === "object") return obj.user;
      if (obj.email || obj.fullName || obj.name || obj.role) return obj;
    }
    if (records.length > 0) {
      const first = records[0] as Record<string, any>;
      if (first && (first.email || first.fullName || first.name || first.role)) {
        return first;
      }
    }
    return null;
  }, [data, records]);

  // Extract bookings list
  const bookingsList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, any>;
      if (Array.isArray(obj.bookings)) return obj.bookings;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.getorder)) return obj.getorder;
    }
    return records;
  }, [data, records]);

  // Customer Profile Tab States (Only used for customer personal profile mode)
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "profile">("overview");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(
    Boolean(userRecord?.mfaEnabled),
  );

  const setViewFullCart = useCartStore((state) => state.setViewFullCart);

  // --------------------------------------------------------------------------
  // 1. ADMIN / BUSINESS ANALYTICS DASHBOARD (Orders, Sales, Cars, Metrics)
  // --------------------------------------------------------------------------
  if (isAdminDashboard) {
    const applied = collection?.appliedQuery || {};
    const dateRangeStr =
      applied.datefrom && applied.dateto
        ? `${applied.datefrom} – ${applied.dateto}`
        : applied.date
          ? String(applied.date)
          : null;

    const metricsList = collection?.metrics || [];

    return (
      <div className={styles.adminDashboardContainer}>
        {/* Dashboard Header Bar */}
        <div className={styles.dashboardHeader}>
          <div className={styles.dashboardHeaderInfo}>
            <div className={styles.dashboardTitleRow}>
              <h2 className={styles.dashboardTitle}>
                {title || (collection?.entity ? `${collection.entity.toUpperCase()} Dashboard` : "Analytics Dashboard")}
              </h2>
              {audience === "admin" && (
                <span className={styles.adminBadge}>Admin Console</span>
              )}
            </div>
            <p className={styles.dashboardSubtitle}>
              {subtitle || "Live API response & management"}
            </p>
          </div>

          {dateRangeStr && (
            <div className={styles.dateRangeBadge}>
              <span>📅</span>
              <span>{dateRangeStr}</span>
            </div>
          )}
        </div>

        {/* KPI Metrics Cards Grid */}
        {metricsList.length > 0 && (
          <div className={styles.metricsGrid}>
            {metricsList.map((m, idx) => {
              const labelLower = m.label.toLowerCase();
              const icon = labelLower.includes("amount") || labelLower.includes("sales") || labelLower.includes("revenue")
                ? "💳"
                : labelLower.includes("order") || labelLower.includes("booking")
                  ? "📋"
                  : labelLower.includes("user") || labelLower.includes("customer")
                    ? "👥"
                    : labelLower.includes("car") || labelLower.includes("vehicle")
                      ? "🚗"
                      : "📊";

              return (
                <div key={`metric-${idx}`} className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <p className={styles.metricLabel}>{m.label}</p>
                    <div className={styles.metricIconBadge}>{icon}</div>
                  </div>
                  <p className={styles.metricValue}>{m.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Chart Block */}
        {hasCollectionCharts && (
          <div className={styles.chartSection}>
            <ChartBlock
              records={records}
              fields={fields}
              collection={collection}
            />
          </div>
        )}

        {/* Management Data Table Block */}
        {records.length > 0 && (
          <div className={styles.tableSection}>
            <TableBlock
              records={records}
              fields={fields}
              pagination={pagination}
              capabilities={capabilities}
              actions={actions}
              audience={audience}
              title={title}
            />
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. CUSTOMER PERSONAL ACCOUNT / PROFILE (Fallback for personal user query)
  // --------------------------------------------------------------------------
  const userName =
    userRecord?.fullName ||
    userRecord?.name ||
    userRecord?.username ||
    "Account User";
  const userEmail = userRecord?.email || "user@example.com";
  const userPhone = userRecord?.phone || "03001234567";
  const userRole = String(userRecord?.role || "USER").toUpperCase();
  const userStatus = String(userRecord?.status || "Active");
  const joinedDate = userRecord?.createdAt
    ? new Date(userRecord.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "3 Sept 2026";

  const userInitial = (userName.charAt(0) || "U").toUpperCase();

  const totalBookingsCount = bookingsList.length;
  const activeBookingsCount = bookingsList.filter(
    (b: any) =>
      String(b.status).toUpperCase() === "CONFIRMED" ||
      String(b.status).toUpperCase() === "PENDING",
  ).length;

  const filteredBookings =
    bookingStatusFilter === "all"
      ? bookingsList
      : bookingsList.filter(
          (b: any) =>
            String(b.status).toLowerCase() === bookingStatusFilter.toLowerCase(),
        );

  return (
    <div className={styles.container}>
      {/* Left Navigation Sidebar */}
      <aside className={styles.sidebar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => setViewFullCart(false)}
        >
          &larr; Back to site
        </button>

        {/* User Snippet */}
        <div className={styles.userSnippet}>
          <div className={styles.avatarCircle}>{userInitial}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{userName}</p>
            <p className={styles.userEmail}>{userEmail}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navMenu}>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === "overview" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className={styles.navIcon}>📊</span>
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === "bookings" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <span className={styles.navIcon}>🗓️</span>
            <span>My Bookings</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === "profile" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className={styles.navIcon}>👤</span>
            <span>Profile</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainArea}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerText}>
                <h2 className={styles.title}>Overview</h2>
                <p className={styles.subtitle}>Your account at a glance</p>
              </div>
            </div>

            {/* Metric Cards */}
            <div className={styles.metricsRow}>
              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Active items</p>
                  <div className={styles.metricIconBadge}>🚗</div>
                </div>
                <p className={styles.metricValue}>{activeBookingsCount}</p>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Total records</p>
                  <div className={styles.metricIconBadge}>📋</div>
                </div>
                <p className={styles.metricValue}>{totalBookingsCount}</p>
              </div>
            </div>

            {/* Records Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Activity</h3>
                <button
                  type="button"
                  className={styles.sectionLink}
                  onClick={() => setActiveTab("bookings")}
                >
                  View all &rarr;
                </button>
              </div>

              {bookingsList.length === 0 ? (
                <div className={styles.emptyCard}>
                  <h4 className={styles.emptyTitle}>No activity yet</h4>
                  <p className={styles.emptyDesc}>
                    Your account has no recent activity recorded.
                  </p>
                </div>
              ) : (
                <div className={styles.bookingsList}>
                  {bookingsList.slice(0, 5).map((item: any, idx: number) => {
                    const itemTitle =
                      item.$title ||
                      item.name ||
                      item.username ||
                      item.title ||
                      `Item #${item.id || idx + 1}`;
                    const status = String(item.status || item.orderstatus || "Active").toUpperCase();

                    return (
                      <div key={`item-${idx}`} className={styles.bookingItemCard}>
                        <div className={styles.bookingMainInfo}>
                          <div className={styles.bookingCarIcon}>📄</div>
                          <div>
                            <p className={styles.bookingCarName}>{itemTitle}</p>
                          </div>
                        </div>

                        <div className={styles.bookingRight}>
                          <span className={styles.statusPillActive}>
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: BOOKINGS / RECORDS */}
        {activeTab === "bookings" && (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerText}>
                <h2 className={styles.title}>All Records</h2>
                <p className={styles.subtitle}>{bookingsList.length} total</p>
              </div>

              <select
                className={styles.statusSelect}
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                aria-label="Filter records by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <div className={styles.emptyCard}>
                <h4 className={styles.emptyTitle}>No records found</h4>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {filteredBookings.map((item: any, idx: number) => {
                  const itemTitle =
                    item.$title || item.name || item.username || `Record #${item.id || idx + 1}`;
                  const status = String(item.status || item.orderstatus || "Active").toUpperCase();

                  return (
                    <div key={`rec-item-${idx}`} className={styles.bookingItemCard}>
                      <div className={styles.bookingMainInfo}>
                        <div className={styles.bookingCarIcon}>📄</div>
                        <div>
                          <p className={styles.bookingCarName}>{itemTitle}</p>
                        </div>
                      </div>

                      <div className={styles.bookingRight}>
                        <span className={styles.statusPillActive}>{status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === "profile" && (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerText}>
                <h2 className={styles.title}>Profile</h2>
                <p className={styles.subtitle}>Your personal details</p>
              </div>
            </div>

            <div className={styles.profileCard}>
              <div className={styles.profileAvatarSection}>
                <div className={styles.avatarLg}>{userInitial}</div>
                <div>
                  <h3 className={styles.profileHeaderName}>{userName}</h3>
                  <p className={styles.profileHeaderEmail}>{userEmail}</p>
                  <div className={styles.profileBadgesRow}>
                    <span className={`${styles.statusPill} ${styles.statusPillActive}`}>
                      {userStatus}
                    </span>
                    <span className={`${styles.statusPill} ${styles.statusPillDisabled}`}>
                      Role: {userRole}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel} htmlFor="prof-name">
                    Full name
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    className={styles.textInput}
                    defaultValue={userName}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel} htmlFor="prof-phone">
                    Phone
                  </label>
                  <input
                    id="prof-phone"
                    type="text"
                    className={styles.textInput}
                    defaultValue={userPhone}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.inputLabel} htmlFor="prof-email">
                    Email
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    className={styles.textInput}
                    value={userEmail}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Security / MFA */}
            <div className={styles.securityCard}>
              <div className={styles.securityHeader}>
                <span className={styles.securityIcon}>🛡️</span>
                <h4 className={styles.securityTitle}>Two-Factor Authentication</h4>
              </div>
              <div className={styles.securityStatusRow}>
                <span className={styles.inputLabel}>Status:</span>
                <span
                  className={`${styles.statusPill} ${
                    mfaEnabled ? styles.statusPillActive : styles.statusPillDisabled
                  }`}
                >
                  {mfaEnabled ? "Enabled" : "Disabled"}
                </span>

                <button
                  type="button"
                  className={`${styles.actionBtn} ${
                    mfaEnabled ? styles.mfaBtnActive : styles.mfaBtn
                  }`}
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                >
                  {mfaEnabled ? "Disable MFA" : "Enable MFA"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
