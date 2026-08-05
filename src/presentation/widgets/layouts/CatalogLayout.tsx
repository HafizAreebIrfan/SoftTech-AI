import React from "react";
import { WidgetBlock } from "../../../domain/entities/GenericWidget";
import { CardsBlock } from "../components/CardsBlock";
import { GalleryBlock } from "../components/GalleryBlock";
import { MetricBlock } from "../components/MetricBlock";
import { KeyValueBlock } from "../components/KeyValueBlock";

interface LayoutProps {
  title?: string;
  subtitle?: string;
  blocks: WidgetBlock[];
}

export const CatalogLayout: React.FC<LayoutProps> = ({
  title,
  subtitle,
  blocks = [],
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {(title || subtitle) && (
        <header>
          {title && (
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem", fontWeight: 700 }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.7 }}>
              {subtitle}
            </p>
          )}
        </header>
      )}

      {blocks.map((block, index) => {
        switch (block.type) {
          case "cards":
            return <CardsBlock key={index} cards={block.cards || []} title={block.title} />;
          case "gallery":
            return <GalleryBlock key={index} images={block.images || []} title={block.title} />;
          case "metrics":
            return <MetricBlock key={index} metrics={block.metrics || []} title={block.title} />;
          case "keyValue":
            return <KeyValueBlock key={index} keyValueItems={block.keyValueItems || []} title={block.title} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
