import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const generalMock = {
  title: "Core Business Insights",
  subtitle: "Corporate performance dashboard",
  layout: "grid",
  blocks: [
    {
      type: "metrics",
      title: "Operational Stats",
      metrics: [
        { label: "Daily Active Users", value: "142,500", tone: "good" },
        { label: "Net Revenue Stream", value: "$18,450", tone: "good" },
        { label: "NPS Score", value: "78", tone: "good" },
      ],
    },
  ] as WidgetBlock[],
};
