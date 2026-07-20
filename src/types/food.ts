export interface FoodMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export interface FoodOrder {
  id: string;
  customerName: string;
  items: string[];
  totalAmount: number;
  status: 'Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  timestamp: string;
}

export interface RestaurantStats {
  ordersCount: number;
  grossRevenue: number;
  averagePrepTime: number;
}
