import { create } from "zustand";

export interface CartItemData {
  id: string | number;
  title: string;
  price: number | string;
  image?: string | null;
  quantity: number;
  tier?: string;
  specs?: Record<string, unknown>;
  options?: Record<string, string | number>;
}

export interface CartStore {
  items: CartItemData[];
  isOpen: boolean;
  viewFullCart: boolean;
  companyName?: string;
  setCompanyName: (name: string) => void;
  addItem: (item: Omit<CartItemData, "quantity">, quantity?: number) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setViewFullCart: (v: boolean) => void;
  getTotalCount: () => number;
  getSubtotal: () => number;
}

export const parseNumericPrice = (price: unknown): number => {
  if (typeof price === "number") return isNaN(price) ? 0 : price;
  if (typeof price === "string") {
    // Strip currency symbols and whitespace
    const cleaned = price.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getStorageKey = (companyName?: string) =>
  `softtech_cart_${(companyName || "global").toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

const loadCartFromStorage = (companyName?: string): CartItemData[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(companyName));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return [];
};

const saveCartToStorage = (items: CartItemData[], companyName?: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(companyName), JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadCartFromStorage(),
  isOpen: false,
  viewFullCart: false,
  companyName: undefined,

  setCompanyName: (name: string) => {
    if (get().companyName === name) return;
    const loadedItems = loadCartFromStorage(name);
    set({ companyName: name, items: loadedItems });
  },

  addItem: (item, quantity = 1) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(
      (i) => i.id === item.id && (item.tier ? i.tier === item.tier : true),
    );

    let updated: CartItemData[];
    if (existingIndex > -1) {
      updated = currentItems.map((i, idx) =>
        idx === existingIndex
          ? { ...i, quantity: i.quantity + Math.max(1, quantity) }
          : i,
      );
    } else {
      updated = [
        ...currentItems,
        {
          ...item,
          quantity: Math.max(1, quantity),
        },
      ];
    }

    saveCartToStorage(updated, get().companyName);
    // Do NOT auto-open the cart here. Whether the cart opens is decided by the
    // caller (addToCartAndSync): if the company has a registered cart/order
    // tool we render the tool's result in the same widget; otherwise we open
    // the local cart overlay. Keeping the side-effect here caused the cart to
    // pop with the wrong (catalog) data.
    set({ items: updated });
  },

  removeItem: (id) => {
    const updated = get().items.filter((i) => i.id !== id);
    saveCartToStorage(updated, get().companyName);
    set({ items: updated });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    const updated = get().items.map((i) =>
      i.id === id ? { ...i, quantity } : i,
    );
    saveCartToStorage(updated, get().companyName);
    set({ items: updated });
  },

  clearCart: () => {
    saveCartToStorage([], get().companyName);
    set({ items: [], viewFullCart: false });
  },

  openCart: () => set({ viewFullCart: true }),
  closeCart: () => set({ isOpen: false, viewFullCart: false }),
  toggleCart: () => set((state) => ({ viewFullCart: !state.viewFullCart })),
  setViewFullCart: (v) => set({ viewFullCart: v }),

  getTotalCount: () => {
    return get().items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  },

  getSubtotal: () => {
    return get().items.reduce((acc, item) => {
      const price = parseNumericPrice(item.price);
      return acc + price * (item.quantity || 1);
    }, 0);
  },
}));

/* ------------------------------------------------------------------ *
 * Cart-tool detection + cart-data mapping (generic, verb-based).
 * ------------------------------------------------------------------ */

/**
 * Detect the company's "add to cart / create order / book / reserve" tool from
 * its registered actions. Purely verb-based (no company/entity/industry names),
 * mirroring the existing action classifier. Excludes list/detail reads,
 * destructive mutations, and the separate checkout/payment step, so adding an
 * item never fires the wrong tool. Requires a `tool` (URL-only buttons skipped).
 */
const CART_ADD_RE =
  /(add.?to.?cart|add.?to.?bag|add.?item|create.?order|place.?order|new.?order|create.?booking|make.?booking|book|reserve|buy|purchase|subscribe|order)/i;
const CART_EXCLUDE_RE =
  /(get|list|view|show|detail|search|fetch|read|all|cancel|delete|remove|update|edit|refund|return|checkout|proceed|\bpay\b|payment)/i;

export const findCartAction = <T extends { id?: string; tool?: string }>(
  actions: T[] = [],
): T | undefined =>
  actions.find((a) => {
    if (!a || !a.tool) return false;
    const text = `${a.id ?? ""} ${a.tool ?? ""}`.toLowerCase();
    if (CART_EXCLUDE_RE.test(text)) return false;
    return CART_ADD_RE.test(text);
  });

/** Shape consumed by CartLayout (`data.products` / `total` / `totalQuantity`). */
export interface CartData {
  products: Array<{
    id: string | number;
    title: string;
    price: number;
    quantity: number;
    total: number;
    thumbnail?: string | null;
  }>;
  total: number;
  totalQuantity: number;
  totalProducts: number;
}

/** Map the local Zustand cart items into CartLayout's expected `data` shape. */
export const buildCartDataFromItems = (items: CartItemData[]): CartData => {
  const products = items.map((item) => {
    const price = parseNumericPrice(item.price);
    const quantity = item.quantity || 1;
    return {
      id: item.id,
      title: item.title,
      price,
      quantity,
      total: price * quantity,
      thumbnail: item.image ?? null,
    };
  });

  return {
    products,
    total: products.reduce((acc, p) => acc + p.total, 0),
    totalQuantity: products.reduce((acc, p) => acc + p.quantity, 0),
    totalProducts: products.length,
  };
};
