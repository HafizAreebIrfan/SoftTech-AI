import React from "react";
import { WidgetListItem, WidgetTone } from "../../../../domain/entities/GenericWidget";
import {
  CheckIcon,
  LockIcon,
  ServerIcon,
  SparklesIcon,
  BoltIcon,
  HelpIcon,
  KeyIcon,
  RocketIcon,
  DatabaseIcon,
  TerminalIcon
} from "../../../../assets/icons";
import styles from "../../../../styles/listblock.module.css";

interface ListBlockProps {
  listItems: WidgetListItem[];
  title?: string;
}

const toneClasses: Record<WidgetTone, string> = {
  default: styles.default,
  good: styles.good,
  warning: styles.warning,
  danger: styles.danger,
};

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  check: CheckIcon,
  lock: LockIcon,
  server: ServerIcon,
  sparkles: SparklesIcon,
  bolt: BoltIcon,
  help: HelpIcon,
  key: KeyIcon,
  rocket: RocketIcon,
  database: DatabaseIcon,
  terminal: TerminalIcon,
};

export const ListBlock: React.FC<ListBlockProps> = ({ listItems, title }) => {
  if (!listItems || listItems.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {title && <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text-primary)", marginBottom: "0.5rem" }}>{title}</h4>}
      <div className={styles.listContainer}>
        {listItems.map((item, index) => {
          const itemTone = item.tone || "default";
          const toneClass = toneClasses[itemTone] || styles.default;
          
          // Icon mapping
          const IconComp = item.icon ? iconMap[item.icon.toLowerCase()] : null;

          return (
            <div key={index} className={styles.listItem}>
              <div className={styles.itemContent}>
                {IconComp && (
                  <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <IconComp size={16} color={itemTone === "default" ? "var(--app-text-secondary)" : undefined} />
                  </div>
                )}
                <div className={styles.textGroup}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.description && <span className={styles.itemDesc}>{item.description}</span>}
                </div>
              </div>
              {item.meta && (
                <span className={`${styles.itemMeta} ${toneClass}`}>
                  {item.meta}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
