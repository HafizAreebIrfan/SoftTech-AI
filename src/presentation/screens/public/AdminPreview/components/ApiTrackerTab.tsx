import React from "react";
import styles from "../../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../../hooks/usetheme";
import { ApiItem } from "../types";

interface ApiTrackerTabProps {
  apiSearchQuery: string;
  setApiSearchQuery: (q: string) => void;
  isAddApiOpen: boolean;
  setIsAddApiOpen: (open: boolean) => void;
  newApiName: string;
  setNewApiName: (name: string) => void;
  newApiMethod: "GET" | "POST" | "PUT" | "DELETE";
  setNewApiMethod: (method: "GET" | "POST" | "PUT" | "DELETE") => void;
  newApiUrl: string;
  setNewApiUrl: (url: string) => void;
  newApiEndpoint: string;
  setNewApiEndpoint: (path: string) => void;
  newApiAuth: string;
  setNewApiAuth: (auth: string) => void;
  handleAddApi: (e: React.FormEvent) => void;
  deleteApi: (id: string) => void;
  filteredApis: ApiItem[];
}

const ApiTrackerTab: React.FC<ApiTrackerTabProps> = ({
  apiSearchQuery,
  setApiSearchQuery,
  isAddApiOpen,
  setIsAddApiOpen,
  newApiName,
  setNewApiName,
  newApiMethod,
  setNewApiMethod,
  newApiUrl,
  setNewApiUrl,
  newApiEndpoint,
  setNewApiEndpoint,
  newApiAuth,
  setNewApiAuth,
  handleAddApi,
  deleteApi,
  filteredApis
}) => {
  const { colors, isDark } = useThemeStore();

  const getMethodBadgeStyle = (method: "GET" | "POST" | "PUT" | "DELETE") => {
    switch (method) {
      case "GET":
        return {
          color: colors.BrandBlue,
          backgroundColor: isDark ? "rgba(37, 99, 235, 0.15)" : "rgba(37, 99, 235, 0.1)",
          borderColor: isDark ? "rgba(37, 99, 235, 0.3)" : "rgba(37, 99, 235, 0.2)"
        };
      case "POST":
        return {
          color: colors.BrandEmerald,
          backgroundColor: isDark ? "rgba(5, 150, 105, 0.15)" : "rgba(5, 150, 105, 0.1)",
          borderColor: isDark ? "rgba(5, 150, 105, 0.3)" : "rgba(5, 150, 105, 0.2)"
        };
      case "PUT":
        return {
          color: colors.RatingIconColor,
          backgroundColor: isDark ? "rgba(235, 212, 4, 0.15)" : "rgba(235, 212, 4, 0.1)",
          borderColor: isDark ? "rgba(235, 212, 4, 0.3)" : "rgba(235, 212, 4, 0.2)"
        };
      case "DELETE":
        return {
          color: colors.WarningText,
          backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"
        };
    }
  };

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🔌 Registered API Integrations</h2>
          <button
            className={styles.btnPrimary}
            style={{
              backgroundColor: colors.TextPrimary,
              color: colors.Background
            }}
            onClick={() => setIsAddApiOpen(true)}
          >
            + Add API Endpoint
          </button>
        </div>

        {/* Filter Search */}
        <div className={styles.formGroup}>
          <input
            type="text"
            className={styles.formInput}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              borderColor: colors.CardBorder,
              color: colors.TextPrimary
            }}
            placeholder="Search API Name, Base URL, or Endpoint..."
            value={apiSearchQuery}
            onChange={(e) => setApiSearchQuery(e.target.value)}
          />
        </div>

        {/* API list Table */}
        <div className={styles.tableContainer}>
          {filteredApis.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: colors.TextSecondary }}>
              No API endpoints matched your query.
            </div>
          ) : (
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th style={{ color: colors.TextSecondary }}>API Service</th>
                  <th style={{ color: colors.TextSecondary }}>Method</th>
                  <th style={{ color: colors.TextSecondary }}>Target URL</th>
                  <th style={{ color: colors.TextSecondary }}>Authentication</th>
                  <th style={{ color: colors.TextSecondary }}>Status</th>
                  <th style={{ color: colors.TextSecondary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.map(api => (
                  <tr key={api.id} style={{ borderBottomColor: colors.CardBorder }}>
                    <td style={{ fontWeight: "700", color: colors.TextPrimary }}>{api.name}</td>
                    <td>
                      <span className={styles.badge} style={getMethodBadgeStyle(api.method)}>
                        {api.method}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      <span style={{ color: colors.TextSecondary }}>{api.baseUrl}</span>
                      <span style={{ color: colors.TextPrimary, fontWeight: "600" }}>{api.endpoint}</span>
                    </td>
                    <td style={{ color: colors.TextPrimary }}>{api.authtype}</td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", color: colors.TextPrimary }}>
                        <span
                          className={styles.statusDot}
                          style={{
                            backgroundColor: api.status === "Active" ? colors.BrandEmerald : colors.RatingIconColor,
                            boxShadow: `0 0 8px ${api.status === "Active" ? colors.BrandEmerald : colors.RatingIconColor}`
                          }}
                        />
                        {api.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.btnSecondary}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                          borderColor: colors.WarningBorder,
                          color: colors.WarningText
                        }}
                        onClick={() => deleteApi(api.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* API ADDING MODAL */}
      {isAddApiOpen && (
        <div className={styles.modalOverlay}>
          <form
            className={styles.modalContent}
            style={{
              backgroundColor: colors.BackgroundSecondary,
              borderColor: colors.CardBorder
            }}
            onSubmit={handleAddApi}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "800",
                borderBottom: `1px solid ${colors.CardBorder}`,
                paddingBottom: "0.75rem",
                color: colors.TextPrimary
              }}
            >
              Register New API Endpoint
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>API Integration Name</label>
              <input
                type="text"
                className={styles.formInput}
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: colors.CardBorder,
                  color: colors.TextPrimary
                }}
                placeholder="e.g. Sales Inventory Database"
                value={newApiName}
                onChange={(e) => setNewApiName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>HTTP Request Method</label>
                <select
                  className={styles.formSelect}
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                    borderColor: colors.CardBorder,
                    color: colors.TextPrimary
                  }}
                  value={newApiMethod}
                  onChange={(e) => setNewApiMethod(e.target.value as any)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>Authentication Type</label>
                <select
                  className={styles.formSelect}
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                    borderColor: colors.CardBorder,
                    color: colors.TextPrimary
                  }}
                  value={newApiAuth}
                  onChange={(e) => setNewApiAuth(e.target.value)}
                >
                  <option value="None">None (Public)</option>
                  <option value="API Key">API Key Header</option>
                  <option value="Bearer Token">Bearer JWT Token</option>
                  <option value="OAuth2">OAuth 2.0 Credentials</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>Base Host URL</label>
              <input
                type="url"
                className={styles.formInput}
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: colors.CardBorder,
                  color: colors.TextPrimary
                }}
                placeholder="e.g. https://api.mycompany.com"
                value={newApiUrl}
                onChange={(e) => setNewApiUrl(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: colors.TextSecondary }}>Endpoint Path</label>
              <input
                type="text"
                className={styles.formInput}
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: colors.CardBorder,
                  color: colors.TextPrimary
                }}
                placeholder="e.g. /v2/inventory/items"
                value={newApiEndpoint}
                onChange={(e) => setNewApiEndpoint(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                type="button"
                className={styles.btnSecondary}
                style={{
                  borderColor: colors.CardBorder,
                  color: colors.TextSecondary
                }}
                onClick={() => setIsAddApiOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                style={{
                  backgroundColor: colors.TextPrimary,
                  color: colors.Background
                }}
              >
                Register API
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ApiTrackerTab;
