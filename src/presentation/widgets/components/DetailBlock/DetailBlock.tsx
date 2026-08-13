import React, { useMemo } from "react";
import { getValue, getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { DetailField } from "./DetailField";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

export const DetailBlock: React.FC<DetailBlockProps> = ({
  block,
  records = [],
  fields = [],
  collection,
}) => {
  const targetRecord = records.length > 0 ? records[0] : null;

  const { headerImage, title, subtitle, detailFields } = useMemo(() => {
    if (!targetRecord || typeof targetRecord !== "object") {
      return { headerImage: null, title: null, subtitle: null, detailFields: [] };
    }

    const activeFields =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    const nonHiddenFields = activeFields.filter((f) => !f.hidden);

    const imageField = nonHiddenFields.find((f) => f.type === "image");
    const rawImage = imageField
      ? getFieldValue(targetRecord, imageField)
      : getValue(targetRecord, "image") ||
        getValue(targetRecord, "avatar") ||
        getValue(targetRecord, "logo") ||
        getValue(targetRecord, "photo") ||
        getValue(targetRecord, "thumbnail");

    const primaryFields = nonHiddenFields.filter((f) => f.primary);
    const titleField =
      primaryFields[0] ||
      nonHiddenFields.find((f) =>
        /title|name|label|entity/.test(f.key.toLowerCase()),
      ) ||
      nonHiddenFields.find((f) => f.type === "text");

    const subtitleField =
      primaryFields[1] ||
      nonHiddenFields.find(
        (f) =>
          f !== titleField &&
          /subtitle|category|type|description|location|company|email/.test(
            f.key.toLowerCase(),
          ),
      );

    const rawTitle = titleField
      ? getFieldValue(targetRecord, titleField)
      : collection?.entity || "Details";

    const rawSubtitle = subtitleField
      ? getFieldValue(targetRecord, subtitleField)
      : null;

    const headerFieldKeys = new Set([
      imageField?.key,
      titleField?.key,
      subtitleField?.key,
    ].filter(Boolean));

    const detailFields = nonHiddenFields.filter(
      (f) => !headerFieldKeys.has(f.key) && f.type !== "image",
    );

    return {
      headerImage: rawImage ?? null,
      title: rawTitle !== undefined && rawTitle !== null ? String(rawTitle) : null,
      subtitle: rawSubtitle !== undefined && rawSubtitle !== null ? String(rawSubtitle) : null,
      detailFields,
    };
  }, [targetRecord, block?.fields, fields, collection?.entity]);

  if (!targetRecord) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        {(headerImage || title || subtitle) && (
          <header className={styles.header}>
            {headerImage && (
              <div className={styles.headerAvatar}>
                {renderImage(headerImage, title || "Detail Asset")}
              </div>
            )}

            <div className={styles.headerTitleGroup}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </header>
        )}

        <div className={styles.grid}>
          {detailFields.map((field) => (
            <DetailField
              key={field.key}
              field={field}
              record={targetRecord}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
