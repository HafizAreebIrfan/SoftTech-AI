import React, { useMemo } from "react";
import { CardItem } from "./CardItem";
import styles from "../../../../styles/cardsblock.module.css";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import type {
  CardsBlockProps,
  CardFieldMapping,
} from "../../../../interfaces/mcp/cardsblock.interface";

export const CardsBlock: React.FC<CardsBlockProps> = ({
  block,
  records = [],
  fields = [],
  maxItems,
  variant,
}) => {
  const displayRecords = useMemo(() => {
    const limit = maxItems || block?.maxItems;
    if (limit && limit > 0) {
      return records.slice(0, limit);
    }
    return records;
  }, [records, maxItems, block?.maxItems]);

  const fieldMapping = useMemo<CardFieldMapping>(() => {
    const availableFields =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    const activeFields = availableFields.filter((f) => !f.hidden);

    const imageField = activeFields.find((f) => f.type === "image");
    const statusField = activeFields.find((f) => f.type === "status");
    const priceField = activeFields.find((f) => f.type === "currency");

    const primaryFields = activeFields.filter((f) => f.primary);
    const titleField =
      primaryFields[0] ||
      activeFields.find((f) =>
        /title|name|label|entity/.test(f.key.toLowerCase()),
      ) ||
      activeFields.find((f) => f.type === "text");

    const subtitleField =
      primaryFields[1] ||
      activeFields.find(
        (f) =>
          f !== titleField &&
          /subtitle|category|type|description|location|company/.test(
            f.key.toLowerCase(),
          ),
      );

    const usedFields = new Set([
      imageField?.key,
      titleField?.key,
      subtitleField?.key,
      statusField?.key,
      priceField?.key,
    ].filter(Boolean));

    const secondaryFields = activeFields
      .filter((f) => !usedFields.has(f.key))
      .slice(0, 3);

    return {
      imageField,
      titleField,
      subtitleField,
      statusField,
      priceField,
      secondaryFields,
    };
  }, [block?.fields, fields]);

  if (!displayRecords || displayRecords.length === 0) {
    return null;
  }

  const activeVariant = variant || block?.variant;

  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        {displayRecords.map((record, index) => (
          <CardItem
            key={`card-${index}`}
            record={record}
            fields={fields}
            fieldMapping={fieldMapping}
            variant={activeVariant}
          />
        ))}
      </div>
    </section>
  );
};
