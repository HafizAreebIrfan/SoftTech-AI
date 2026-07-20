import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const travelMock = {
  title: "FlightFinder Engines",
  subtitle: "ORD (Chicago) to CDG (Paris) Flights",
  layout: "list",
  blocks: [
    {
      type: "list",
      title: "Best Fares",
      listItems: [
        {
          title: "Air France AF-85",
          description:
            "Non-stop • 8h 15m • Boeing 777-300ER • Dinner served, Wi-Fi onboard.",
          meta: "$680",
        },
        {
          title: "United Airlines UA-987",
          description:
            "Non-stop • 8h 30m • Boeing 787 Dreamliner • USB ports at every seat, power outlets.",
          meta: "$720",
        },
        {
          title: "Lufthansa LH-431 (1 Stop)",
          description:
            "Layover in Frankfurt FRA (1h 45m) • Total time: 10h 30m • Airbus A340.",
          meta: "$590",
        },
      ],
    },
  ] as WidgetBlock[],
};
