import React, { useState } from "react";
import styles from "../../../../styles/optionpickerblock.module.css";
import { renderImage } from "../../helper/RenderImage";

export interface OptionItem {
  id: string;
  label: string;
  image?: string;
  icon?: string;
  data?: unknown;
}

export interface OptionPickerBlockProps {
  title?: string;
  options?: OptionItem[];
  defaultSelectedId?: string;
  onSelectOption?: (option: OptionItem) => void;
  onBack?: () => void;
  ctaLabel?: string;
}

export const OptionPickerBlock: React.FC<OptionPickerBlockProps> = ({
  title = "Select an Option",
  options = [],
  defaultSelectedId,
  onSelectOption,
  onBack,
  ctaLabel = "Submit",
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    defaultSelectedId || options[0]?.id || "",
  );

  if (!options || options.length === 0) {
    return null;
  }

  const selectedOption = options.find((o) => o.id === selectedId) || options[0];

  const handleCardClick = (opt: OptionItem) => {
    setSelectedId(opt.id);
  };

  const handleGenerate = () => {
    if (selectedOption && onSelectOption) {
      onSelectOption(selectedOption);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {onBack && (
          <button
            className={styles.backBtn}
            onClick={onBack}
            type="button"
            aria-label="Go Back"
          >
            ← Back
          </button>
        )}
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.grid}>
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;

          return (
            <div
              key={opt.id}
              className={`${styles.optionCard} ${
                isSelected ? styles.optionCardActive : ""
              }`}
              onClick={() => handleCardClick(opt)}
            >
              {opt.image || opt.icon ? (
                <div className={styles.cardIcon}>
                  {renderImage(opt.image || opt.icon, opt.label)}
                </div>
              ) : (
                <div className={styles.cardIcon} style={{ fontSize: "20px" }}>
                  ✨
                </div>
              )}

              <span className={styles.cardLabel}>{opt.label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleGenerate}
          disabled={!selectedId}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};
