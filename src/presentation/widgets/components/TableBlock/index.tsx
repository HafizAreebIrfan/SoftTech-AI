import React, { useState, useMemo, useEffect } from "react";
import {
  WidgetTableRow,
  WidgetTableCell,
  WidgetTone,
  TableColumn,
  Pagination,
} from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/tableblock.module.css";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "../../../../assets/icons";

interface TableBlockProps {
  columns?: TableColumn[] | string[];
  rows?: (string | number)[][] | WidgetTableRow[];
  tableHeaders?: string[];
  tableRows?: WidgetTableRow[];
  title?: string;
  pagination?: Pagination;
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
}

const toneClasses: Record<WidgetTone, string> = {
  default: styles.default || "",
  good: styles.good || "",
  warning: styles.warning || "",
  danger: styles.danger || "",
};

const isTableCell = (val: unknown): val is WidgetTableCell => {
  return val !== null && typeof val === "object" && "value" in val;
};

export const TableBlock: React.FC<TableBlockProps> = ({
  columns: propColumns,
  rows: propRows,
  tableHeaders: propTableHeaders,
  tableRows: propTableRows,
  title,
  pagination,
  totalItems: propTotalItems,
  totalPages: propTotalPages,
  currentPage: propCurrentPage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Normalize headers and rows
  const tableHeaders: string[] = useMemo(() => {
    if (propColumns && propColumns.length > 0) {
      return propColumns.map((c) =>
        typeof c === "string" ? c : c.label || c.key,
      );
    }
    return propTableHeaders || [];
  }, [propColumns, propTableHeaders]);

  const tableRows: WidgetTableRow[] = useMemo(() => {
    return (propRows || propTableRows || []) as WidgetTableRow[];
  }, [propRows, propTableRows]);

  if (!tableRows || tableRows.length === 0) return null;

  // Helper to extract cell value
  const getCellValue = (cell: unknown): string | number => {
    if (isTableCell(cell)) {
      return cell.value;
    }
    return cell as string | number;
  };

  // 1. Filtering
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableRows;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return tableRows.filter((row) =>
      row.some((cell) => {
        const val = String(getCellValue(cell)).toLowerCase();
        return val.includes(lowerQuery);
      }),
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
  const totalItems: number = Number(
    pagination?.total !== undefined
      ? pagination.total
      : propTotalItems !== undefined
        ? propTotalItems
        : sortedRows.length,
  );

  const localTotalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const totalPages: number = Number(
    pagination?.totalPages !== undefined
      ? pagination.totalPages
      : propTotalPages !== undefined
        ? propTotalPages
        : localTotalPages,
  );

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
      {/* Title & Search bar row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          marginTop: "1rem",
        }}
      >
        <h4
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--app-text-primary, #ffffff)",
            margin: 0,
          }}
        >
          {title ? title : "Data Table"}
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
                              <ChevronUpIcon
                                size={10}
                                color="var(--app-card-active-border, #3b82f6)"
                              />
                            ) : (
                              <ChevronDownIcon
                                size={10}
                                color="var(--app-card-active-border, #3b82f6)"
                              />
                            )
                          ) : (
                            <ChevronDownIcon
                              size={10}
                              color="rgba(255,255,255,0.2)"
                            />
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
      {totalPages > 1 || tableRows.length > 5 || totalItems > tableRows.length ? (
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
              Showing{" "}
              {Math.min(sortedRows.length, (currentPage - 1) * pageSize + 1)}-
              {Math.min(sortedRows.length, currentPage * pageSize)} of {totalItems}
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
                onClick={() =>
                  setCurrentPage(Math.min(localTotalPages, currentPage + 1))
                }
                disabled={currentPage >= localTotalPages}
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
