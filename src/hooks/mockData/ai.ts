import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const aiMock = {
  title: "AuraPipeline Agent Threads",
  subtitle: "Autonomous pipelines and task workloads",
  layout: "list",
  blocks: [
    {
      type: "metrics",
      title: "Pipeline Telemetry",
      metrics: [
        { label: "Active Workers", value: "14 Agents", tone: "good" },
        { label: "Tasks Completed", value: "24,912", tone: "good" },
        { label: "GPU Temperature", value: "62°C", tone: "warning" },
      ],
    },
    {
      type: "list",
      title: "Agent Execution Feed",
      listItems: [
        {
          title: "PDF Summarizer Complete",
          description:
            "Extracted and mapped 120 corporate financial statements in 14.2s with LLM subagent.",
          meta: "Success",
        },
        {
          title: "Vector DB Reloaded",
          description:
            "Successfully upserted 4,200 paragraph chunks into Qdrant collection cluster 'main_v2'.",
          meta: "Success",
        },
        {
          title: "API Sync Pipeline Failed",
          description:
            "OAuth credentials for external vendor sandbox expired. Will retry in 10 minutes.",
          meta: "Failed",
        },
      ],
    },
  ] as WidgetBlock[],
};
