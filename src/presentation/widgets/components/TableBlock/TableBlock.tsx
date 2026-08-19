import React, { useState, useMemo } from "react";
import { TableRow } from "./TableRow";
import { getFieldValue } from "../../../../utils/schema/getValue";
import styles from "../../../../styles/tableblock.module.css";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import type { TableBlockProps } from "../../../../interfaces/mcp/tableblock.interface";

export const TableBlock: React.FC<TableBlockProps> = ({
  block,
  records = [],
  fields = [],
  pagination,
  capabilities,
  title,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const pageSize = pagination?.limit || 5;

  const entityStr = String((block as any)?.title || title || "").toLowerCase();
  const isCommercial = /package|product|service|order|item|inventory/.test(entityStr);

  const canCreate = Boolean(
    (capabilities as any)?.canCreate ||
    (capabilities as any)?.create ||
    isCommercial,
  );
  const canUpdate = Boolean(
    (capabilities as any)?.canUpdate ||
    (capabilities as any)?.update ||
    isCommercial,
  );
  const canDelete = Boolean(
    (capabilities as any)?.canDelete ||
    (capabilities as any)?.delete ||
    isCommercial,
  );
  const showActions =
    canUpdate || canDelete || Boolean(capabilities?.canRead || true);

  const activeFields = useMemo(() => {
    const available =
      block?.fields && block.fields.length > 0 ? block.fields : fields;
    return available.filter((f) => !f.hidden);
  }, [block?.fields, fields]);

  // 1. Search & Status Filter
  const filteredRecords = useMemo(() => {
    let result = records;

    const titleLower = String(title || "").toLowerCase();
    const statusMatch = titleLower.match(
      /\b(pending|active|completed|cancelled|draft)\b/i,
    );
    if (statusMatch) {
      const targetStatus = statusMatch[1].toLowerCase();
      const statusFiltered = result.filter((rec) => {
        if (!rec || typeof rec !== "object") return false;
        const recObj = rec as Record<string, unknown>;
        const statusValue = String(
          recObj.packagestatus || recObj.orderstatus || recObj.status || "",
        ).toLowerCase();
        return statusValue === targetStatus;
      });
      if (statusFiltered.length > 0) {
        result = statusFiltered;
      }
    }

    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase().trim();
    return result.filter((rec) => {
      if (!rec || typeof rec !== "object") return false;
      return Object.values(rec as Record<string, unknown>).some((val) =>
        String(val ?? "").toLowerCase().includes(term),
      );
    });
  }, [records, searchTerm, title]);

  // 2. Sorting
  const sortedRecords = useMemo(() => {
    if (!sortKey) return filteredRecords;

    const sortField = activeFields.find((f) => f.key === sortKey);
    if (!sortField) return filteredRecords;

    const sorted = [...filteredRecords];
    sorted.sort((a, b) => {
      const valA = getFieldValue(a, sortField);
      const valB = getFieldValue(b, sortField);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (sortField.type === "number" || sortField.type === "currency") {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDir === "asc" ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDir === "asc" ? -1 : 1;
      if (strA > strB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredRecords, activeFields, sortKey, sortDir]);

  // 3. Pagination
  const totalItems = pagination?.total ?? sortedRecords.length;
  const totalPages = pagination?.totalPages ?? (Math.ceil(sortedRecords.length / pageSize) || 1);

  const paginatedRecords = useMemo(() => {
    if (pagination?.totalPages) {
      return sortedRecords;
    }
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize, pagination?.totalPages]);

  const handleHeaderClick = (field: FieldSchema) => {
    if (!capabilities?.canSort && !field.sortable) return;

    if (sortKey === field.key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(field.key);
      setSortDir("asc");
    }
  };

  if (!records || records.length === 0 || activeFields.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {title && <h3 className={styles.title} style={{ margin: 0 }}>{title}</h3>}
          
          {(capabilities?.search || records.length > 3) && (
            <div className={styles.searchContainer}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}
        </div>

        {canCreate && (
          <button
            type="button"
            className={styles.createNewBtn}
            onClick={() => {
              console.log("[MCP Widget] Create New item triggered");
            }}
          >
            ⊕ Create New
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {activeFields.map((field) => {
                const isSortable = Boolean(
                  capabilities?.canSort || field.sortable,
                );
                const isSorted = sortKey === field.key;

                return (
                  <th
                    key={field.key}
                    className={`${styles.th} ${
                      isSortable ? styles.thSortable : ""
                    }`}
                    onClick={() => handleHeaderClick(field)}
                  >
                    <div className={styles.headerContent}>
                      <span>{field.label}</span>
                      {isSortable && (
                        <span className={styles.sortIcon}>
                          {isSorted ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {showActions && <th className={styles.th}>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {paginatedRecords.map((record, rowIndex) => (
              <TableRow
                key={`row-${rowIndex}`}
                record={record}
                fields={activeFields}
                showActions={showActions}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onView={(rec) => setSelectedRecord(rec as Record<string, unknown>)}
                onEdit={(rec) => console.log("[MCP Widget] Edit record:", rec)}
                onDelete={(rec) => console.log("[MCP Widget] Delete record:", rec)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span>
            Page {pagination?.page ?? currentPage} of {totalPages} ({totalItems} items)
          </span>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={styles.pageBtn}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className={styles.pageBtn}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              background: "var(--app-bg-secondary, #1a1b23)",
              border: "1px solid var(--app-card-border, #333)",
              borderRadius: "14px",
              padding: "20px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Item Details</h3>
              <button
                style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px" }}
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.entries(selectedRecord).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
                  <span style={{ fontWeight: 600, fontSize: "13px", opacity: 0.7 }}>{k}:</span>
                  <span style={{ fontSize: "13px", wordBreak: "break-all" }}>{typeof v === "object" ? JSON.stringify(v) : String(v ?? "-")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
