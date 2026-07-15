import React from "react";
import { useMcpToolResult } from "../../../../infrastructure/store/mcpWidgetStore";
import { MetricBlock } from "../MetricBlock";
import { ListBlock } from "../ListBlock";
import { KeyValueBlock } from "../KeyValueBlock";
import { TableBlock } from "../TableBlock";
import { WidgetBlock } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/genericwidgetrenderer.module.css";

export const GenericWidgetRenderer: React.FC = () => {
  let toolResult;

  try {
    toolResult = useMcpToolResult();
    console.log("toolResult", toolResult);
    console.log("window.openai", window.openai);
    console.log("window.openai.toolOutput", window.openai?.toolOutput);
  } catch (e) {
    console.error("HOOK FAILED", e);
    return (
      <div
        style={{
          color: "white",
          background: "#222",
          padding: "20px",
          fontSize: "20px",
        }}
      >
        Hook crashed
      </div>
    );
  }
  const debugText =
    toolResult?.content?.find((entry) => entry.type === "text")?.text ?? null;

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
          The widget is ready, but no structured MCP interface data is active
          right now.
        </p>
        {debugText && <pre className={styles.debugText}>{debugText}</pre>}
      </div>
    );
  }

  const {
    title,
    subtitle,
    blocks,
    layout = "dashboard",
    meta,
  } = toolResult.structuredContent;

  // Filter out invalid blocks or blocks with no items
  const validBlocks = blocks.filter((block: WidgetBlock) => {
    if (!block || typeof block !== "object") return false;
    switch (block.type) {
      case "metrics":
        return Array.isArray(block.metrics) && block.metrics.length > 0;
      case "list":
        return Array.isArray(block.listItems) && block.listItems.length > 0;
      case "keyValue":
        return (
          Array.isArray(block.keyValueItems) && block.keyValueItems.length > 0
        );
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

  // Sort blocks dynamically based on the requested layout:
  // - "dashboard": metrics blocks first
  // - "detail": keyValue or list blocks first
  // - "table": table blocks first
  const sortedBlocks = [...validBlocks].sort((a, b) => {
    if (layout === "dashboard") {
      if (a.type === "metrics" && b.type !== "metrics") return -1;
      if (b.type === "metrics" && a.type !== "metrics") return 1;
    } else if (layout === "detail") {
      const isAFirst = a.type === "keyValue" || a.type === "list";
      const isBFirst = b.type === "keyValue" || b.type === "list";
      if (isAFirst && !isBFirst) return -1;
      if (isBFirst && !isAFirst) return 1;
    } else if (layout === "table") {
      if (a.type === "table" && b.type !== "table") return -1;
      if (b.type === "table" && a.type !== "table") return 1;
    }
    return 0;
  });

  // Check if this is the default dev/fallback preview result
  const isPreview = (toolResult as any)._meta?.isPreview === true;

  const formatFetchedTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className={styles.widgetShell}>
      {isPreview && (
        <div className={styles.badgeContainer}>
          <span className={styles.previewBadge}>Preview Fallback</span>
        </div>
      )}

      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      {sortedBlocks.map((block, index) => {
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

      {meta && (meta.source || meta.lastFetched) && (
        <footer className={styles.footer}>
          {meta.source && <span>Source: {meta.source}</span>}
          {meta.lastFetched && (
            <span>Last fetched: {formatFetchedTime(meta.lastFetched)}</span>
          )}
        </footer>
      )}
    </section>
  );
};
