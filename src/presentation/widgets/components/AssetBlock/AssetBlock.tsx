import React, { useMemo } from "react";
import { getFieldValue, getValue } from "../../../../utils/schema/getValue";
import { AssetItem } from "./AssetItem";
import styles from "../../../../styles/assetblock.module.css";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import type {
  AssetBlockProps,
  AssetItemData,
  AssetKind,
} from "../../../../interfaces/mcp/assetblock.interface";

const inferAssetKind = (key: string, label: string, type: FieldSchema["type"]): AssetKind => {
  const text = `${key} ${label}`.toLowerCase();
  if (text.includes("avatar")) return "avatar";
  if (text.includes("logo")) return "logo";
  if (text.includes("icon") || text.includes("condition")) return "icon";
  if (text.includes("thumb")) return "thumbnail";
  return "image";
};

export const AssetBlock: React.FC<AssetBlockProps> = ({
  block,
  records = [],
  fields = [],
}) => {
  const assets = useMemo<AssetItemData[]>(() => {
    const activeFields =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    const imageFields = activeFields.filter(
      (f) =>
        !f.hidden &&
        (f.type === "image" ||
          /image|img|photo|avatar|logo|icon|thumbnail/.test(f.key.toLowerCase())),
    );

    const extractedAssets: AssetItemData[] = [];

    records.forEach((rec, recIdx) => {
      imageFields.forEach((field) => {
        const rawVal = getFieldValue(rec, field);
        if (typeof rawVal === "string" && rawVal.trim()) {
          const kind = inferAssetKind(field.key, field.label, field.type);
          const rawTitle =
            getValue(rec, "name") ||
            getValue(rec, "title") ||
            getValue(rec, "label") ||
            field.label;

          extractedAssets.push({
            id: `asset-${field.key}-${recIdx}`,
            url: rawVal.trim(),
            label: String(rawTitle),
            alt: `${field.label} for ${rawTitle}`,
            kind,
          });
        }
      });
    });

    return extractedAssets;
  }, [block?.fields, records, fields]);

  if (!assets || assets.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        {assets.map((asset) => (
          <AssetItem key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
};
