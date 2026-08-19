import React from "react";
import { renderImage } from "../../helper/RenderImage";
import styles from "../../../../styles/assetblock.module.css";
import type { AssetItemProps } from "../../../../interfaces/mcp/assetblock.interface";

export const AssetItem: React.FC<AssetItemProps> = ({ asset }) => {
  const kind = asset.kind || "image";

  const frameClass =
    kind === "avatar"
      ? styles.kindAvatar
      : kind === "logo"
      ? styles.kindLogo
      : kind === "icon"
      ? styles.kindIcon
      : styles.kindImage;

  return (
    <div className={styles.assetCard}>
      <div className={`${styles.mediaFrame} ${frameClass}`}>
        {renderImage(asset.url, asset.alt || asset.label || "Asset Image")}
      </div>

      {asset.label && (
        <span className={styles.assetLabel} title={asset.label}>
          {asset.label}
        </span>
      )}
    </div>
  );
};
