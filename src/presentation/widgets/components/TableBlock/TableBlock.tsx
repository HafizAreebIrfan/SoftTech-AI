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
  const pageSize = pagination?.limit || 5;

  const activeFields = useMemo(() => {
    const available =
      block?.fields && block.fields.length > 0 ? block.fields : fields;
    return available.filter((f) => !f.hidden);
  }, [block?.fields, fields]);

  // 1. Sorting
  const sortedRecords = useMemo(() => {
    if (!sortKey) return records;

    const sortField = activeFields.find((f) => f.key === sortKey);
    if (!sortField) return records;

    const sorted = [...records];
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
  }, [records, activeFields, sortKey, sortDir]);

  // 2. Pagination
  const totalItems = pagination?.total ?? records.length;
  const totalPages = pagination?.totalPages ?? (Math.ceil(records.length / pageSize) || 1);

  const paginatedRecords = useMemo(() => {
    if (pagination?.totalPages) {
      // Server-side paginated
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
          marginBottom: "12px",
        }}
      >
        {title ? <h3 className={styles.title}>{title}</h3> : <div />}
        <button
          type="button"
          className={styles.createNewBtn}
          onClick={() => {
            console.log("[MCP Widget] Create New triggered");
          }}
        >
          ⊕ Create New
        </button>
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
              <th className={styles.th}>Edit</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRecords.map((record, rowIndex) => (
              <TableRow
                key={`row-${rowIndex}`}
                record={record}
                fields={activeFields}
                showActions={true}
                onEdit={(rec) => console.log("[MCP Widget] Edit record:", rec)}
                onDelete={(rec) => console.log("[MCP Widget] Delete record:", rec)}
              />
            ))}
          </tbody>
        </table>

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
      </div>
    </section>
  );
};
