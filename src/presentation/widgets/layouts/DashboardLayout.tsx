import React, { useState, useMemo } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import styles from "../../../styles/dashboardlayout.module.css";
import { useCartStore } from "../../../infrastructure/store/cartStore";

export const DashboardLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  data,
  records = [],
  collection,
  audience,
}) => {
  // Extract user / account information from data or records
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
    }
    const entity = String(collection?.entity || title || "").toLowerCase();
    if (/booking|reservation|rental|\border\b/.test(entity)) {
      return records;
    }
    return [];
  }, [data, records, collection, title]);

  // Identify semantic mode
  const entityName = String(
    collection?.entity || (data as any)?.entity || title || "",
  ).toLowerCase();

  const isProfileRequest =
    /user|profile|account|member|\bme\b|customer/.test(entityName) ||
    Boolean(userRecord && !/booking|rental/.test(entityName));

  const isBookingsRequest =
    /booking|reservation|rental|\border\b/.test(entityName);

  // Tab State: "overview" | "bookings" | "profile"
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "profile">(
    () => {
      if (isProfileRequest) return "profile";
      if (isBookingsRequest) return "bookings";
      return "overview";
    },
  );

  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(
    Boolean(userRecord?.mfaEnabled),
  );

  // User details
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

  // Metrics calculation
  const totalBookingsCount = bookingsList.length || (userRecord ? 11 : 0);
  const activeBookingsCount = bookingsList.filter(
    (b: any) =>
      String(b.status).toUpperCase() === "CONFIRMED" ||
      String(b.status).toUpperCase() === "PENDING",
  ).length;

  const totalSpentFormatted = "Rs. 0";

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    if (bookingStatusFilter === "all") return bookingsList;
    return bookingsList.filter(
      (b: any) =>
        String(b.status).toLowerCase() === bookingStatusFilter.toLowerCase(),
    );
  }, [bookingsList, bookingStatusFilter]);

  const setViewFullCart = useCartStore((state) => state.setViewFullCart);

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
                <p className={styles.subtitle}>Your rentals at a glance</p>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className={styles.metricsRow}>
              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Upcoming rentals</p>
                  <div className={styles.metricIconBadge}>🚗</div>
                </div>
                <p className={styles.metricValue}>{activeBookingsCount}</p>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Total bookings</p>
                  <div className={styles.metricIconBadge}>📋</div>
                </div>
                <p className={styles.metricValue}>{totalBookingsCount}</p>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Total spent</p>
                  <div className={styles.metricIconBadge}>💳</div>
                </div>
                <p className={styles.metricValue}>{totalSpentFormatted}</p>
              </div>
            </div>

            {/* Recent Bookings Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent bookings</h3>
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
                  <h4 className={styles.emptyTitle}>No bookings yet</h4>
                  <p className={styles.emptyDesc}>
                    Browse cars and book your first rental.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => setViewFullCart(false)}
                  >
                    Browse cars &rarr;
                  </button>
                </div>
              ) : (
                <div className={styles.bookingsList}>
                  {bookingsList.slice(0, 3).map((item: any, idx: number) => {
                    const carName =
                      item.car?.name ||
                      item.carTitle ||
                      item.title ||
                      item.vehicle ||
                      `Booking #${item.id || idx + 1}`;
                    const pickup = item.pickupDate || item.startDate || "Upcoming";
                    const dropoff = item.returnDate || item.endDate || "";
                    const status = String(item.status || "CONFIRMED").toUpperCase();
                    const amount = item.totalAmount
                      ? `Rs. ${Number(item.totalAmount).toLocaleString()}`
                      : "Rs. 18,000";

                    return (
                      <div key={`booking-${idx}`} className={styles.bookingItemCard}>
                        <div className={styles.bookingMainInfo}>
                          <div className={styles.bookingCarIcon}>🚗</div>
                          <div>
                            <p className={styles.bookingCarName}>{carName}</p>
                            <p className={styles.bookingMetaRow}>
                              <span>
                                {pickup} {dropoff ? `– ${dropoff}` : ""}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className={styles.bookingRight}>
                          <span
                            className={`${styles.statusPill} ${
                              status === "CONFIRMED" || status === "ACTIVE"
                                ? styles.statusPillActive
                                : status === "PENDING"
                                  ? styles.statusPillPending
                                  : styles.statusPillCancelled
                            }`}
                          >
                            {status}
                          </span>
                          <span className={styles.bookingAmount}>{amount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Loyalty Perks Banner */}
            <div className={styles.loyaltyBanner}>
              <div className={styles.loyaltyStar}>⭐</div>
              <div className={styles.loyaltyContent}>
                <h4 className={styles.loyaltyTitle}>Earn loyalty perks</h4>
                <p className={styles.loyaltyDesc}>
                  Complete rentals to unlock discounts (up to 20%), free cancellation and priority support.
                </p>
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className={styles.feedCard}>
              <div className={styles.feedHeader}>
                <span className={styles.feedDot} />
                <span>Real-time Feed</span>
              </div>
              <p className={styles.feedEmptyText}>
                No recent activity — bookings and status updates will appear here in real-time.
              </p>
            </div>
          </>
        )}

        {/* TAB 2: MY BOOKINGS */}
        {activeTab === "bookings" && (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerText}>
                <h2 className={styles.title}>My bookings</h2>
                <p className={styles.subtitle}>{bookingsList.length} total</p>
              </div>

              <select
                className={styles.statusSelect}
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                aria-label="Filter bookings by status"
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <div className={styles.emptyCard}>
                <h4 className={styles.emptyTitle}>No bookings yet.</h4>
                <p className={styles.emptyDesc}>
                  You have not made any bookings yet. Browse our collection to reserve your first ride.
                </p>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setViewFullCart(false)}
                >
                  Browse cars &rarr;
                </button>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {filteredBookings.map((item: any, idx: number) => {
                  const carName =
                    item.car?.name ||
                    item.carTitle ||
                    item.title ||
                    item.vehicle ||
                    `Rental #${item.id || idx + 1}`;
                  const pickup = item.pickupDate || item.startDate || "Date specified";
                  const dropoff = item.returnDate || item.endDate || "";
                  const status = String(item.status || "CONFIRMED").toUpperCase();
                  const amount = item.totalAmount
                    ? `Rs. ${Number(item.totalAmount).toLocaleString()}`
                    : "Rs. 36,000";

                  return (
                    <div key={`booking-item-${idx}`} className={styles.bookingItemCard}>
                      <div className={styles.bookingMainInfo}>
                        <div className={styles.bookingCarIcon}>🚗</div>
                        <div>
                          <p className={styles.bookingCarName}>{carName}</p>
                          <p className={styles.bookingMetaRow}>
                            <span>
                              {pickup} {dropoff ? `– ${dropoff}` : ""}
                            </span>
                            {item.location && <span>• 📍 {item.location}</span>}
                          </p>
                        </div>
                      </div>

                      <div className={styles.bookingRight}>
                        <span
                          className={`${styles.statusPill} ${
                            status === "CONFIRMED" || status === "ACTIVE"
                              ? styles.statusPillActive
                              : status === "PENDING"
                                ? styles.statusPillPending
                                : styles.statusPillCancelled
                          }`}
                        >
                          {status}
                        </span>
                        <span className={styles.bookingAmount}>{amount}</span>
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

            {/* Profile Form Card */}
            <div className={styles.profileCard}>
              <div className={styles.profileAvatarSection}>
                <div className={styles.avatarLg}>{userInitial}</div>
                <div>
                  <h3 className={styles.profileHeaderName}>
                    {userName}
                  </h3>
                  <p className={styles.profileHeaderEmail}>
                    {userEmail}
                  </p>
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
                  <p className={styles.inputHelper}>
                    Email cannot be changed once verified.
                  </p>
                </div>
              </div>

              <div>
                <button type="button" className={styles.actionBtn}>
                  Save changes
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication Security Box */}
            <div className={styles.securityCard}>
              <div className={styles.securityHeader}>
                <span className={styles.securityIcon}>🛡️</span>
                <h4 className={styles.securityTitle}>Two-Factor Authentication</h4>
              </div>
              <p className={styles.securityDesc}>
                Add an extra layer of security to your account.
              </p>

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

            {/* Stats & Restrictions Card (Inspiration New Image 4) */}
            <div className={styles.metricsRow}>
              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Total bookings</p>
                  <div className={styles.metricIconBadge}>📋</div>
                </div>
                <p className={styles.metricValue}>{totalBookingsCount}</p>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Total spent</p>
                  <div className={styles.metricIconBadge}>💳</div>
                </div>
                <p className={styles.metricValue}>{totalSpentFormatted}</p>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <p className={styles.metricLabel}>Member since</p>
                  <div className={styles.metricIconBadge}>📅</div>
                </div>
                <p className={`${styles.metricValue} ${styles.metricValueSmall}`}>
                  {joinedDate}
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
