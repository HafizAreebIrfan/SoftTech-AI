import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const foodMock = {
  title: "Bistro 88 Orders Queue",
  subtitle: "Active kitchen tickets & table service status",
  layout: "grid",
  blocks: [
    {
      type: "list",
      title: "Orders Queue",
      listItems: [
        {
          title: "Table 14 - Ribeye Steak",
          description:
            "Medium-rare, extra rosemary butter glaze, substitution: roasted potatoes instead of fries.",
          meta: "12 min ago",
        },
        {
          title: "Table 5 - Garlic Butter Prawns",
          description:
            "No parsley, double fresh lemon slices, extra warm garlic bread slice.",
          meta: "5 min ago",
        },
        {
          title: "Table 2 - Classic Caesar Salad",
          description:
            "Dressing on the side, add grilled organic chicken breast strips, extra parmesan shavings.",
          meta: "1 min ago",
        },
      ],
    },
  ] as WidgetBlock[],
};
