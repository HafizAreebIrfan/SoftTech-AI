import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, DatabaseIcon, TrendingDownIcon, TrendingUpIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/companyflow.module.css";
import CompanyShell from "../CompanyShell";

const ApiManagement: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const apis = [
    ["Product Search", "Active", "/v1/search/products", "GET"],
    ["Hotel Listings", "Failed", "/v1/hotels/listings", "GET"],
    ["Cart Checkout", "Active", "/v1/cart/checkout", "POST"],
    ["User Profile", "Active", "/v1/user/profile", "PATCH"],
  ];

  return (
    <CompanyShell active="api">
      <div className={styles.content}>
        <section className={styles.pageHeader}>
          <h1 className={styles.title}>API Management</h1>
          <p className={styles.subtitle}>
            Monitor and manage your registered endpoints in real-time.
          </p>
        </section>

        <section className={styles.statsGrid}>
          {[
            ["Active APIs", "5", "Running normally", CheckIcon],
            ["Failed / Not Running", "1", "Needs attention", TrendingDownIcon],
            ["Success Rate", "93.1%", "Last 30 days", TrendingUpIcon],
            ["Failure Rate", "6.9%", "Avg. latency: 142ms", DatabaseIcon],
          ].map(([label, value, badge, Icon], index) => (
            <article className={styles.statCard} key={label as string}>
              <div className={styles.statTop}>
                <div className={styles.iconBadge}>
                  <Icon size={20} color={index === 1 ? colors.WarningText : colors.TextGradientOne} />
                </div>
              </div>
              <p className={styles.statLabel}>{label as string}</p>
              <h3 className={styles.statValue}>{value as string}</h3>
              <p className={styles.subtitle} style={{ fontSize: 12 }}>{badge as string}</p>
            </article>
          ))}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Registered Endpoints</h3>
            <button
              className={styles.primaryButton}
              onClick={() => navigate({ to: "/company_analytics" })}
              type="button"
            >
              View Analytics
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>API Name</th>
                  <th>Status</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apis.map(([name, status, endpoint, method]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>
                      <span className={status === "Active" ? styles.status : styles.statusError}>
                        {status}
                      </span>
                    </td>
                    <td><code className={styles.code}>{endpoint}</code></td>
                    <td><span className={styles.method}>{method}</span></td>
                    <td>...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </CompanyShell>
  );
};

export default ApiManagement;
