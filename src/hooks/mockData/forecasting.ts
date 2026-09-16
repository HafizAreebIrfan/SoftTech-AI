import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const forecastingMock = {
  title: "Quantum Analytics Engine",
  subtitle: "Predictive demand matrices Q3-Q4",
  layout: "grid",
  blocks: [
    {
      type: "metrics",
      title: "Forecasting Metrics",
      metrics: [
        { label: "Target Growth", value: "+14.2% YoY", tone: "good" },
        { label: "Confidence Value", value: "96.4%", tone: "good" },
        { label: "Processing Latency", value: "14ms", tone: "good" },
        { label: "Anomaly Index", value: "0.02%", tone: "good" },
      ],
    },
    {
      type: "keyValue",
      title: "Evaluation Parameters",
      keyValueItems: [
        {
          key: "Neural Model System",
          value: "GRU-Recurrent neural net v4.8",
          tone: "good",
        },
        {
          key: "Historical Training Dataset",
          value: "12.4M past transactional rows in warehouse",
          tone: "default",
        },
        {
          key: "Feature Engineering Passes",
          value: "24 standard weights updates",
          tone: "default",
        },
      ],
    },
  ] as WidgetBlock[],
};
