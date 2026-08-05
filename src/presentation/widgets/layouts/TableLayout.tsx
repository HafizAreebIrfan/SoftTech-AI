import React from "react";
import { WidgetBlock } from "../../../domain/entities/GenericWidget";
import { TableBlock } from "../components/TableBlock";
import { MetricBlock } from "../components/MetricBlock";

interface LayoutProps {
  title?: string;
  subtitle?: string;
  blocks: WidgetBlock[];
}

export const TableLayout: React.FC<LayoutProps> = ({
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
          case "metrics":
            return <MetricBlock key={index} metrics={block.metrics || []} title={block.title} />;
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
          default:
            return null;
        }
      })}
    </div>
  );
};
