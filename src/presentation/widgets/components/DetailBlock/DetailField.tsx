import React from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderNumber } from "../../helper/RenderNumber";
import { renderDate } from "../../helper/RenderDate";
import { renderStatus } from "../../helper/RenderStatus";
import { renderBoolean } from "../../helper/RenderBoolean";
import { renderUrl } from "../../helper/RenderUrl";
import { renderImage } from "../../helper/RenderImage";
import { renderArray } from "../../helper/RenderArray";
import { renderObject } from "../../helper/RenderObject";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailFieldProps } from "../../../../interfaces/mcp/detailblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

const formatDetailValue = (val: unknown, type: FieldSchema["type"]): React.ReactNode => {
  if (val === null || val === undefined || val === "") {
    return "-";
  }

  switch (type) {
    case "currency":
      return renderCurrency(val);
    case "number":
      return renderNumber(val);
    case "date":
      return renderDate(val, false);
    case "datetime":
      return renderDate(val, true);
    case "status":
      return renderStatus(val);
    case "boolean":
      return renderBoolean(val);
    case "url":
      return renderUrl(val);
    case "image":
      return renderImage(val, "Image");
    case "array":
      return renderArray(val);
    case "object":
      return renderObject(val);
    default:
      return typeof val === "object" ? JSON.stringify(val) : String(val);
  }
};

export const DetailField: React.FC<DetailFieldProps> = ({ field, record }) => {
  const value = getFieldValue(record, field);

  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{field.label}</span>
      <div className={styles.fieldValue}>
        {formatDetailValue(value, field.type)}
      </div>
    </div>
  );
};
