import { FC } from "react";
import { CheckIcon, KeyIcon, LockIcon, SlidersIcon, UserIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/companyflow.module.css";
import CompanyShell from "../CompanyShell";

const Profile: FC = () => {
  const { colors } = useThemeStore();

  return (
    <CompanyShell active="profile">
      <div className={styles.content}>
        <section className={styles.pageHeader}>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>
            Manage your interstellar organization identity and security protocols.
          </p>
        </section>

        <section className={styles.profileGrid}>
          <article className={`${styles.panel} ${styles.panelPad}`}>
            <div className={styles.profileHero}>
              <div className={styles.profileAvatar}>AC</div>
              <div>
                <h2 className={styles.panelTitle} style={{ fontSize: "1.6rem" }}>Acme Corp</h2>
                <p className={styles.subtitle}>admin@acme.com</p>
              </div>
            </div>
            {[
              ["Industry", "Technology & AI"],
              ["Subdomain", "acme.softtechai.com"],
              ["Plan", "Pro Plan"],
              ["Status", "Active"],
              ["Member Since", "October 2024"],
            ].map(([label, value]) => (
              <div className={styles.detailRow} key={label}>
                <span className={styles.detailLabel}>{label}</span>
                <span style={{ color: label === "Subdomain" ? colors.TextGradientOne : colors.TextOverlay, fontWeight: 700 }}>
                  {value}
                </span>
              </div>
            ))}
          </article>

          <aside className={styles.settingsList}>
            {[
              ["Change Password", "Update via OTP", LockIcon],
              ["Terms & Conditions", "Read platform terms", KeyIcon],
              ["Billing & Subscription", "Manage plan and invoices", SlidersIcon],
              ["Account Verified", "Security protocols active", CheckIcon],
            ].map(([title, copy, Icon]) => (
              <button className={styles.settingCard} key={title as string} type="button">
                <div className={styles.iconBadge}>
                  <Icon size={22} color={colors.TextGradientOne} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className={styles.panelTitle} style={{ fontSize: "1rem" }}>{title as string}</h3>
                  <p className={styles.subtitle} style={{ fontSize: 12 }}>{copy as string}</p>
                </div>
                <UserIcon size={16} color={colors.FooterText} />
              </button>
            ))}
          </aside>
        </section>
      </div>
    </CompanyShell>
  );
};

export default Profile;
