import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";

/**
 * Single-record detail fixtures. `data` is an ARRAY-OF-ONE so the renderer's
 * record-extraction keeps the whole object as the record (an inner array such
 * as `images`/`features`/`reviews` would otherwise be mis-picked). entity
 * "cars" makes DetailBlock treat it as a rental (booking box + calendar).
 *
 * Two variants:
 *  - detailBookingPayload:      has `conflictingBookings` (+ appliedQuery dates)
 *    → the calendar renders with those ranges blocked.
 *  - detailNoAvailabilityPayload: carries NO availability signal of any kind
 *    (no conflictingBookings/bookings, no available/open/slots/dates keys, no
 *    availability action) → the calendar is hidden and plain date inputs show.
 */
const baseCar = {
  id: "car-1",
  make: "Tesla",
  model: "Model 3 Long Range",
  year: 2023,
  color: "Pearl White",
  category: "Electric Sedan",
  image: "https://picsum.photos/seed/tesla3/1200/800",
  images: [
    "https://picsum.photos/seed/tesla3/1200/800",
    "https://picsum.photos/seed/tesla3b/1200/800",
    "https://picsum.photos/seed/tesla3c/1200/800",
  ],
  pricePerDay: 79,
  currency: "USD",
  deposit: 300,
  fuelType: "Electric",
  transmission: "Automatic",
  seats: 5,
  doors: 4,
  mileage: "Unlimited",
  rating: 4.8,
  reviewsCount: 214,
  status: "Available",
  isFavourite: false,
  location: { city: "New York", name: "Downtown Hub", address: "120 Broadway" },
  description:
    "A quick, quiet all-electric sedan with a 358-mile range, autopilot and a minimalist cabin. Ideal for city trips and longer drives alike.",
  features: [
    "Autopilot",
    "Heated seats",
    "Glass roof",
    "Wireless charging",
    "360° cameras",
    "Premium audio",
  ],
  reviews: [
    {
      reviewerName: "Daniel R.",
      rating: 5,
      comment: "Spotless car, effortless pickup, incredible range.",
      date: "2026-08-21",
    },
    {
      reviewerName: "Priya S.",
      rating: 4,
      comment: "Great drive. Charging on the road took a little planning.",
      date: "2026-08-30",
    },
  ],
};

export const detailBookingPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Tesla Model 3 Long Range",
    subtitle: "Downtown Hub · New York",
    data: [
      {
        ...baseCar,
        conflictingBookings: [
          { status: "CONFIRMED", pickupDate: "2026-09-20", dropoffDate: "2026-09-24" },
          { status: "CONFIRMED", pickupDate: "2026-10-01", dropoffDate: "2026-10-03" },
        ],
      },
    ],
    collection: {
      entity: "cars",
      layout: "general",
      itemLabel: "car",
      appliedQuery: { datefrom: "2026-09-15", dateto: "2026-09-18" },
    },
    capabilities: { canRead: true },
    actions: [
      { id: "create_booking", label: "Book now", tool: "create_booking", requiresItem: true },
      {
        id: "toggle_favourite_car",
        label: "Save",
        tool: "toggle_favourite_car",
        requiresItem: true,
      },
    ],
    audience: "customer",
  },
};

export const detailNoAvailabilityPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Toyota Corolla",
    subtitle: "East Village · New York",
    data: [
      {
        id: "car-2",
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        color: "Silver",
        category: "Compact Sedan",
        image: "https://picsum.photos/seed/corolla/1200/800",
        images: [
          "https://picsum.photos/seed/corolla/1200/800",
          "https://picsum.photos/seed/corollab/1200/800",
        ],
        pricePerDay: 45,
        currency: "USD",
        deposit: 200,
        fuelType: "Petrol",
        transmission: "Automatic",
        seats: 5,
        doors: 4,
        mileage: "200 mi/day",
        rating: 4.5,
        reviewsCount: 132,
        status: "Available",
        location: { city: "New York", name: "East Village" },
        description:
          "A dependable, fuel-efficient compact sedan — easy to park and comfortable for four.",
        features: ["Backup camera", "Apple CarPlay", "Lane assist", "Bluetooth"],
      },
    ],
    collection: {
      entity: "cars",
      layout: "general",
      itemLabel: "car",
    },
    capabilities: { canRead: true },
    actions: [
      { id: "create_booking", label: "Book now", tool: "create_booking", requiresItem: true },
      { id: "get_car", label: "Refresh", tool: "get_car", requiresItem: true },
    ],
    audience: "customer",
  },
};
