import React from "react";
import { WidgetCardItem } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/cardsblock.module.css";

interface CardsBlockProps {
  title?: string;
  cards: WidgetCardItem[];
}

export const CardsBlock: React.FC<CardsBlockProps> = ({ title, cards = [] }) => {
  if (!cards || cards.length === 0) return null;

  return (
    <div className={styles.container}>
      {title && <h4 className={styles.title}>{title}</h4>}

      <div className={styles.grid}>
        {cards.map((card, idx) => (
          <div key={card.id || idx} className={styles.card}>
            {card.image && (
              <img
                src={card.image}
                alt={card.title}
                className={styles.image}
              />
            )}
            <div className={styles.headerRow}>
              <h5 className={styles.cardTitle}>{card.title}</h5>
              {card.badge && <span className={styles.badge}>{card.badge}</span>}
            </div>
            {card.subtitle && (
              <p className={styles.subtitle}>{card.subtitle}</p>
            )}
            {card.attributes && card.attributes.length > 0 && (
              <div className={styles.attributeList}>
                {card.attributes.map((attr, aIdx) => (
                  <div key={aIdx} className={styles.attributeRow}>
                    <span className={styles.attributeLabel}>{attr.label}</span>
                    <span className={styles.attributeValue}>{attr.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
