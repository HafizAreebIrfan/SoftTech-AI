export { pricingPlans } from "./pricingPlans";
export { faqItems } from "./faqItems";
export { industryTemplates } from "./industryTemplates";
import { ecommerceMock } from "./ecommerce";
import { saasMock } from "./saas";
import { fintechMock } from "./fintech";
import { aiMock } from "./ai";
import { logisticsMock } from "./logistics";
import { healthtechMock } from "./healthtech";
import { foodMock } from "./food";
import { travelMock } from "./travel";
import { forecastingMock } from "./forecasting";
import { generalMock } from "./general";
import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const MOCK_INDUSTRY_DATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    layout: string;
    blocks: WidgetBlock[];
  }
> = {
  ecommerce: ecommerceMock,
  saas: saasMock,
  fintech: fintechMock,
  ai: aiMock,
  logistics: logisticsMock,
  healthtech: healthtechMock,
  food: foodMock,
  travel: travelMock,
  forecasting: forecastingMock,
  general: generalMock,
};
