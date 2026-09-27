import React, { useState, useMemo } from "react";
import { FormField } from "./FormField";
import styles from "../../../../styles/formblock.module.css";
import type { FormBlockProps } from "../../../../interfaces/mcp/formblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

const validateField = (field: FieldSchema, value: unknown): string | null => {
  const isEmpty =
    value === undefined || value === null || value === "";

  if (field.primary && isEmpty) {
    return `${field.label} is required`;
  }

  if (isEmpty) return null;

  if (field.type === "email" && typeof value === "string") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Invalid email address format";
    }
  }

  if (field.type === "phone" && typeof value === "string") {
    const phoneRegex = /^\+?[\d\s\-().]{7,20}$/;
    if (!phoneRegex.test(value)) {
      return "Invalid phone number format";
    }
  }

  if (field.type === "url" && typeof value === "string") {
    try {
      new URL(value);
    } catch {
      return "Invalid URL format (e.g. https://example.com)";
    }
  }

  if (field.type === "number" && typeof value === "string") {
    const num = Number(value);
    if (Number.isNaN(num)) {
      return "Must be a valid number";
    }
    if (!Number.isFinite(num)) {
      return "Must be a finite number";
    }
  }

  if (field.type === "currency" && typeof value === "string") {
    const num = Number(value);
    if (Number.isNaN(num)) {
      return "Must be a valid price";
    }
    if (num < 0) {
      return "Price cannot be negative";
    }
  }

  if (field.type === "latitude" && typeof value === "string") {
    const num = Number(value);
    if (Number.isNaN(num) || num < -90 || num > 90) {
      return "Must be between -90 and 90";
    }
  }

  if (field.type === "longitude" && typeof value === "string") {
    const num = Number(value);
    if (Number.isNaN(num) || num < -180 || num > 180) {
      return "Must be between -180 and 180";
    }
  }

  if (field.type === "date" && typeof value === "string") {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value) || Number.isNaN(Date.parse(value))) {
      return "Invalid date format (YYYY-MM-DD)";
    }
  }

  if (field.type === "datetime" && typeof value === "string") {
    if (Number.isNaN(Date.parse(value))) {
      return "Invalid date/time value";
    }
  }

  return null;
};

export const FormBlock: React.FC<FormBlockProps> = ({
  block,
  fields = [],
  actions = [],
  initialData = {},
  onSubmit,
}) => {
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
      "id",
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

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = { ...initialData };
    activeFields.forEach((field) => {
      if (initial[field.key] === undefined || initial[field.key] === null) {
        const fieldOptions = ((field as any).options || (field as any).enum) as
          | string[]
          | undefined;
        const isStatus =
          field.type === "status" ||
          field.uiRole === "status" ||
          /status$/i.test(field.key);

        if (isStatus) {
          const availableStatuses =
            fieldOptions && fieldOptions.length > 0
              ? fieldOptions
              : ["Active", "Inactive"];
          initial[field.key] = availableStatuses[0];
        }
      }
    });
    return initial;
  });

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
        primaryAction
          ? `Action "${primaryAction.label}" executed successfully`
          : "Form submitted successfully",
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
