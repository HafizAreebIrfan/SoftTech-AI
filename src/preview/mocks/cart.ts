import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";
import type { CartItemData } from "../../infrastructure/store/cartStore";

/**
 * Cart fixture — a catalog base payload plus a set of items to seed into the
 * cart store, so the preview can render the full-cart overlay. The payload
 * deliberately omits `metadata.companyName`: GenericWidget only calls
 * `setCompanyName` when a company name is present, so leaving it out means the
 * seeded items are never reloaded/wiped when this fixture mounts.
 */
export const cartPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Products",
    subtitle: "Your cart",
    data: {
      products: [
        {
          id: 1,
          title: "Aurora Wireless Headphones",
          brand: "Auralux",
          category: "audio",
          price: 129.99,
          discountPercentage: 18,
          rating: 4.6,
          stock: 42,
          thumbnail: "https://picsum.photos/seed/headphones/800/600",
        },
        {
          id: 6,
          title: "Cadence Running Shoes",
          brand: "Cadence",
          category: "footwear",
          price: 118.0,
          discountPercentage: 30,
          rating: 4.7,
          stock: 21,
          thumbnail: "https://picsum.photos/seed/shoes/800/600",
        },
      ],
      total: 2,
    },
    collection: {
      entity: "products",
      dataPath: "products",
      layout: "catalog",
      itemLabel: "product",
      total: 2,
    },
    capabilities: { canSearch: true, canFilter: true, canSort: true },
    actions: [
      { id: "add_to_cart", label: "Add to cart", tool: "add_to_cart", requiresItem: true },
    ],
    audience: "customer",
  },
};

export const cartItems: CartItemData[] = [
  {
    id: 1,
    title: "Aurora Wireless Headphones",
    price: 129.99,
    image: "https://picsum.photos/seed/headphones/800/600",
    quantity: 1,
    specs: { color: "Midnight", brand: "Auralux" },
  },
  {
    id: 6,
    title: "Cadence Running Shoes",
    price: 118.0,
    image: "https://picsum.photos/seed/shoes/800/600",
    quantity: 2,
    tier: "US 10",
    specs: { color: "Slate" },
  },
];
