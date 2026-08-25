import React, { useState, useMemo } from "react";
import { TableRow } from "./TableRow";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import styles from "../../../../styles/tableblock.module.css";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import type { TableBlockProps } from "../../../../interfaces/mcp/tableblock.interface";
import { FormBlock } from "../FormBlock";
import { getPermissions, capOn } from "../../helper/AudienceHelper";

export const TableBlock: React.FC<TableBlockProps> = ({
  block,
  records = [],
  fields = [],
  pagination,
  capabilities,
  title,
  actions = [],
  audience,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state (Initialize from window.openai.widgetState if it exists)
  const [selectedRecord, setSelectedRecord] = useState<Record<
    string,
    any
  > | null>((window as any).openai?.widgetState?.selectedRecord || null);
  const [editingRecord, setEditingRecord] = useState<Record<
    string,
    any
  > | null>((window as any).openai?.widgetState?.editingRecord || null);
  const [isCreating, setIsCreating] = useState(
    (window as any).openai?.widgetState?.isCreating || false,
  );

  const updateModalState = (view: any, edit: any, create: boolean) => {
    setSelectedRecord(view);
    setEditingRecord(edit);
    setIsCreating(create);

    if ((window as any).openai?.setWidgetState) {
      (window as any).openai.setWidgetState({
        ...((window as any).openai.widgetState || {}),
        selectedRecord: view,
        editingRecord: edit,
        isCreating: create,
      });
    }
  };

  const pageSize = pagination?.limit || 5;

  // Audience-gated CRUD: customers are read-only (view only), so admin controls
  // never leak into a customer surface. Admin gets a verb when an action or a
  // capability backs it.
  const permissions = getPermissions(audience, capabilities, actions);
  const hasVerb = (...verbs: string[]) =>
    actions.some((a: any) =>
      verbs.some(
        (v) =>
          a?.id === v ||
          String(a?.tool || "")
            .toLowerCase()
            .includes(v),
      ),
    );
  const canCreate =
    permissions.canMutate &&
    (hasVerb("create", "add") || capOn(capabilities, "create"));
  const canUpdate =
    permissions.canMutate &&
    (hasVerb("update", "edit") || capOn(capabilities, "update"));
  const canDelete =
    permissions.canMutate &&
    (hasVerb("delete", "remove") || capOn(capabilities, "delete"));
  const showActions = true; // View is always available

  const activeFields = useMemo(() => {
    const available =
      block?.fields && block.fields.length > 0 ? block.fields : fields;
    return available.filter((f) => !f.hidden);
  }, [block?.fields, fields]);

  // Search & Filter Logic (Unchanged)
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase().trim();
    return records.filter((rec) => {
      if (!rec || typeof rec !== "object") return false;
      return Object.values(rec as Record<string, unknown>).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [records, searchTerm]);

  // Sorting Logic (Unchanged)
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
        return sortDir === "asc"
          ? (Number(valA) || 0) - (Number(valB) || 0)
          : (Number(valB) || 0) - (Number(valA) || 0);
      }
      return String(valA).toLowerCase() < String(valB).toLowerCase()
        ? sortDir === "asc"
          ? -1
          : 1
        : sortDir === "asc"
          ? 1
          : -1;
    });
    return sorted;
  }, [filteredRecords, activeFields, sortKey, sortDir]);

  const totalItems = pagination?.total ?? sortedRecords.length;
  const totalPages =
    pagination?.totalPages ?? (Math.ceil(sortedRecords.length / pageSize) || 1);
  const paginatedRecords = useMemo(() => {
    if (pagination?.totalPages) return sortedRecords;
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize, pagination?.totalPages]);

  const handleHeaderClick = (field: FieldSchema) => {
    if (!capOn(capabilities, "sort") && !field.sortable) return;
    if (sortKey === field.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(field.key);
      setSortDir("asc");
    }
  };

  // 2. Action Handlers utilizing callTool
  const getToolName = (actionType: "create" | "update" | "delete") => {
    const action = actions.find(
      (a: any) => a.id === actionType || String(a.tool).includes(actionType),
    );
    return action?.tool || `${actionType}_item`; // Fallback to a generic tool name
  };

  const handleDelete = async (record: Record<string, any>) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${record.$title || "this item"}?`,
      )
    ) {
      const toolName = getToolName("delete");

      if ((window as any).openai?.callTool) {
        // Run silently in background. The UI will auto-update when the backend responds.
        await (window as any).openai.callTool(toolName, {
          id: record.id || record._id,
        });
      } else if ((window as any).openai?.sendFollowUpMessage) {
        (window as any).openai.sendFollowUpMessage({
          prompt: `Delete item with ID: ${record.id || record._id}`,
        });
      }
    }
  };

  const handleSaveForm = async (formData: Record<string, any>) => {
    const isEdit = Boolean(editingRecord);
    const toolName = getToolName(isEdit ? "update" : "create");

    // Merge the ID if we are updating an existing record
    const payload = isEdit
      ? { id: editingRecord?.id || editingRecord?._id, ...formData }
      : formData;

    if ((window as any).openai?.callTool) {
      updateModalState(null, null, false); // Close modal
      await (window as any).openai.callTool(toolName, payload);
    } else if ((window as any).openai?.sendFollowUpMessage) {
      updateModalState(null, null, false);
      (window as any).openai.sendFollowUpMessage({
        prompt: `${isEdit ? "Update" : "Create"} item with data: ${JSON.stringify(payload)}`,
      });
    }
  };

  if (!records || records.length === 0 || activeFields.length === 0)
    return null;

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
          {title && (
            <h3
              className={styles.title}
              style={{ margin: 0, color: "var(--TextHeading)" }}
            >
              {title}
            </h3>
          )}
          {(capabilities?.search || records.length > 3) && (
            <div
              className={styles.searchContainer}
              style={{
                background: "var(--BackgroundSecondary)",
                border: "1px solid var(--Border)",
              }}
            >
              <span style={{ color: "var(--IconColor)" }}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                style={{ color: "var(--TextPrimary)" }}
              />
            </div>
          )}
        </div>

        {canCreate && (
          <button
            type="button"
            className={styles.createNewBtn}
            onClick={() => updateModalState(null, null, true)}
            style={{ background: "var(--BrandIndigo)", color: "#fff" }}
          >
            ⊕ Create New
          </button>
        )}
      </div>

      <div
        className={styles.tableWrapper}
        style={{ border: "1px solid var(--TableDivider)", borderRadius: "8px" }}
      >
        <table className={styles.table}>
          <thead
            style={{
              background: "var(--BackgroundSecondary)",
              borderBottom: "1px solid var(--TableDivider)",
            }}
          >
            <tr>
              {activeFields.map((field) => {
                const isSortable = Boolean(
                  capOn(capabilities, "sort") || field.sortable,
                );
                return (
                  <th
                    key={field.key}
                    className={`${styles.th} ${isSortable ? styles.thSortable : ""}`}
                    onClick={() => handleHeaderClick(field)}
                    style={{ color: "var(--TextSecondary)" }}
                  >
                    <div className={styles.headerContent}>
                      <span>{field.label}</span>
                      {isSortable && (
                        <span className={styles.sortIcon}>
                          {sortKey === field.key
                            ? sortDir === "asc"
                              ? "▲"
                              : "▼"
                            : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {showActions && (
                <th
                  className={styles.th}
                  style={{ color: "var(--TextSecondary)" }}
                >
                  Actions
                </th>
              )}
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
                onView={(rec) =>
                  updateModalState(rec as Record<string, any>, null, false)
                }
                onEdit={(rec) =>
                  updateModalState(null, rec as Record<string, any>, false)
                }
                onDelete={(rec) => handleDelete(rec as Record<string, any>)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          className={styles.pagination}
          style={{ color: "var(--TextSecondary)" }}
        >
          <span>
            Page {pagination?.page ?? currentPage} of {totalPages} ({totalItems}{" "}
            items)
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

      {/* Record View Modal */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--ModalBackdrop)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => updateModalState(null, null, false)}
        >
          <div
            style={{
              background: "var(--Card)",
              border: "1px solid var(--CardBorder)",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", gap: "16px", alignItems: "center" }}
              >
                {selectedRecord.$image && (
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    {renderImage(
                      selectedRecord.$image,
                      String(selectedRecord.$title || "Item"),
                    )}
                  </div>
                )}
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      color: "var(--TextHeading)",
                    }}
                  >
                    {String(selectedRecord.$title || "Item Details")}
                  </h3>
                  {selectedRecord.$description && (
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: "var(--TextSecondary)",
                      }}
                    >
                      {String(selectedRecord.$description)}
                    </p>
                  )}
                </div>
              </div>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--TextSecondary)",
                  cursor: "pointer",
                  fontSize: "24px",
                  padding: "0 8px",
                }}
                onClick={() => updateModalState(null, null, false)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                borderTop: "1px solid var(--TableDivider)",
                paddingTop: "16px",
              }}
            >
              {activeFields.map((field) => {
                const val = getFieldValue(selectedRecord, field);
                if (val === null || val === undefined || val === "")
                  return null;
                return (
                  <div
                    key={field.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--TableDivider)",
                      paddingBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "var(--TextSecondary)",
                      }}
                    >
                      {field.label}:
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--TextPrimary)",
                        textAlign: "right",
                        maxWidth: "60%",
                      }}
                    >
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {(isCreating || editingRecord) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--ModalBackdrop)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => updateModalState(null, null, false)}
        >
          <div
            style={{
              background: "var(--Card)",
              border: "1px solid var(--CardBorder)",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, color: "var(--TextHeading)" }}>
                {isCreating
                  ? "Create New Item"
                  : `Edit ${editingRecord?.$title || "Item"}`}
              </h3>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--TextSecondary)",
                  cursor: "pointer",
                  fontSize: "24px",
                }}
                onClick={() => updateModalState(null, null, false)}
              >
                ✕
              </button>
            </div>

            <FormBlock
              fields={activeFields}
              initialData={editingRecord || {}}
              onSubmit={handleSaveForm}
            />
          </div>
        </div>
      )}
    </section>
  );
};
