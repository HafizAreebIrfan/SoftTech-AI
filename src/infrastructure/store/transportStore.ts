import { create } from "zustand";
import { RideBooking, TransitRoute, VehicleDriver } from "../../types/transport";

interface TransportState {
  perspective: 'subscriber' | 'provider';
  bookings: RideBooking[];
  routes: TransitRoute[];
  drivers: VehicleDriver[];
  rideModalOpen: boolean;

  setPerspective: (val: 'subscriber' | 'provider') => void;
  openRideModal: () => void;
  closeRideModal: () => void;

  requestRide: (passengerName: string, pickupLocation: string, dropoffLocation: string, fare: number) => void;
  updateRideStatus: (id: string, status: RideBooking['status']) => void;
  toggleRouteStatus: (id: string) => void;
  toggleDriverAvailability: (id: string) => void;
  resetStore: () => void;
}

const INITIAL_BOOKINGS: RideBooking[] = [
  { id: "ride_801", passengerName: "Miles Morales", pickupLocation: "Brooklyn, NY", dropoffLocation: "Midtown Manhattan", fare: 24.50, status: "In Ride" },
  { id: "ride_802", passengerName: "Gwen Stacy", pickupLocation: "Queens, NY", dropoffLocation: "JFK Airport", fare: 48.00, status: "Assigned" },
  { id: "ride_803", passengerName: "Peter Parker", pickupLocation: "Forest Hills", dropoffLocation: "Daily Bugle HQ", fare: 18.00, status: "Completed" }
];

const INITIAL_ROUTES: TransitRoute[] = [
  { id: "rt_1", routeName: "Express Shuttle #4", origin: "Downtown Central", destination: "Tech Innovation Hub", frequency: "Every 10 Mins", status: "Active" },
  { id: "rt_2", routeName: "Airport Loop #A1", origin: "Grand Terminal", destination: "Terminal 4 Intl", frequency: "Every 15 Mins", status: "Active" },
  { id: "rt_3", routeName: "Harbor Ferry Route", origin: "Pier 39", destination: "North Island", frequency: "Every 30 Mins", status: "Delayed" }
];

const INITIAL_DRIVERS: VehicleDriver[] = [
  { id: "drv_10", name: "Logan Howlett", vehicleModel: "CyberTruck Heavy Duty", rating: 4.95, status: "Busy" },
  { id: "drv_11", name: "Wade Wilson", vehicleModel: "Yellow Cab Sedan", rating: 4.60, status: "Online" },
  { id: "drv_12", name: "Laura Kinney", vehicleModel: "EV Transit Van", rating: 4.88, status: "Online" }
];

export const useTransportStore = create<TransportState>((set, get) => ({
  perspective: 'subscriber',
  bookings: INITIAL_BOOKINGS,
  routes: INITIAL_ROUTES,
  drivers: INITIAL_DRIVERS,
  rideModalOpen: false,

  setPerspective: (val) => set({ perspective: val }),
  openRideModal: () => set({ rideModalOpen: true }),
  closeRideModal: () => set({ rideModalOpen: false }),

  requestRide: (passengerName, pickupLocation, dropoffLocation, fare) => {
    const { bookings } = get();
    const newRide: RideBooking = {
      id: `ride_${Math.floor(800 + Math.random() * 100)}`,
      passengerName,
      pickupLocation,
      dropoffLocation,
      fare,
      status: "Requested"
    };
    set({
      bookings: [newRide, ...bookings],
      rideModalOpen: false
    });
  },

  updateRideStatus: (id, status) => {
    const { bookings } = get();
    set({
      bookings: bookings.map((b) => b.id === id ? { ...b, status } : b)
    });
  },

  toggleRouteStatus: (id) => {
    const { routes } = get();
    set({
      routes: routes.map((rt) => rt.id === id ? { ...rt, status: rt.status === 'Active' ? 'Suspended' : 'Active' } : rt)
    });
  },

  toggleDriverAvailability: (id) => {
    const { drivers } = get();
    set({
      drivers: drivers.map((d) => d.id === id ? { ...d, status: d.status === 'Online' ? 'Offline' : 'Online' } : d)
    });
  },

  resetStore: () => set({
    perspective: 'subscriber',
    bookings: INITIAL_BOOKINGS,
    routes: INITIAL_ROUTES,
    drivers: INITIAL_DRIVERS,
    rideModalOpen: false
  })
}));
