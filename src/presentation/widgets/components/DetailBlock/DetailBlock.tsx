import React, { useMemo } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { DetailField } from "./DetailField";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import { useThemeStore } from "../../../../hooks";

export const DetailBlock: React.FC<DetailBlockProps> = ({
  block,
  records = [],
  fields = [],
  collection,
  actions = [],
}) => {
  const targetRecord = records.length > 0 ? (records[0] as any) : null;

  const { headerImage, title, subtitle, detailFields } = useMemo(() => {
    if (!targetRecord) {
      return {
        headerImage: null,
        title: null,
        subtitle: null,
        detailFields: [],
      };
    }

    const activeFields =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    // Filter out internal fields and the ones we already use for the Header
    const primaryRoles = ["title", "description", "image"];

    const detailFields = activeFields.filter((f) => {
      if (f.hidden) return false;
      if (f.type === "array" || f.type === "object" || f.type === "image")
        return false;
      if (primaryRoles.includes(f.uiRole as string)) return false;

      const key = f.key.toLowerCase();
      // Keep your smart imperial duplicate filters!
      if (
        key.endsWith("_f") ||
        key.endsWith("_mph") ||
        key.endsWith("_in") ||
        key.endsWith("_miles")
      )
        return false;
      return true;
    });

    return {
      headerImage: targetRecord.$image || null,
      title: targetRecord.$title || collection?.entity || "Details",
      subtitle: targetRecord.$description || null,
      detailFields,
    };
  }, [targetRecord, block?.fields, fields, collection?.entity]);

  if (!targetRecord) return null;
  const { colors } = useThemeStore();

  return (
    <section className={styles.container}>
      <div
        className={styles.card}
        style={{
          background: "var(--WidgetCardBg)",
          border: "1px solid var(--WidgetCardBorder)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {(headerImage || title || subtitle) && (
          <header
            className={styles.header}
            style={{
              padding: "20px",
              borderBottom: "1px solid var(--TableDivider)",
              background: "var(--BackgroundSecondary)",
            }}
          >
            {headerImage && (
              <div
                className={styles.headerAvatar}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {renderImage(headerImage, title || "Detail Asset")}
              </div>
            )}

            <div className={styles.headerTitleGroup}>
              {title && (
                <h2
                  className={styles.title}
                  style={{ color: "var(--WidgetHeaderTitle)", margin: 0 }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  className={styles.subtitle}
                  style={{
                    color: "var(--WidgetHeaderSubtitle)",
                    margin: "4px 0 0 0",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </header>
        )}

        <div
          className={styles.grid}
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {detailFields.map((field) => (
            <DetailField key={field.key} field={field} record={targetRecord} />
          ))}
        </div>
        {actions && actions.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              gap: "10px",
              borderTop: "1px solid var(--TableDivider)",
              background: "var(--BackgroundSecondary)",
            }}
          >
            {actions.map((act: any) => (
              <button
                key={act.id || act.tool}
                type="button"
                style={{
                  background: colors.BrandIndigo,
                  color: colors.TextHeading,
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  flex: 1,
                }}
                onClick={async () => {
                  if ((window as any).openai?.callTool) {
                    await (window as any).openai.callTool(act.tool, {
                      id: targetRecord?.id || targetRecord?._id,
                    });
                  } else if ((window as any).openai?.sendFollowUpMessage) {
                    (window as any).openai.sendFollowUpMessage({
                      prompt: `Execute ${act.label} for ${targetRecord?.$title || "item"}`,
                    });
                  }
                }}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
