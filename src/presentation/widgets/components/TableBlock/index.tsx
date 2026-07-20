import React, { useState, useMemo, useEffect } from "react";
import { WidgetTableRow, WidgetTableCell, WidgetTone } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/tableblock.module.css";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "../../../../assets/icons";
import { MetricBlock } from "../MetricBlock";

interface TableBlockProps {
  tableHeaders?: string[];
  tableRows: WidgetTableRow[];
  title?: string;
}

const toneClasses: Record<WidgetTone, string> = {
  default: styles.default,
  good: styles.good,
  warning: styles.warning,
  danger: styles.danger,
};

const isTableCell = (val: unknown): val is WidgetTableCell => {
  return val !== null && typeof val === "object" && "value" in val;
};

export const TableBlock: React.FC<TableBlockProps> = ({ tableHeaders, tableRows, title }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  if (!tableRows || tableRows.length === 0) return null;

  // Helper to extract cell value
  const getCellValue = (cell: unknown): string | number => {
    if (isTableCell(cell)) {
      return cell.value;
    }
    return cell as string | number;
  };

  // Compute local summary metrics to display above the table!
  const localMetrics = useMemo(() => {
    const metrics: Array<{ label: string; value: string | number; tone?: WidgetTone }> = [];
    
    // 1. Total Count metric
    const rowCount = tableRows.length;
    const tableTitle = title || "Items";
    metrics.push({
      label: `Total ${tableTitle}`,
      value: rowCount,
      tone: "default"
    });

    // 2. Sum of numeric columns (e.g. price, amount, total, quantity, sales, cost, fee)
    if (tableHeaders && tableRows) {
      const numericColumns = new Map<number, { sum: number; name: string }>();
      tableHeaders.forEach((header, colIdx) => {
        const lowerHeader = header.toLowerCase();
        if (
          lowerHeader.includes("amount") ||
          lowerHeader.includes("total") ||
          lowerHeader.includes("price") ||
          lowerHeader.includes("qty") ||
          lowerHeader.includes("quantity") ||
          lowerHeader.includes("sales") ||
          lowerHeader.includes("cost") ||
          lowerHeader.includes("fee")
        ) {
          numericColumns.set(colIdx, { sum: 0, name: header });
        }
      });

      tableRows.forEach((row) => {
        numericColumns.forEach((stats, colIdx) => {
          const cell = row[colIdx];
          const cellVal = isTableCell(cell) ? cell.value : cell;
          
          if (typeof cellVal === "number") {
            stats.sum += cellVal;
          } else if (typeof cellVal === "string") {
            const parsed = parseFloat(cellVal.replace(/[^0-9.-]/g, ""));
            if (!isNaN(parsed)) {
              stats.sum += parsed;
            }
          }
        });
      });

      numericColumns.forEach((stats) => {
        const lowerName = stats.name.toLowerCase();
        const isPrice =
          lowerName.includes("price") ||
          lowerName.includes("amount") ||
          lowerName.includes("total") ||
          lowerName.includes("cost") ||
          lowerName.includes("fee") ||
          lowerName.includes("sales");
        
        metrics.push({
          label: stats.name.toLowerCase().startsWith("total") ? stats.name : `Total ${stats.name}`,
          value: isPrice ? `$${stats.sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : stats.sum,
          tone: "good"
        });
      });
    }
    return metrics;
  }, [tableRows, tableHeaders, title]);

  // 1. Filtering
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableRows;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return tableRows.filter((row) =>
      row.some((cell) => {
        const val = String(getCellValue(cell)).toLowerCase();
        return val.includes(lowerQuery);
      })
    );
  }, [tableRows, searchQuery]);

  // 2. Sorting
  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const valA = getCellValue(a[sortCol]);
      const valB = getCellValue(b[sortCol]);

      const numA = parseFloat(String(valA).replace(/[^0-9.-]/g, ""));
      const numB = parseFloat(String(valB).replace(/[^0-9.-]/g, ""));

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDir === "asc" ? -1 : 1;
      if (strA > strB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRows, sortCol, sortDir]);

  // Reset page when filter/sort shifts
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortCol, sortDir]);

  // 3. Pagination
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleHeaderClick = (index: number) => {
    if (sortCol === index) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(index);
      setSortDir("asc");
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Auto-computed Summary Metrics Block */}
      {localMetrics.length > 0 && (
        <MetricBlock
          metrics={localMetrics}
          title={`${title || "Table"} Overview`}
        />
      )}

      {/* Title & Search bar row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem", marginTop: "1rem" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text-primary, #ffffff)", margin: 0 }}>
          {title ? `${title} Details` : "Details"}
        </h4>
        
        {/* Search Input bar */}
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>
            <SearchIcon size={14} color="var(--app-text-secondary, #8a8d98)" />
          </span>
          <input
            type="text"
            placeholder="Search table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          {tableHeaders && tableHeaders.length > 0 && (
            <thead>
              <tr>
                {tableHeaders.map((header, index) => {
                  const isSorted = sortCol === index;
                  return (
                    <th
                      key={index}
                      className={`${styles.th} ${styles.thSortable}`}
                      onClick={() => handleHeaderClick(index)}
                    >
                      <div className={styles.headerContent}>
                        <span>{header}</span>
                        <span className={styles.sortIcon}>
                          {isSorted ? (
                            sortDir === "asc" ? (
                              <ChevronUpIcon size={10} color="var(--app-card-active-border, #3b82f6)" />
                            ) : (
                              <ChevronDownIcon size={10} color="var(--app-card-active-border, #3b82f6)" />
                            )
                          ) : (
                            <ChevronDownIcon size={10} color="rgba(255,255,255,0.2)" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.tr}>
                {row.map((cell, cellIndex) => {
                  let value: string | number = "";
                  let tone: WidgetTone = "default";

                  if (isTableCell(cell)) {
                    value = cell.value;
                    tone = cell.tone || "default";
                  } else {
                    value = cell as string | number;
                  }

                  const cellClass = toneClasses[tone] || styles.default;

                  return (
                    <td key={cellIndex} className={`${styles.td} ${cellClass}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls footer */}
      {totalPages > 1 || tableRows.length > 5 ? (
        <div className={styles.pagination}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.pageSizeSelect}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>rows per page</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span>
              Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-
              {Math.min(totalItems, currentPage * pageSize)} of {totalItems}
            </span>
            <div className={styles.paginationButtons}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
