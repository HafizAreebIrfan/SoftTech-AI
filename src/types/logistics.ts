export interface ShipmentRouteStep {
  time: string;
  location: string;
  description: string;
}

export interface Shipment {
  id: string;
  trackerCode: string;
  sender: string;
  recipient: string;
  status: 'Pending' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Failed';
  origin: string;
  destination: string;
  estimatedDelivery: string;
  weight: string;
  routeHistory: ShipmentRouteStep[];
}

export interface FleetDriver {
  id: string;
  name: string;
  vehicle: string;
  status: 'Active' | 'Offline';
  phone: string;
}
