import React from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
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

  if (typeof val === "number") {
    return val.toLocaleString();
  }

  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  return String(val);
};

export const TableRow: React.FC<TableRowProps> = ({ record, fields }) => {
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
    </tr>
  );
};
