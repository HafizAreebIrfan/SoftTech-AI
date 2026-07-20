import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const logisticsMock = {
  title: "SwiftRoute Shipment Tracker",
  subtitle: "Tracking Reference ID: #SR-8840",
  layout: "list",
  blocks: [
    {
      type: "list",
      title: "Shipment Checkpoints",
      listItems: [
        {
          title: "Out for Delivery",
          description:
            "Courier vehicle #14 departed local depot. Estimated delivery window: 2:00 PM - 4:00 PM.",
          meta: "08:15 AM",
        },
        {
          title: "Arrived at Sorting Hub",
          description:
            "Cargo scan verified at Chicago regional distribution center sorting dock.",
          meta: "Yesterday",
        },
        {
          title: "Customs Clearance Complete",
          description:
            "Import duties verified, customs clearance stamps issued, transit route loaded.",
          meta: "2 days ago",
        },
        {
          title: "Departed Origin Facility",
          description:
            "Carrier picked up package, manifest scanned and validated.",
          meta: "3 days ago",
        },
      ],
    },
  ] as WidgetBlock[],
};
