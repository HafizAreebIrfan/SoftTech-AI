import { WidgetMetric } from "./widgetMetric.types";
import { WidgetKeyValueItem } from "./widgetKeyValue.types";
import { TableColumn } from "./widgetTable.types";
import { WidgetPagination } from "./widgetPagination.types";
import { WidgetFilter } from "./widgetFilter.types";
import { WidgetAction } from "./widgetAction.types";
import { FormField } from "./widgetForm.types";

export type WidgetBlock =
  | {
      type: "metrics";
      title?: string;
      metrics: WidgetMetric[];
    }
  | {
      type: "keyValue";
      title?: string;
      keyValueItems: WidgetKeyValueItem[];
    }
  | {
      type: "list";
      title?: string;
      listItems: {
        title: string;
        description?: string;
        meta?: string;
      }[];
    }
  | {
      type: "table";
      title?: string;
      columns: TableColumn[];
      rows: (string | number)[][];
      pagination?: WidgetPagination;
      filters?: WidgetFilter[];
      actions?: WidgetAction[];
    }
  | {
      type: "cards";
      title?: string;
      cards: {
        id?: string;
        title: string;
        subtitle?: string;
        image?: string;
        icon?: string;
        badge?: string;
        attributes?: {
          label: string;
          value: string | number;
        }[];
        actions?: WidgetAction[];
      }[];
      pagination?: WidgetPagination;
      filters?: WidgetFilter[];
      actions?: WidgetAction[];
    }
  | {
      type: "timeline";
      title?: string;
      events: {
        id?: string;
        title: string;
        subtitle?: string;
        date: string;
        status?: string;
        icon?: string;
      }[];
      pagination?: WidgetPagination;
      filters?: WidgetFilter[];
    }
  | {
      type: "map";
      title?: string;
      markers: {
        id?: string;
        lat: number;
        lng: number;
        title: string;
        description?: string;
        icon?: string;
        badge?: string;
      }[];
    }
  | {
      type: "gallery";
      title?: string;
      subtitle?: string;
      images: {
        url: string;
        title?: string;
      }[];
      pagination?: WidgetPagination;
    }
  | {
      type: "chart";
      title?: string;
      chartType: "bar" | "line" | "pie" | "area";
      xAxisKey: string;
      dataKeys: string[];
      series: Record<string, unknown>[];
    }
  | {
      type: "actions";
      title?: string;
      actions: WidgetAction[];
    }
  | {
      type: "form";
      title?: string;
      fields: FormField[];
      submitAction: string;
    }
  | {
      type: "alert";
      title?: string;
      severity: "info" | "warning" | "error" | "success";
      message: string;
    };
