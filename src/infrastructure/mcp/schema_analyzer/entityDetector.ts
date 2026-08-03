export const detectEntity = (
  apiName?: string,
  endpoint?: string,
  sampleRecord?: Record<string, unknown>,
): string => {
  const combined = `${apiName || ""} ${endpoint || ""}`.toLowerCase();

  if (combined.includes("order")) return "orders";
  if (combined.includes("customer") || combined.includes("user")) return "customers";
  if (combined.includes("product") || combined.includes("item") || combined.includes("catalog")) return "products";
  if (combined.includes("weather") || combined.includes("forecast")) return "weather";
  if (combined.includes("booking") || combined.includes("reservation") || combined.includes("hotel") || combined.includes("flight")) return "bookings";
  if (combined.includes("package") || combined.includes("shipment") || combined.includes("delivery") || combined.includes("tracking")) return "packages";
  if (combined.includes("transaction") || combined.includes("invoice") || combined.includes("payment")) return "transactions";
  if (combined.includes("employee") || combined.includes("staff")) return "employees";
  if (combined.includes("message") || combined.includes("chat") || combined.includes("notification")) return "messages";

  if (sampleRecord) {
    const keys = Object.keys(sampleRecord).map((k) => k.toLowerCase());
    if (keys.some((k) => k.includes("price") || k.includes("amount")) && keys.some((k) => k.includes("image") || k.includes("photo"))) return "products";
    if (keys.some((k) => k.includes("status")) && keys.some((k) => k.includes("date"))) return "orders";
    if (keys.some((k) => k.includes("lat")) && keys.some((k) => k.includes("lng"))) return "locations";
  }

  return apiName ? apiName.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "general";
};
