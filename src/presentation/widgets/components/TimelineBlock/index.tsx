import React from "react";
import { WidgetTimelineEvent } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/timelineblock.module.css";

interface TimelineBlockProps {
  title?: string;
  events: WidgetTimelineEvent[];
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ title, events = [] }) => {
  if (!events || events.length === 0) return null;

  return (
    <div className={styles.container}>
      {title && <h4 className={styles.title}>{title}</h4>}

      <div className={styles.timelineList}>
        {events.map((event, idx) => (
          <div key={event.id || idx} className={styles.eventItem}>
            <span className={styles.eventDot} />
            <div className={styles.eventHeader}>
              <h5 className={styles.eventTitle}>{event.title}</h5>
              {event.date && <span className={styles.eventDate}>{event.date}</span>}
            </div>
            {event.subtitle && (
              <p className={styles.eventSubtitle}>{event.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
