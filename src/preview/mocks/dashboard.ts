import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";

/**
 * Dashboard fixture — admin audience + collection.metrics + collection.charts
 * drive the metrics grid, chart and summary table. appliedQuery.datefrom/dateto
 * render the date-range badge.
 */
const orders = [
  {
    id: 2001,
    orderNumber: "ORD-2001",
    customer: "Ava Bennett",
    total: 259.98,
    status: "Paid",
    createdAt: "2026-09-02",
  },
  {
    id: 2002,
    orderNumber: "ORD-2002",
    customer: "Liam Carter",
    total: 89.0,
    status: "Pending",
    createdAt: "2026-09-04",
  },
  {
    id: 2003,
    orderNumber: "ORD-2003",
    customer: "Noah Diaz",
    total: 412.5,
    status: "Shipped",
    createdAt: "2026-09-05",
  },
  {
    id: 2004,
    orderNumber: "ORD-2004",
    customer: "Mia Foster",
    total: 148.0,
    status: "Paid",
    createdAt: "2026-09-07",
  },
];

export const dashboardPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Sales overview",
    subtitle: "Performance for the selected period",
    data: { orders, total: 4 },
    collection: {
      entity: "orders",
      dataPath: "orders",
      layout: "dashboard",
      itemLabel: "order",
      total: 4,
      metrics: [
        { label: "Revenue", value: "$18,420", change: "+12.4%" },
        { label: "Orders", value: "312", change: "+4.1%" },
        { label: "Avg. order value", value: "$59.04", change: "-1.8%" },
        { label: "Refunds", value: "7", change: "+2" },
      ],
      charts: [
        {
          type: "bar",
          title: "Revenue by day",
          data: [
            { label: "Mon", value: 2100 },
            { label: "Tue", value: 2600 },
            { label: "Wed", value: 1900 },
            { label: "Thu", value: 3200 },
            { label: "Fri", value: 4100 },
            { label: "Sat", value: 2800 },
            { label: "Sun", value: 1720 },
          ],
        },
      ],
      summary: "Revenue is up 12.4% versus the previous period, led by Friday sales.",
      appliedQuery: { datefrom: "2026-09-01", dateto: "2026-09-07" },
      fields: [
        { key: "orderNumber", label: "Order", type: "text", primary: true },
        { key: "customer", label: "Customer", type: "text" },
        { key: "total", label: "Total", type: "currency", sortable: true },
        { key: "status", label: "Status", type: "status" },
        { key: "createdAt", label: "Date", type: "date", sortable: true },
      ],
    },
    capabilities: { canRead: true, canSearch: true, canFilter: true },
    actions: [{ id: "get_order", label: "View", tool: "get_order", requiresItem: true }],
    audience: "admin",
  },
};
