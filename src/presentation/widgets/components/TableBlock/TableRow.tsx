import React from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderArray } from "../../helper/RenderArray";
import { renderObject } from "../../helper/RenderObject";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import { renderUrl } from "../../helper/RenderUrl";
import styles from "../../../../styles/tableblock.module.css";
import type { TableRowProps } from "../../../../interfaces/mcp/tableblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

const formatTableCell = (val: unknown, field: FieldSchema): React.ReactNode => {
  if (val === null || val === undefined || val === "") {
    return "-";
  }

  if (field.type === "image") {
    return (
      <div style={{ width: "32px", height: "32px", borderRadius: "4px", overflow: "hidden" }}>
        {renderImage(val, field.label)}
      </div>
    );
  }

  if (field.type === "currency") {
    return renderCurrency(val);
  }

  if (field.type === "status") {
    return renderStatus(val);
  }

  if (field.type === "date" || field.type === "datetime") {
    return renderDate(val, field.type === "datetime");
  }

  if (field.type === "url") {
    return renderUrl(val);
  }

  if (field.type === "array") {
    return renderArray(val);
  }

  if (field.type === "object") {
    return renderObject(val);
  }

  if (typeof val === "number") {
    return val.toLocaleString();
  }

  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  return String(val);
};

export interface TableRowPropsWithActions extends TableRowProps {
  showActions?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  onEdit?: (record: unknown) => void;
  onDelete?: (record: unknown) => void;
  onView?: (record: unknown) => void;
}

export const TableRow: React.FC<TableRowPropsWithActions> = ({
  record,
  fields,
  showActions = false,
  canUpdate = false,
  canDelete = false,
  onEdit,
  onDelete,
  onView,
}) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  return (
    <tr className={styles.tr}>
      {fields.map((field) => {
        const val = getFieldValue(record, field);
        return (
          <td key={field.key} className={styles.td}>
            {formatTableCell(val, field)}
          </td>
        );
      })}

      {showActions && (
        <td className={styles.td}>
          <div className={styles.actionsCell}>
            <button
              type="button"
              className={styles.actionBtn}
              title="View Details"
              onClick={() => onView?.(record)}
            >
              👁️
            </button>
            {canUpdate && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.editBtn}`}
                title="Edit"
                onClick={() => onEdit?.(record)}
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                title="Delete"
                onClick={() => onDelete?.(record)}
              >
                🗑️
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};
