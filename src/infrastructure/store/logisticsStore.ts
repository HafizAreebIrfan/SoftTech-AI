import { create } from "zustand";
import { Shipment, FleetDriver } from "../../types/logistics";

interface LogisticsState {
  perspective: 'subscriber' | 'provider';
  shipments: Shipment[];
  selectedShipmentId: string;
  drivers: FleetDriver[];
  trackingSearchQuery: string;
  onboardShipmentModalOpen: boolean;

  // Actions
  setPerspective: (val: 'subscriber' | 'provider') => void;
  setSelectedShipmentId: (id: string) => void;
  setTrackingSearchQuery: (query: string) => void;
  openOnboardShipmentModal: () => void;
  closeOnboardShipmentModal: () => void;
  
  createShipment: (sender: string, recipient: string, origin: string, destination: string, weight: string) => void;
  updateShipmentStatus: (id: string, status: Shipment['status']) => void;
  toggleDriverStatus: (id: string) => void;
  resetStore: () => void;
}

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: "shp_1",
    trackerCode: "TRK-4819",
    sender: "Apex Logistics Corp",
    recipient: "Stark Industries",
    status: "In Transit",
    origin: "Los Angeles, CA",
    destination: "New York, NY",
    estimatedDelivery: "2026-07-22",
    weight: "45.8 kg",
    routeHistory: [
      { time: "10:30 AM", location: "Warehouse Grid A-4", description: "Shipment routed to carrier sort facility." },
      { time: "02:15 PM", location: "Transit Hub - LAX", description: "Departed sorting facility and en route." }
    ]
  },
  {
    id: "shp_2",
    trackerCode: "TRK-9281",
    sender: "Wayne Research Labs",
    recipient: "Gotham Central",
    status: "Out for Delivery",
    origin: "Gotham North",
    destination: "Gotham Central",
    estimatedDelivery: "2026-07-20",
    weight: "2.4 kg",
    routeHistory: [
      { time: "07:00 AM", location: "Distribution Station C", description: "Package sorted and assigned to delivery driver." },
      { time: "09:00 AM", location: "Gotham Expressway", description: "Out for delivery with driver Lucius Fox." }
    ]
  },
  {
    id: "shp_3",
    trackerCode: "TRK-3104",
    sender: "E-Corp Hardware Inc",
    recipient: "Allsafe Cyber Security",
    status: "Delivered",
    origin: "Seattle, WA",
    destination: "New York, NY",
    estimatedDelivery: "2026-07-18",
    weight: "12.0 kg",
    routeHistory: [
      { time: "08:00 AM", location: "JFK Hub", description: "Out for local delivery." },
      { time: "01:30 PM", location: "Reception Desk", description: "Delivered and signed for by Elliot Alderson." }
    ]
  }
];

const INITIAL_DRIVERS: FleetDriver[] = [
  { id: "drv_1", name: "Steve Rogers", vehicle: "Semi-Truck (E-450)", status: "Active", phone: "+1 (555) 012-3849" },
  { id: "drv_2", name: "Natasha Romanoff", vehicle: "Express Cargo Van", status: "Active", phone: "+1 (555) 093-4920" },
  { id: "drv_3", name: "Bruce Banner", vehicle: "Heavy Loader (M-100)", status: "Offline", phone: "+1 (555) 238-9281" }
];

export const useLogisticsStore = create<LogisticsState>((set, get) => ({
  perspective: 'subscriber',
  shipments: INITIAL_SHIPMENTS,
  selectedShipmentId: "shp_1",
  drivers: INITIAL_DRIVERS,
  trackingSearchQuery: "",
  onboardShipmentModalOpen: false,

  setPerspective: (val) => set({ perspective: val }),
  setSelectedShipmentId: (id) => set({ selectedShipmentId: id }),
  setTrackingSearchQuery: (query) => set({ trackingSearchQuery: query }),
  
  openOnboardShipmentModal: () => set({ onboardShipmentModalOpen: true }),
  closeOnboardShipmentModal: () => set({ onboardShipmentModalOpen: false }),

  createShipment: (sender, recipient, origin, destination, weight) => {
    const { shipments } = get();
    const trackerNum = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `shp_${Date.now()}`;
    const newShipment: Shipment = {
      id: newId,
      trackerCode: trackerNum,
      sender,
      recipient,
      status: "Pending",
      origin,
      destination,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weight,
      routeHistory: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: origin,
          description: "Manifest received. Shipment pending pickup."
        }
      ]
    };
    set({
      shipments: [...shipments, newShipment],
      selectedShipmentId: newId,
      onboardShipmentModalOpen: false
    });
  },

  updateShipmentStatus: (id, status) => {
    const { shipments } = get();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    set({
      shipments: shipments.map((shp) => {
        if (shp.id === id) {
          const stepMsg = 
            status === 'In Transit' ? "Departed facility and in transit." :
            status === 'Out for Delivery' ? "Out for local delivery with carrier driver." :
            status === 'Delivered' ? "Package delivered and signed." : "Delivery failed. Will retry.";
          return {
            ...shp,
            status,
            routeHistory: [
              ...shp.routeHistory,
              { time: timeStr, location: shp.destination, description: stepMsg }
            ]
          };
        }
        return shp;
      })
    });
  },

  toggleDriverStatus: (id) => {
    const { drivers } = get();
    set({
      drivers: drivers.map(d => d.id === id ? { ...d, status: d.status === "Active" ? "Offline" : "Active" } : d)
    });
  },

  resetStore: () => set({
    perspective: 'subscriber',
    shipments: INITIAL_SHIPMENTS,
    selectedShipmentId: "shp_1",
    drivers: INITIAL_DRIVERS,
    trackingSearchQuery: "",
    onboardShipmentModalOpen: false
  })
}));
