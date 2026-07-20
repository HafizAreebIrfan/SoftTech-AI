import React, { useState } from "react";
import styles from "../../../../styles/formblock.module.css";
import { WidgetFormField } from "../../../../domain/entities/GenericWidget";

interface FormBlockProps {
  title?: string;
  formFields?: WidgetFormField[];
  submitLabel?: string;
  actionUrl?: string;
  defaultValues?: Record<string, any>;
  onSubmitSuccess?: (values: Record<string, any>) => void;
}

export const FormBlock: React.FC<FormBlockProps> = ({
  title = "Submit Request",
  formFields = [],
  submitLabel = "Submit",
  actionUrl,
  defaultValues,
  onSubmitSuccess,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(defaultValues || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (defaultValues) {
      setFormValues((prev) => ({
        ...prev,
        ...defaultValues,
      }));
    }
  }, [defaultValues]);

  const handleInputChange = (name: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call/postMessage event
    try {
      console.log("[Dynamic Form Submit] Sending payload:", formValues);
      
      // Let ChatGPT App SDK or parent window know a form has been submitted
      const customEvent = new CustomEvent("widget:form_submit", {
        detail: {
          actionUrl,
          values: formValues,
        },
      });
      window.dispatchEvent(customEvent);

      // Trigger callback if defined
      if (onSubmitSuccess) {
        onSubmitSuccess(formValues);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.successOverlay}>
        <div className={styles.successIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h4 className={styles.successTitle}>Request Submitted Successfully</h4>
        <p className={styles.successDesc}>
          The operation has been completed. ChatGPT will update your dashboard context.
        </p>
        <button
          type="button"
          onClick={() => {
            setFormValues({});
            setIsSuccess(false);
          }}
          className={styles.submitBtn}
          style={{ marginTop: "1rem", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "var(--app-text-primary)" }}
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      {title && <h3 className={styles.formTitle}>{title}</h3>}
      {formFields.map((field) => {
        const value = formValues[field.name] ?? "";
        return (
          <div key={field.name} className={styles.inputGroup}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.requiredStar}>*</span>}
            </label>

            {field.type === "textarea" ? (
              <textarea
                required={field.required}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className={styles.textarea}
              />
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className={styles.select}
              >
                <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className={styles.input}
              />
            )}
          </div>
        );
      })}
      <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
        {isSubmitting ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
};
