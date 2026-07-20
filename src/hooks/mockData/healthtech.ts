import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const healthtechMock = {
  title: "MediTelemetry Clinical Feed",
  subtitle: "Patient ID: #48-991 - Bed 12 Live Stream",
  layout: "grid",
  blocks: [
    {
      type: "metrics",
      title: "Vitals Stream",
      metrics: [
        { label: "Heart Rate", value: "72 bpm", tone: "good" },
        { label: "Blood Oxygen", value: "98%", tone: "good" },
        { label: "Blood Pressure", value: "120/80", tone: "good" },
        { label: "Body Temp", value: "36.8°C", tone: "good" },
      ],
    },
    {
      type: "keyValue",
      title: "Clinical Schedules",
      keyValueItems: [
        {
          key: "Scheduled Treatment",
          value: "Insulin 2.5ml injection",
          tone: "good",
        },
        {
          key: "On-duty Doctor",
          value: "Dr. Sarah Adams (Cardiology)",
          tone: "default",
        },
        { key: "Admission Status", value: "Stable - Monitoring", tone: "good" },
      ],
    },
  ] as WidgetBlock[],
};
