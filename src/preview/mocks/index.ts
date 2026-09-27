import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";
import type { CartItemData } from "../../infrastructure/store/cartStore";
import { catalogPayload } from "./catalog";
import { mapCatalogPayload } from "./mapcatalog";
import { tablePayload } from "./table";
import { dashboardPayload } from "./dashboard";
import { detailBookingPayload, detailNoAvailabilityPayload } from "./detail";
import { productDetailPayload } from "./productDetail";
import { weatherPayload } from "./weather";
import { aqiPayload } from "./aqi";
import { cartPayload, cartItems } from "./cart";

export interface PreviewFixture {
  /** Label shown in the preview toolbar dropdown. */
  label: string;
  /** The tool result the widget renders. */
  payload: McpToolResultPayload;
  /** "cart" fixtures also seed the cart store and open the full-cart overlay. */
  kind?: "cart";
  /** Items to seed into the cart store (only read for kind === "cart"). */
  cartItems?: CartItemData[];
}

/**
 * Every layout the generic widget can render, each backed by a realistic
 * fixture. The preview toolbar maps over this list. These fixtures double as a
 * living reference for the exact `structuredContent` shape the backend emits.
 */
const mapOnlyPayload: McpToolResultPayload = {
  ...mapCatalogPayload,
  structuredContent: {
    ...mapCatalogPayload.structuredContent,
    title: "Map-Only View (Cars)",
    metadata: {
      uiEnabled: false,
      mapEnabled: true,
      mapOnly: true,
    },
  },
};

export const PREVIEW_FIXTURES: PreviewFixture[] = [
  { label: "Catalog (products)", payload: catalogPayload },
  { label: "Map catalog (cars)", payload: mapCatalogPayload },
  { label: "Map-Only Mode (UI disabled, Map enabled)", payload: mapOnlyPayload },
  { label: "Table (orders · admin)", payload: tablePayload },
  { label: "Dashboard (admin)", payload: dashboardPayload },
  { label: "Detail — booking calendar", payload: detailBookingPayload },
  { label: "Detail — no availability data", payload: detailNoAvailabilityPayload },
  { label: "Product detail", payload: productDetailPayload },
  { label: "Weather", payload: weatherPayload },
  { label: "Air quality (AQI)", payload: aqiPayload },
  { label: "Cart overlay", payload: cartPayload, kind: "cart", cartItems },
];

