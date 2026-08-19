import React, { useState, useMemo } from "react";
import { FormField } from "./FormField";
import styles from "../../../../styles/formblock.module.css";
import type { FormBlockProps } from "../../../../interfaces/mcp/formblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

const validateField = (field: FieldSchema, value: unknown): string | null => {
  if (field.primary && (value === undefined || value === null || value === "")) {
    return `${field.label} is required`;
  }

  if (field.type === "email" && value && typeof value === "string") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Invalid email address format";
    }
  }

  if ((field.type === "number" || field.type === "currency") && value !== "" && value !== undefined && value !== null) {
    if (typeof value === "number" && Number.isNaN(value)) {
      return "Must be a valid number";
    }
  }

  return null;
};

export const FormBlock: React.FC<FormBlockProps> = ({
  block,
  fields = [],
  actions = [],
  onSubmit,
}) => {
  const activeFields = useMemo(() => {
    const available =
      block?.fields && block.fields.length > 0 ? block.fields : fields;
    return available.filter((f) => !f.hidden);
  }, [block?.fields, fields]);

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFieldChange = (key: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    activeFields.forEach((field) => {
      const err = validateField(field, formData[field.key]);
      if (err) {
        newErrors[field.key] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      if (onSubmit) {
        onSubmit(formData);
      }
      const primaryAction = actions[0];
      setSuccessMessage(
        primaryAction ? `Action "${primaryAction.label}" executed successfully` : "Form submitted successfully",
      );
    } catch {
      setErrors({ _form: "Submission failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeFields.length === 0) {
    return null;
  }

  const primaryAction = actions[0];
  const buttonText = primaryAction?.label || "Submit";

  return (
    <section className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        {activeFields.map((field) => (
          <FormField
            key={field.key}
            field={field}
            value={formData[field.key]}
            error={errors[field.key]}
            onChange={(val) => handleFieldChange(field.key, val)}
          />
        ))}

        {errors._form && <div className={styles.errorText}>{errors._form}</div>}

        <div className={styles.footer}>
          {successMessage && (
            <span className={styles.successNotice}>{successMessage}</span>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : buttonText}
          </button>
        </div>
      </form>
    </section>
  );
};
