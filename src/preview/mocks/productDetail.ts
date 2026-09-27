import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";

/**
 * Single product detail (non-rental) → general layout, ARRAY-OF-ONE `data`.
 * Exercises the product detail branch: gallery, specs, add-to-cart / quantity.
 */
export const productDetailPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Aurora Wireless Headphones",
    subtitle: "Auralux · Audio",
    data: [
      {
        id: 1,
        title: "Aurora Wireless Headphones",
        brand: "Auralux",
        category: "audio",
        price: 129.99,
        originalPrice: 158.99,
        discountPercentage: 18,
        rating: 4.6,
        reviewsCount: 342,
        stock: 42,
        availabilityStatus: "In Stock",
        sku: "AUR-HP-001",
        warrantyInformation: "1 year limited warranty",
        shippingInformation: "Ships in 1-2 business days",
        image: "https://picsum.photos/seed/headphones/1200/900",
        images: [
          "https://picsum.photos/seed/headphones/1200/900",
          "https://picsum.photos/seed/headphonesb/1200/900",
          "https://picsum.photos/seed/headphonesc/1200/900",
        ],
        description:
          "Over-ear active-noise-cancelling headphones with 40h battery, USB-C fast charge, multipoint Bluetooth and a comfortable memory-foam headband.",
        features: [
          "Active noise cancelling",
          "40h battery",
          "USB-C fast charge",
          "Multipoint Bluetooth",
        ],
        reviews: [
          {
            reviewerName: "Sam K.",
            rating: 5,
            comment: "Best ANC I've owned at this price. Battery is unreal.",
            date: "2026-08-12",
          },
          {
            reviewerName: "Elena M.",
            rating: 4,
            comment: "Great sound, slightly tight clamp for the first week.",
            date: "2026-08-25",
          },
        ],
      },
    ],
    collection: {
      entity: "products",
      layout: "general",
      itemLabel: "product",
    },
    capabilities: { canRead: true },
    actions: [
      { id: "add_to_cart", label: "Add to cart", tool: "add_to_cart", requiresItem: true },
      { id: "view_product", label: "View details", tool: "get_product", requiresItem: true },
    ],
    audience: "customer",
  },
};
