import { WidgetBlock } from "./widgetBlock.types";

export type WidgetMetadata = {
  companyName: string;
  apiName: string;
  generatedAt: string;
  version: string;
};

export type GenericWidgetContent = {
  title: string;
  subtitle?: string;
  layout: string;
  industry?: string;
  blocks: WidgetBlock[];
  metadata?: WidgetMetadata;
};
