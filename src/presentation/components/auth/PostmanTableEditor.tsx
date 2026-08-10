import React, { FC, useState, useEffect } from "react";
import {
  PostmanTableEditorProps,
  ParamRow,
} from "../../../interfaces/signup.interface";
import {
  parseJsonToRows,
  rowsToJsonStr,
  useSignupStore,
} from "../../../infrastructure/store/signupStore";
import {
  TrashIcon,
  SparklesIcon,
  BoltIcon,
  Plus,
  ClipboardIcon,
  CodeIcon,
} from "../../../assets/icons";
import { showToast } from "../../../utils/toasts";
import styles from "../../../styles/postmanTableEditor.module.css";

export const PostmanTableEditor: FC<PostmanTableEditorProps> = ({
  api,
  field,
  title,
  description,
  showDynamicToggle = true,
  colors,
  updateApiField,
  stepOneData,
}) => {
  const jsonStr = api[field] || "";
  const [rows, setRows] = useState<ParamRow[]>(() =>
    parseJsonToRows(jsonStr, showDynamicToggle),
  );
  const [isRawJsonMode, setIsRawJsonMode] = useState(false);
  const { applyTemplateSuggestions } = useSignupStore();

  useEffect(() => {
    const currentJson = rowsToJsonStr(rows);
    if (currentJson !== jsonStr && jsonStr !== undefined) {
      try {
        const parsedRows = parseJsonToRows(jsonStr, showDynamicToggle);
        if (
          JSON.stringify(parsedRows.map((r) => ({ k: r.key, v: r.value }))) !==
          JSON.stringify(rows.map((r) => ({ k: r.key, v: r.value })))
        ) {
          setRows(parsedRows);
        }
      } catch {
        // Ignore parsing errors during editing
      }
    }
  }, [jsonStr, showDynamicToggle]);

  const handleRowChange = (
    index: number,
    updatedField: keyof ParamRow,
    val: any,
  ) => {
    const updatedRows = rows.map((row, idx) =>
      idx === index ? { ...row, [updatedField]: val } : row,
    );
    setRows(updatedRows);
    updateApiField(api.id, field, rowsToJsonStr(updatedRows, showDynamicToggle));
  };

  const handleAddRow = () => {
    const newRows = [
      ...rows,
      {
        id: `row-${Date.now()}-${rows.length}`,
        key: "",
        value: "",
        isDynamic: showDynamicToggle,
      },
    ];
    setRows(newRows);
    updateApiField(api.id, field, rowsToJsonStr(newRows, showDynamicToggle));
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, idx) => idx !== index);
    const resultRows =
      newRows.length === 0
        ? [
            {
              id: `row-${Date.now()}-0`,
              key: "",
              value: "",
              isDynamic: showDynamicToggle,
            },
          ]
        : newRows;
    setRows(resultRows);
    updateApiField(api.id, field, rowsToJsonStr(resultRows, showDynamicToggle));
  };

  return (
    <div className={styles.editorWrapper}>
      {/* Header & Controls */}
      <div className={styles.editorHeader}>
        <div className={styles.titleGroup}>
          <h4
            className={styles.editorTitle}
            style={{ color: colors.TextHeading }}
          >
            {title}
          </h4>
          <p className={styles.editorDesc} style={{ color: colors.TextBody }}>
            {description}
          </p>
        </div>
        <div className={styles.controlGroup}>
          <button
            type="button"
            onClick={() => setIsRawJsonMode(!isRawJsonMode)}
            className={styles.btnToggleView}
          >
            {isRawJsonMode ? (
              <>
                <ClipboardIcon size={13} color={colors.IconColor} />
                <span>Table View</span>
              </>
            ) : (
              <>
                <CodeIcon size={13} color={colors.IconColor} />
                <span>Raw JSON View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isRawJsonMode ? (
        <div className={styles.textareaWrapper}>
          <textarea
            rows={4}
            value={api[field] || ""}
            onChange={(e) => updateApiField(api.id, field, e.target.value)}
            placeholder={
              field === "apiQueryParams"
                ? '{"q": "Karachi", "days": 5}'
                : '{"X-Custom-Header": "value"}'
            }
            className={styles.jsonTextarea}
          />
          <div
            className={styles.rawJsonMeta}
            style={{ color: colors.TextBody }}
          >
            <span>Stored as JSON format for backend bridge compatibility.</span>
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(api[field] || "{}");
                  updateApiField(
                    api.id,
                    field,
                    JSON.stringify(parsed, null, 2),
                  );
                  showToast("Formatted JSON successfully!", "success");
                } catch {
                  showToast(
                    "Invalid JSON syntax. Please check formatting.",
                    "error",
                  );
                }
              }}
              className={styles.validateBtn}
            >
              Optimize & Validate JSON
            </button>
          </div>
        </div>
      ) : (
        <div
          className={styles.tableContainer}
          style={{
            background: colors.Background,
            borderColor: colors.CardBorder,
          }}
        >
          {/* Table Header */}
          <div
            className={styles.tableHeader}
            style={{
              background: colors.BackgroundSecondary,
              borderColor: colors.CardBorder,
              color: colors.TextBody,
            }}
          >
            <div style={{ gridColumn: "span 4 / span 4" }}>KEY / PARAMETER</div>
            <div style={{ gridColumn: "span 4 / span 4" }}>VALUE / EXAMPLE</div>
            {showDynamicToggle ? (
              <>
                <div style={{ gridColumn: "span 3 / span 3" }}>
                  RUNTIME CONTROL
                </div>
                <div
                  style={{ gridColumn: "span 1 / span 1", textAlign: "center" }}
                >
                  DEL
                </div>
              </>
            ) : (
              <>
                <div style={{ gridColumn: "span 3 / span 3" }}>DESCRIPTION</div>
                <div
                  style={{ gridColumn: "span 1 / span 1", textAlign: "center" }}
                >
                  DEL
                </div>
              </>
            )}
          </div>

          {/* Table Rows */}
          <div className={styles.tableRows}>
            {rows.map((row, idx) => (
              <div
                key={row.id || idx}
                className={styles.tableRow}
                style={{ borderColor: colors.CardBorder }}
              >
                <div style={{ gridColumn: "span 4 / span 4" }}>
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) =>
                      handleRowChange(idx, "key", e.target.value)
                    }
                    placeholder={
                      field === "apiQueryParams"
                        ? "e.g. q, days, limit"
                        : "e.g. X-API-Key"
                    }
                    className={styles.cellInput}
                  />
                </div>
                <div style={{ gridColumn: "span 4 / span 4" }}>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      handleRowChange(idx, "value", e.target.value)
                    }
                    placeholder={
                      field === "apiQueryParams"
                        ? "e.g. Karachi, 5"
                        : "e.g. your-key-here"
                    }
                    className={styles.cellInput}
                  />
                </div>

                {showDynamicToggle ? (
                  <div
                    style={{
                      gridColumn: "span 3 / span 3",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleRowChange(idx, "isDynamic", !row.isDynamic)
                      }
                      className={styles.cellDynamic}
                      style={{
                        background: row.isDynamic
                          ? colors.DynamicBadgeBg
                          : "rgba(255, 255, 255, 0.03)",
                        borderColor: row.isDynamic
                          ? colors.DynamicBadgeBorder
                          : colors.CardBorder,
                        color: row.isDynamic
                          ? colors.DynamicBadgeText
                          : colors.TextBody,
                      }}
                      title={
                        row.isDynamic
                          ? "ChatGPT will dynamically provide this parameter at runtime based on user prompts."
                          : "Always sent as a fixed static value."
                      }
                    >
                      {row.isDynamic ? (
                        <>
                          <BoltIcon size={11} color={colors.DynamicBadgeText} />
                          <span>Dynamic (AI)</span>
                        </>
                      ) : (
                        <span>Static Value</span>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    className={styles.cellStatic}
                    style={{
                      gridColumn: "span 3 / span 3",
                      color: colors.TextBody,
                    }}
                  >
                    Fixed Header
                  </div>
                )}

                <div
                  className={styles.cellDelete}
                  style={{ gridColumn: "span 1 / span 1" }}
                >
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      className={styles.btnDelete}
                      title="Delete row"
                    >
                      <TrashIcon size={13} color="#ef4444" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div
            className={styles.tableFooter}
            style={{
              background: colors.BackgroundSecondary,
              borderColor: colors.CardBorder,
            }}
          >
            <button
              type="button"
              onClick={handleAddRow}
              className={styles.btnAddParam}
              style={{
                background: colors.Background,
                borderColor: colors.CardBorder,
                color: colors.TextHeading,
              }}
            >
              <Plus size={13} color={colors.TextHeading} />
              <span>Add Parameter</span>
            </button>

            <span
              className={styles.paramCount}
              style={{ color: colors.TextBody }}
            >
              {rows.filter((r) => r.key.trim()).length} parameter(s) configured
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
