import React, { useMemo } from "react";
import { AssetItem } from "./AssetItem";
import styles from "../../../../styles/assetblock.module.css";
import type {
  AssetBlockProps,
  AssetItemData,
} from "../../../../interfaces/mcp/assetblock.interface";

export const AssetBlock: React.FC<AssetBlockProps> = ({ records = [] }) => {
  const assets = useMemo<AssetItemData[]>(() => {
    // Rely solely on the backend mapping!
    return records
      .filter((rec: any) => rec && rec.$image) // Only grab records with images
      .map((rec: any, idx) => ({
        id: rec.id || `asset-${idx}`,
        url: rec.$image,
        label: rec.$title || "Asset",
        alt: rec.$description || rec.$title || "Asset Image",
        kind: "image", // You can simplify kind detection or pass it in uiRole
      }));
  }, [records]);

  if (!assets || assets.length === 0) return null;

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
