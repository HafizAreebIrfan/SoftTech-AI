import React from "react";
import { WidgetBlock } from "../../../domain/entities/GenericWidget";
import { MetricBlock } from "../components/MetricBlock";
import { TableBlock } from "../components/TableBlock";
import { CardsBlock } from "../components/CardsBlock";
import { TimelineBlock } from "../components/TimelineBlock";
import { GalleryBlock } from "../components/GalleryBlock";
import { AlertBlock } from "../components/AlertBlock";
import { FormBlock } from "../components/FormBlock";
import { KeyValueBlock } from "../components/KeyValueBlock";
import { ListBlock } from "../components/ListBlock";

interface LayoutProps {
  title?: string;
  subtitle?: string;
  blocks: WidgetBlock[];
}

export const GeneralLayout: React.FC<LayoutProps> = ({
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

      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

const renderBlock = (block: WidgetBlock, index: number) => {
  if (!block || typeof block !== "object") return null;

  switch (block.type) {
    case "metrics":
      return block.metrics && block.metrics.length > 0 ? (
        <MetricBlock key={index} metrics={block.metrics} title={block.title} />
      ) : null;
    case "table":
      return (block.rows && block.rows.length > 0) ||
        (block.tableRows && block.tableRows.length > 0) ? (
        <TableBlock
          key={index}
          columns={block.columns}
          rows={block.rows}
          tableHeaders={block.tableHeaders}
          tableRows={block.tableRows}
          title={block.title}
          pagination={block.pagination}
        />
      ) : null;
    case "cards":
      return block.cards && block.cards.length > 0 ? (
        <CardsBlock key={index} cards={block.cards} title={block.title} />
      ) : null;
    case "timeline":
      return block.events && block.events.length > 0 ? (
        <TimelineBlock key={index} events={block.events} title={block.title} />
      ) : null;
    case "gallery":
      return block.images && block.images.length > 0 ? (
        <GalleryBlock key={index} images={block.images} title={block.title} />
      ) : null;
    case "alert":
      return (
        <AlertBlock
          key={index}
          title={block.title}
          message={block.message}
          severity={block.severity}
        />
      );
    case "form":
      return block.fields || block.formFields ? (
        <FormBlock
          key={index}
          formFields={(block.fields || block.formFields)!}
          submitLabel={block.submitAction || "Submit"}
        />
      ) : null;
    case "keyValue":
      return block.keyValueItems && block.keyValueItems.length > 0 ? (
        <KeyValueBlock key={index} keyValueItems={block.keyValueItems} title={block.title} />
      ) : null;
    case "list":
      return block.listItems && block.listItems.length > 0 ? (
        <ListBlock key={index} listItems={block.listItems} title={block.title} />
      ) : null;
    default:
      return null;
  }
};
