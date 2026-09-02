import React, { useState, useMemo, useEffect } from "react";
import { TableRow } from "./TableRow";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { callMcpTool } from "../../../../utils/mcpBridge";
import styles from "../../../../styles/tableblock.module.css";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import type { TableBlockProps } from "../../../../interfaces/mcp/tableblock.interface";
import { FormBlock } from "../FormBlock";
import { Modal } from "../Modal";
import { TableRecordDetail } from "./TableRecordDetail";
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
  const [pageSize, setPageSize] = useState<number>(pagination?.limit || 8);
  const [searchTerm, setSearchTerm] = useState("");

  // Storage key for persistent state
  const storageKey = useMemo(() => {
    const meta = (window as any).__WIDGET_METADATA__ || {};
    const company = (meta.companyName || "global").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const entity = ((block as any)?.entity || meta.entity || title || "records").toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `softtech_records_${company}_${entity}`;
  }, [title]);

  const entityKey = useMemo(() => {
    const meta = (window as any).__WIDGET_METADATA__ || {};
    return ((block as any)?.entity || meta.entity || title || "records").toLowerCase().replace(/[^a-z0-9]/g, "_");
  }, [title]);

  // Modals & local state
  const [localRecords, setLocalRecords] = useState<any[]>(() => {
    try {
      const fromWidgetState = (window as any).openai?.widgetState?.records;
      if (Array.isArray(fromWidgetState) && fromWidgetState.length > 0) {
        return fromWidgetState;
      }
      const meta = (window as any).__WIDGET_METADATA__ || {};
      const company = (meta.companyName || "global").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const entity = ((block as any)?.entity || meta.entity || title || "records").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const key = `softtech_records_${company}_${entity}`;
      const cached = localStorage.getItem(key) || localStorage.getItem(`softtech_records_${entity}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return records;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    try {
      const fromWidgetState = (window as any).openai?.widgetState?.records;
      if (Array.isArray(fromWidgetState) && fromWidgetState.length > 0) {
        setLocalRecords(fromWidgetState);
        return;
      }
      const cached =
        localStorage.getItem(storageKey) ||
        localStorage.getItem(`softtech_records_${entityKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalRecords(parsed);
          return;
        }
      }
    } catch {}
    setLocalRecords(records);
  }, [records, storageKey, entityKey]);

  const commitRecords = (updater: (prev: any[]) => any[]) => {
    setLocalRecords((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        localStorage.setItem(`softtech_records_${entityKey}`, JSON.stringify(next));
      } catch {}
      if ((window as any).openai?.setWidgetState) {
        (window as any).openai.setWidgetState({
          ...((window as any).openai.widgetState || {}),
          records: next,
        });
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
  const showActions = true;

  // Suppress system audit fields (createdAt, updatedAt, __v, _id) from table view
  const activeFields = useMemo(() => {
    const available =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    const systemKeys = [
      "createdat",
      "updatedat",
      "created_at",
      "updated_at",
      "__v",
      "_id",
    ];

    return available.filter((f) => {
      if (f.hidden) return false;
      const keyLower = f.key.toLowerCase();
      if (systemKeys.includes(keyLower) && !f.primary) {
        return false;
      }
      return true;
    });
  }, [block?.fields, fields]);

  // Dynamically attach discovered enum/options to fields that lack explicit options
  const fieldsWithOptions = useMemo(() => {
    return activeFields.map((field) => {
      const existingOptions = (field as any).options || (field as any).enum;
      if (existingOptions && Array.isArray(existingOptions) && existingOptions.length > 0) {
        return field;
      }

      const isStatus =
        field.type === "status" ||
        field.uiRole === "status" ||
        /status$/i.test(field.key);

      if (isStatus) {
        // Collect distinct status values from current records
        const foundStatuses = new Set<string>();
        localRecords.forEach((rec) => {
          const val =
            getFieldValue(rec, field) ??
            (rec as any)[field.key] ??
            (rec as any).status ??
            (rec as any).packagestatus;
          if (typeof val === "string" && val.trim()) {
            const clean = val.trim();
            foundStatuses.add(clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
          }
        });

        const statusOptions =
          foundStatuses.size > 0
            ? Array.from(foundStatuses)
            : ["Active", "Inactive"];

        return {
          ...field,
          options: statusOptions,
        };
      }

      return field;
    });
  }, [activeFields, localRecords]);

  // Searching & Filtering Logic
  const filteredRecords = useMemo(() => {
    let list = localRecords;

    const promptContext = String(
      (window as any).__WIDGET_METADATA__?.user_raw_prompt ||
        (window as any).__WIDGET_DATA__?.user_raw_prompt ||
        (window as any).__WIDGET_METADATA__?.inferred_intent ||
        (window as any).__WIDGET_DATA__?.inferred_intent ||
        "",
    ).toLowerCase();

    const isExplicitActiveFilter =
      /\bactive\b/i.test(promptContext) &&
      !/\b(all|pending|draft|inactive)\b/i.test(promptContext);

    // Defensive customer filtering OR explicit active prompt filter
    if (audience === "customer" || isExplicitActiveFilter) {
      list = list.filter((rec: any) => {
        if (!rec || typeof rec !== "object") return true;
        const statusVal = String(
          rec.$status ||
            rec.status ||
            rec.packagestatus ||
            rec.orderstatus ||
            rec.availabilityStatus ||
            "",
        )
          .toLowerCase()
          .trim();

        if (isExplicitActiveFilter) {
          return (
            statusVal === "active" ||
            statusVal === "available" ||
            statusVal === "in stock" ||
            statusVal === "instock" ||
            statusVal === "success" ||
            statusVal === "completed"
          );
        }

        if (
          statusVal === "pending" ||
          statusVal === "inactive" ||
          statusVal === "draft" ||
          statusVal === "test" ||
          statusVal === "archived"
        ) {
          return false;
        }
        return true;
      });
    }

    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter((rec) => {
      if (!rec || typeof rec !== "object") return false;
      return Object.values(rec as Record<string, unknown>).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [localRecords, searchTerm, audience]);

  // Sorting Logic
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
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [filteredRecords, sortKey, sortDir, activeFields]);

  const totalItems = sortedRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleHeaderClick = (field: FieldSchema) => {
    if (!capOn(capabilities, "sort") && field.sortable === false) return;
    if (sortKey !== field.key) {
      setSortKey(field.key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      // 3rd click: Reset to default order
      setSortKey(null);
      setSortDir("asc");
    }
  };

  const getToolName = (actionType: "create" | "update" | "delete") => {
    const action = actions.find(
      (a: any) => a.id === actionType || String(a.tool).includes(actionType),
    );
    return action?.tool || `${actionType}_item`;
  };

  const handleDelete = (record: Record<string, any>) => {
    // Open in-widget delete confirmation dialog
    setDeletingRecord(record);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    const id = deletingRecord.id ?? deletingRecord._id;
    const title =
      deletingRecord.$title ||
      deletingRecord.packagename ||
      deletingRecord.username ||
      "Item";

    console.log(`[TableBlock] DELETE initiated for "${title}" (id=${id})`);

    // Show pending state — don't mutate records yet
    showToast(`⏳ Deleting "${title}"...`);
    setDeletingRecord(null);

    const toolName = getToolName("delete");
    const payload = {
      id,
      _id: id,
      packageId: id,
      productId: id,
      itemId: id,
      ...deletingRecord,
    };
    console.log(`[TableBlock] → Calling MCP tool "${toolName}" for delete:`, payload);
    try {
      const result = await callMcpTool(toolName, payload);
      console.log(`[TableBlock] ✓ Delete tool "${toolName}" succeeded:`, result);
      // Commit: remove from local state only after success
      commitRecords((prev) =>
        prev.filter((r) => r.id !== id && r._id !== id),
      );
      showToast(`✓ "${title}" deleted successfully`);
    } catch (err: any) {
      console.error(`[TableBlock] ✗ Delete tool "${toolName}" failed:`, err);
      showToast(`⚠️ Delete failed: ${err?.message || "Server error"}`);
      // No rollback needed — we didn't mutate state
    }
  };

function extractIdFromAny(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim())) {
    return val.trim();
  }
  if (Array.isArray(val) && val.length > 0) {
    return extractIdFromAny(val[0]);
  }
  if (typeof val === "object") {
    const obj = val as Record<string, any>;
    if (obj["0"]) {
      const insideZero = extractIdFromAny(obj["0"]);
      if (insideZero) return insideZero;
    }
    if (obj._id && !String(obj._id).startsWith("temp-")) {
      if (typeof obj._id === "object" && obj._id.$oid) return String(obj._id.$oid);
      return String(obj._id);
    }
    if (obj.id && !String(obj.id).startsWith("temp-")) return String(obj.id);
    if (obj.insertedId) return String(obj.insertedId);
    if (obj.packageId && !String(obj.packageId).startsWith("temp-")) return String(obj.packageId);
    if (obj.productId && !String(obj.productId).startsWith("temp-")) return String(obj.productId);
    if (obj.recordId && !String(obj.recordId).startsWith("temp-")) return String(obj.recordId);
    if (obj.data) return extractIdFromAny(obj.data);
    if (obj.package) return extractIdFromAny(obj.package);
    if (obj.item) return extractIdFromAny(obj.item);
    if (obj.record) return extractIdFromAny(obj.record);
    if (obj.result) return extractIdFromAny(obj.result);
  }
  return null;
}

function unwrapRecordObject(val: unknown): Record<string, any> {
  if (!val || typeof val !== "object") return {};
  if (Array.isArray(val) && val.length > 0) {
    return unwrapRecordObject(val[0]);
  }
  const obj = val as Record<string, any>;
  if (obj["0"] && typeof obj["0"] === "object") {
    return unwrapRecordObject(obj["0"]);
  }
  if (obj.data && typeof obj.data === "object") {
    return unwrapRecordObject(obj.data);
  }
  if (obj.package && typeof obj.package === "object") {
    return unwrapRecordObject(obj.package);
  }
  if (obj.item && typeof obj.item === "object") {
    return unwrapRecordObject(obj.item);
  }
  if (obj.record && typeof obj.record === "object") {
    return unwrapRecordObject(obj.record);
  }
  if (obj.result && typeof obj.result === "object") {
    return unwrapRecordObject(obj.result);
  }
  return obj;
}

function parseCreatedRecord(
  result: unknown,
  formData: Record<string, any>,
): Record<string, any> {
  let parsed: any = result;

  // 1. If result has MCP envelope content/structuredContent
  if (result && typeof result === "object") {
    const r = result as Record<string, any>;
    if (Array.isArray(r.content)) {
      for (const item of r.content) {
        if (item && item.type === "text" && typeof item.text === "string") {
          try {
            const json = JSON.parse(item.text);
            if (json && typeof json === "object") {
              parsed = json;
              break;
            }
          } catch {
            const hexMatch = item.text.match(/\b([0-9a-fA-F]{24})\b/);
            if (hexMatch) {
              parsed = { _id: hexMatch[1], id: hexMatch[1] };
            }
          }
        }
      }
    }
    if (r.structuredContent) {
      const sc = r.structuredContent;
      parsed = sc.data ?? sc.package ?? sc.item ?? sc.record ?? sc;
    }
  }

  // 2. Deep unwrap any array or indexed object ("0", "data", "package", etc.)
  const unwrapped = unwrapRecordObject(parsed);

  // 3. Extract MongoDB / Database ID
  const dbId =
    extractIdFromAny(unwrapped) ||
    extractIdFromAny(parsed) ||
    extractIdFromAny(result) ||
    (formData.id && !String(formData.id).startsWith("temp-") ? formData.id : null) ||
    (formData._id && !String(formData._id).startsWith("temp-") ? formData._id : null) ||
    `temp-${Date.now()}`;

  // Clean out any indexed keys like "0" from spreading
  const { "0": _zero, ...cleanUnwrapped } = unwrapped;

  const merged: Record<string, any> = {
    ...formData,
    ...cleanUnwrapped,
    id: dbId,
    _id: dbId,
  };

  // If packageId / productId / itemId exists or is used, sync it to dbId as well
  if (merged.packageId !== undefined) merged.packageId = dbId;
  if (merged.productId !== undefined) merged.productId = dbId;
  if (merged.itemId !== undefined) merged.itemId = dbId;

  return merged;
}

  const handleSaveForm = async (formData: Record<string, any>) => {
    const isEdit = Boolean(editingRecord);
    const actionType = isEdit ? "UPDATE" : "CREATE";
    const toolName = getToolName(isEdit ? "update" : "create");
    const id = editingRecord?.id || editingRecord?._id || formData.id;
    const displayName = formData.packagename || formData.$title || "Item";

    console.log(`[TableBlock] ${actionType} initiated for "${displayName}"`);

    // Show pending state — don't mutate records yet
    showToast(`⏳ ${actionType === "UPDATE" ? "Updating" : "Creating"} "${displayName}"...`);
    updateModalState(null, null, false);

    const payload = isEdit
      ? {
          id,
          _id: id,
          packageId: id,
          productId: id,
          ...editingRecord,
          ...formData,
        }
      : { ...formData };

    console.log(`[TableBlock] → Calling MCP tool "${toolName}" for ${actionType}:`, payload);
    try {
      const result = await callMcpTool(toolName, payload);
      console.log(`[TableBlock] ✓ ${actionType} tool "${toolName}" succeeded:`, result);
      // Commit: update local state only after success
      if (isEdit) {
        commitRecords((prev) =>
          prev.map((rec) =>
            (rec.id && rec.id === id) || (rec._id && rec._id === id)
              ? { ...rec, ...formData }
              : rec,
          ),
        );
        showToast(`✓ "${displayName}" updated successfully`);
      } else {
        const createdRec = parseCreatedRecord(result, formData);
        console.log(`[TableBlock] Created record stored with ID "${createdRec.id || createdRec._id}":`, createdRec);
        commitRecords((prev) => [createdRec, ...prev]);
        showToast(`✓ "${displayName}" created successfully`);
      }
    } catch (err: any) {
      console.error(`[TableBlock] ✗ ${actionType} tool "${toolName}" failed:`, err);
      showToast(`⚠️ ${actionType} failed: ${err?.message || "Server error"}`);
    }
  };

  if (!records || records.length === 0 || activeFields.length === 0)
    return null;

  if (selectedRecord) {
    return (
      <section className={styles.container}>
        {toastMessage && (
          <div className={styles.toastBanner}>
            <span>{toastMessage}</span>
          </div>
        )}

        <TableRecordDetail
          record={selectedRecord}
          fields={fieldsWithOptions}
          onBack={() => updateModalState(null, null, false)}
          onEdit={
            canUpdate
              ? (rec) => {
                  updateModalState(null, rec, false);
                }
              : undefined
          }
          onDelete={
            canDelete
              ? (rec) => {
                  updateModalState(null, null, false);
                  handleDelete(rec);
                }
              : undefined
          }
        />

        {/* Create / Edit Form Modal */}
        <Modal
          isOpen={Boolean(isCreating || editingRecord)}
          onClose={() => updateModalState(null, null, false)}
          title={
            isCreating
              ? "Create New Item"
              : `Edit ${editingRecord?.$title || editingRecord?.packagename || "Item"}`
          }
        >
          <FormBlock
            fields={fieldsWithOptions}
            initialData={editingRecord || {}}
            onSubmit={handleSaveForm}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={Boolean(deletingRecord)}
          onClose={() => setDeletingRecord(null)}
          title="Confirm Deletion"
        >
          {deletingRecord && (
            <div className={styles.deleteDialog}>
              <p className={styles.deleteText}>
                Are you sure you want to delete{" "}
                <strong>
                  "
                  {deletingRecord.$title ||
                    deletingRecord.packagename ||
                    deletingRecord.username ||
                    "this item"}
                  "
                </strong>
                ? This action cannot be undone.
              </p>
              <div className={styles.deleteActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setDeletingRecord(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.deleteConfirmBtn}
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </Modal>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={styles.toastBanner}>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {(capabilities?.search || records.length > 3) && (
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>🔍</span>
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
            onClick={() => updateModalState(null, null, true)}
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
                  capOn(capabilities, "sort") || field.sortable !== false,
                );
                return (
                  <th
                    key={field.key}
                    className={`${styles.th} ${isSortable ? styles.thSortable : ""}`}
                    onClick={() => isSortable && handleHeaderClick(field)}
                  >
                    <div className={styles.headerContent}>
                      <span>{field.label}</span>
                      {isSortable && (
                        <span
                          className={
                            sortKey === field.key
                              ? styles.sortIcon
                              : `${styles.sortIcon} ${styles.sortIconInactive}`
                          }
                        >
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
                <th className={styles.th}>
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

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationLeft}>
            <span>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(totalItems, currentPage * pageSize)}</strong> of{" "}
              <strong>{totalItems}</strong>
            </span>
            <div className={styles.limitGroup}>
              <span>Show:</span>
              <select
                className={styles.limitSelect}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Items per page"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className={styles.pageControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                &larr; Prev
              </button>
              <span className={styles.pageIndicator}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={Boolean(isCreating || editingRecord)}
        onClose={() => updateModalState(null, null, false)}
        title={
          isCreating
            ? "Create New Item"
            : `Edit ${editingRecord?.$title || editingRecord?.packagename || "Item"}`
        }
      >
        <FormBlock
          fields={fieldsWithOptions}
          initialData={editingRecord || {}}
          onSubmit={handleSaveForm}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        title="Confirm Deletion"
      >
        {deletingRecord && (
          <div className={styles.deleteDialog}>
            <p className={styles.deleteText}>
              Are you sure you want to delete{" "}
              <strong>
                "{deletingRecord.$title || deletingRecord.packagename || deletingRecord.username || "this item"}"
              </strong>
              ? This action cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeletingRecord(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleConfirmDelete}
              >
                🗑️ Delete Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};
