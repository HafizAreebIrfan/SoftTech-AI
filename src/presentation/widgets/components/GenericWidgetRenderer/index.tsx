import React from "react";
import { useMcpToolResult } from "../../../../infrastructure/store/mcpWidgetStore";
import { MetricBlock } from "../MetricBlock";
import { ListBlock } from "../ListBlock";
import { KeyValueBlock } from "../KeyValueBlock";
import { TableBlock } from "../TableBlock";
import { WidgetBlock } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/genericwidgetrenderer.module.css";

export const GenericWidgetRenderer: React.FC = () => {
  const toolResult = useMcpToolResult();

  const debugText =
    toolResult?.content?.find((entry) => entry.type === "text")?.text ??
    null;

  // Validate presence of structured content, title, and blocks array
  if (
    !toolResult ||
    !toolResult.structuredContent ||
    typeof toolResult.structuredContent !== "object" ||
    typeof toolResult.structuredContent.title !== "string" ||
    !Array.isArray(toolResult.structuredContent.blocks)
  ) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No custom interface loaded</h3>
        <p className={styles.emptyDesc}>
          The widget is ready, but no structured MCP interface data is active right now.
        </p>
        {debugText && <pre className={styles.debugText}>{debugText}</pre>}
      </div>
    );
  }

  const { title, subtitle, blocks } = toolResult.structuredContent;

  // Filter out invalid blocks or blocks with no items
  const validBlocks = blocks.filter((block: WidgetBlock) => {
    if (!block || typeof block !== "object") return false;
    switch (block.type) {
      case "metrics":
        return Array.isArray(block.metrics) && block.metrics.length > 0;
      case "list":
        return Array.isArray(block.listItems) && block.listItems.length > 0;
      case "keyValue":
        return Array.isArray(block.keyValueItems) && block.keyValueItems.length > 0;
      case "table":
        return Array.isArray(block.tableRows) && block.tableRows.length > 0;
      default:
        return false;
    }
  });

  if (validBlocks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>{title}</h3>
        {subtitle && <p className={styles.emptyDesc}>{subtitle}</p>}
        <p className={styles.emptyDesc} style={{ marginTop: "1rem" }}>
          No valid visualization blocks are configured to render.
        </p>
      </div>
    );
  }

  return (
    <section className={styles.widgetShell}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      {validBlocks.map((block, index) => {
        switch (block.type) {
          case "metrics":
            return (
              <MetricBlock
                key={index}
                metrics={block.metrics!}
                title={block.title}
              />
            );
          case "list":
            return (
              <ListBlock
                key={index}
                listItems={block.listItems!}
                title={block.title}
              />
            );
          case "keyValue":
            return (
              <KeyValueBlock
                key={index}
                keyValueItems={block.keyValueItems!}
                title={block.title}
              />
            );
          case "table":
            return (
              <TableBlock
                key={index}
                tableHeaders={block.tableHeaders}
                tableRows={block.tableRows!}
                title={block.title}
              />
            );
          default:
            return null;
        }
      })}
    </section>
  );
};
