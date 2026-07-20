export interface RideBooking {
  id: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  status: 'Requested' | 'Assigned' | 'In Ride' | 'Completed' | 'Cancelled';
}

export interface TransitRoute {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  frequency: string;
  status: 'Active' | 'Delayed' | 'Suspended';
}

export interface VehicleDriver {
  id: string;
  name: string;
  vehicleModel: string;
  rating: number;
  status: 'Online' | 'Busy' | 'Offline';
}
