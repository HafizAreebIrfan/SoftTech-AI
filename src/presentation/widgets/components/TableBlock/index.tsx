import React from "react";
import { WidgetTableRow, WidgetTableCell, WidgetTone } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/tableblock.module.css";

interface TableBlockProps {
  tableHeaders?: string[];
  tableRows: WidgetTableRow[];
  title?: string;
}

const toneClasses: Record<WidgetTone, string> = {
  default: styles.default,
  good: styles.good,
  warning: styles.warning,
  danger: styles.danger,
};

const isTableCell = (val: unknown): val is WidgetTableCell => {
  return val !== null && typeof val === "object" && "value" in val;
};

export const TableBlock: React.FC<TableBlockProps> = ({ tableHeaders, tableRows, title }) => {
  if (!tableRows || tableRows.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {title && <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text-primary)", marginBottom: "0.5rem" }}>{title}</h4>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          {tableHeaders && tableHeaders.length > 0 && (
            <thead>
              <tr>
                {tableHeaders.map((header, index) => (
                  <th key={index} className={styles.th}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.tr}>
                {row.map((cell, cellIndex) => {
                  let value: string | number = "";
                  let tone: WidgetTone = "default";

                  if (isTableCell(cell)) {
                    value = cell.value;
                    tone = cell.tone || "default";
                  } else {
                    value = cell as string | number;
                  }

                  const cellClass = toneClasses[tone] || styles.default;

                  return (
                    <td key={cellIndex} className={`${styles.td} ${cellClass}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
