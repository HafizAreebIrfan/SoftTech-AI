import React from "react";
import styles from "../../../../styles/formblock.module.css";
import type { FormFieldProps } from "../../../../interfaces/mcp/formblock.interface";

export const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  error,
  onChange,
}) => {
  const inputId = `form-field-${field.key}`;

  const renderInput = () => {
    switch (field.type) {
      case "boolean":
        return (
          <label className={styles.checkboxGroup} htmlFor={inputId}>
            <input
              id={inputId}
              type="checkbox"
              className={styles.checkbox}
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className={styles.label}>{field.label}</span>
          </label>
        );

      case "date":
      case "datetime":
        return (
          <input
            id={inputId}
            type={field.type === "datetime" ? "datetime-local" : "date"}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value ? String(value) : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "number":
      case "currency":
        return (
          <input
            id={inputId}
            type="number"
            step="any"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value !== undefined && value !== null ? String(value) : ""}
            placeholder={field.label}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === "" ? "" : Number(val));
            }}
          />
        );

      case "email":
        return (
          <input
            id={inputId}
            type="email"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value ? String(value) : ""}
            placeholder="user@example.com"
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "url":
        return (
          <input
            id={inputId}
            type="url"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value ? String(value) : ""}
            placeholder="https://example.com"
            onChange={(e) => onChange(e.target.value)}
          />
        );

      default:
        return (
          <input
            id={inputId}
            type="text"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value ? String(value) : ""}
            placeholder={field.label}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={styles.formGroup}>
      {field.type !== "boolean" && (
        <label className={styles.label} htmlFor={inputId}>
          {field.label}
          {field.primary && <span className={styles.requiredAsterisk}>*</span>}
        </label>
      )}

      {renderInput()}

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
