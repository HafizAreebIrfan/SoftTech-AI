import { create } from "zustand";
import { FoodMenuItem, FoodOrder, RestaurantStats } from "../../types/food";

interface FoodState {
  perspective: 'subscriber' | 'provider';
  menu: FoodMenuItem[];
  orders: FoodOrder[];
  stats: RestaurantStats;
  menuModalOpen: boolean;

  setPerspective: (val: 'subscriber' | 'provider') => void;
  openMenuModal: () => void;
  closeMenuModal: () => void;

  placeOrder: (customerName: string, items: string[], totalAmount: number) => void;
  updateOrderStatus: (id: string, status: FoodOrder['status']) => void;
  addMenuItem: (name: string, category: string, price: number) => void;
  toggleItemAvailability: (id: string) => void;
  resetStore: () => void;
}

const INITIAL_MENU: FoodMenuItem[] = [
  { id: "itm_1", name: "Truffle Mushroom Burger", category: "Gourmet Mains", price: 18.50, available: true },
  { id: "itm_2", name: "Artisanal Margherita Pizza", category: "Pizza & Pasta", price: 16.00, available: true },
  { id: "itm_3", name: "Matcha Latte Crème", category: "Beverages", price: 6.50, available: true },
  { id: "itm_4", name: "Spicy Ramen Bowl", category: "Gourmet Mains", price: 15.00, available: false }
];

const INITIAL_ORDERS: FoodOrder[] = [
  { id: "ord_101", customerName: "Peter Parker", items: ["Truffle Mushroom Burger", "Matcha Latte Crème"], totalAmount: 25.00, status: "Preparing", timestamp: "12:42 PM" },
  { id: "ord_102", customerName: "Bruce Banner", items: ["Spicy Ramen Bowl"], totalAmount: 15.00, status: "Out for Delivery", timestamp: "12:35 PM" },
  { id: "ord_103", customerName: "Wanda Maximoff", items: ["Artisanal Margherita Pizza"], totalAmount: 16.00, status: "Delivered", timestamp: "12:10 PM" }
];

export const useFoodStore = create<FoodState>((set, get) => ({
  perspective: 'subscriber',
  menu: INITIAL_MENU,
  orders: INITIAL_ORDERS,
  stats: {
    ordersCount: 142,
    grossRevenue: 3840.50,
    averagePrepTime: 14 // mins
  },
  menuModalOpen: false,

  setPerspective: (val) => set({ perspective: val }),
  openMenuModal: () => set({ menuModalOpen: true }),
  closeMenuModal: () => set({ menuModalOpen: false }),

  placeOrder: (customerName, items, totalAmount) => {
    const { orders, stats } = get();
    const newOrd: FoodOrder = {
      id: `ord_${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      items,
      totalAmount,
      status: "Placed",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    set({
      orders: [newOrd, ...orders],
      stats: {
        ...stats,
        ordersCount: stats.ordersCount + 1,
        grossRevenue: stats.grossRevenue + totalAmount
      }
    });
  },

  updateOrderStatus: (id, status) => {
    const { orders } = get();
    set({
      orders: orders.map((o) => o.id === id ? { ...o, status } : o)
    });
  },

  addMenuItem: (name, category, price) => {
    const { menu } = get();
    const newItem: FoodMenuItem = {
      id: `itm_${Date.now()}`,
      name,
      category,
      price,
      available: true
    };
    set({
      menu: [...menu, newItem],
      menuModalOpen: false
    });
  },

  toggleItemAvailability: (id) => {
    const { menu } = get();
    set({
      menu: menu.map((itm) => itm.id === id ? { ...itm, available: !itm.available } : itm)
    });
  },

  resetStore: () => set({
    perspective: 'subscriber',
    menu: INITIAL_MENU,
    orders: INITIAL_ORDERS,
    stats: { ordersCount: 142, grossRevenue: 3840.50, averagePrepTime: 14 },
    menuModalOpen: false
  })
}));
