import React from "react";
import { WidgetBlock } from "../../../domain/entities/GenericWidget";
import { MetricBlock } from "../components/MetricBlock";
import { TableBlock } from "../components/TableBlock";
import { CardsBlock } from "../components/CardsBlock";
import { KeyValueBlock } from "../components/KeyValueBlock";
import { ListBlock } from "../components/ListBlock";
import { TimelineBlock } from "../components/TimelineBlock";
import { GalleryBlock } from "../components/GalleryBlock";
import { AlertBlock } from "../components/AlertBlock";
import { FormBlock } from "../components/FormBlock";

interface LayoutProps {
  title?: string;
  subtitle?: string;
  blocks: WidgetBlock[];
}

export const DashboardLayout: React.FC<LayoutProps> = ({
  title,
  subtitle,
  blocks = [],
}) => {
  const metricBlocks = blocks.filter((b) => b.type === "metrics");
  const otherBlocks = blocks.filter((b) => b.type !== "metrics");

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

      {/* Top Metrics Row */}
      {metricBlocks.map((b, idx) => (
        <MetricBlock key={idx} metrics={b.metrics || []} title={b.title} />
      ))}

      {/* Main Content Blocks */}
      {otherBlocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

const renderBlock = (block: WidgetBlock, index: number) => {
  switch (block.type) {
    case "table":
      return (
        <TableBlock
          key={index}
          columns={block.columns}
          rows={block.rows}
          tableHeaders={block.tableHeaders}
          tableRows={block.tableRows}
          title={block.title}
          pagination={block.pagination}
        />
      );
    case "cards":
      return <CardsBlock key={index} cards={block.cards || []} title={block.title} />;
    case "timeline":
      return <TimelineBlock key={index} events={block.events || []} title={block.title} />;
    case "gallery":
      return <GalleryBlock key={index} images={block.images || []} title={block.title} />;
    case "alert":
      return <AlertBlock key={index} title={block.title} message={block.message} severity={block.severity} />;
    case "form":
      return (
        <FormBlock
          key={index}
          formFields={(block.fields || block.formFields)!}
          submitLabel={block.submitAction || "Submit"}
        />
      );
    case "keyValue":
      return <KeyValueBlock key={index} keyValueItems={block.keyValueItems || []} title={block.title} />;
    case "list":
      return <ListBlock key={index} listItems={block.listItems || []} title={block.title} />;
    default:
      return null;
  }
};
