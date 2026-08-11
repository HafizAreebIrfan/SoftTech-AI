import { getFieldValue } from "../../../../utils/schema/getValue";

import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

import styles from "../../../../styles/fieldrenderer.module.css";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderNumber } from "../../helper/RenderNumber";
import { renderDate } from "../../helper/RenderDate";
import { renderBoolean } from "../../helper/RenderBoolean";
import { renderStatus } from "../../helper/RenderStatus";
import { renderEmail } from "../../helper/RenderEmail";
import { renderPhone } from "../../helper/RenderPhone";
import { renderUrl } from "../../helper/RenderUrl";
import { renderImage } from "../../helper/RenderImage";
import { renderCoordinate } from "../../helper/RenderCordinate";
import { renderObject } from "../../helper/RenderObject";
import { renderArray } from "../../helper/RenderArray";
import { renderText } from "../../helper/RenderText";

interface FieldRendererProps {
  record: unknown;
  field: FieldSchema;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  record,
  field,
}) => {
  const value = getFieldValue(record, field);

  return (
    <div className={styles.field}>
      <div className={styles.label}>{field.label}</div>

      <div className={styles.value}>{renderFieldValue(value, field.type)}</div>
    </div>
  );
};

const renderFieldValue = (
  value: unknown,
  type: FieldSchema["type"],
): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <span className={styles.emptyValue}>-</span>;
  }

  switch (type) {
    case "currency":
      return renderCurrency(value);

    case "number":
      return renderNumber(value);

    case "date":
      return renderDate(value, false);

    case "datetime":
      return renderDate(value, true);

    case "boolean":
      return renderBoolean(value);

    case "status":
      return renderStatus(value);

    case "email":
      return renderEmail(value);

    case "phone":
      return renderPhone(value);

    case "url":
      return renderUrl(value);

    case "image":
      return renderImage(value);

    case "latitude":
    case "longitude":
      return renderCoordinate(value);

    case "object":
      return renderObject(value);

    case "array":
      return renderArray(value);

    case "text":
    default:
      return renderText(value);
  }
};
