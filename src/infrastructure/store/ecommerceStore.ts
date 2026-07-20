import { create } from "zustand";
import { Product } from "../../types";
import { PRODUCTS_MOCK } from "../../hooks/mockData/ecommerce";

export interface CartItem {
  product: Product;
  color: string;
  count: number;
}

interface EcommerceState {
  // Catalog / View Settings
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  viewMode: "grid" | "list";
  currentPage: number;

  // Active / Selected Products
  activeProductDetailId: string | null;
  quickViewProduct: Product | null;
  selectedColors: Record<string, string>;
  toastMsg: string | null;

  // Filter Panel States
  showFiltersPanel: boolean;
  filterSizes: string[];
  filterColors: string[];
  filterPrice: string;
  filterRating: number | null;

  // Carousel & Image gallery indices
  detailActiveImageIdx: number;
  quickViewActiveImageIdx: number;

  // Cart
  cart: CartItem[];
  isCartOpen: boolean;

  // Detail Quantity selection
  detailQty: number;

  // Setters & Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sort: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  setActiveProductDetailId: (id: string | null) => void;
  setQuickViewProduct: (product: Product | null) => void;
  setToastMsg: (msg: string | null) => void;
  setShowFiltersPanel: (show: boolean | ((s: boolean) => boolean)) => void;
  toggleSizeFilter: (size: string) => void;
  toggleColorFilter: (color: string) => void;
  setFilterPrice: (price: string) => void;
  setFilterRating: (rating: number | null) => void;
  clearAllFilters: () => void;
  setDetailActiveImageIdx: (idx: number | ((prev: number) => number)) => void;
  setQuickViewActiveImageIdx: (idx: number) => void;
  setIsCartOpen: (open: boolean) => void;
  setDetailQty: (qty: number | ((q: number) => number)) => void;

  // Swatch Handlers
  handleColorChange: (productId: string, color: string) => void;
  handleDetailColorSelect: (productId: string, color: string) => void;
  handleQuickViewColorSelect: (productId: string, color: string) => void;

  // Cart Handlers
  handleAddToCart: (product: Product, color: string, qty: number, e?: React.MouseEvent) => void;
  handleRemoveFromCart: (productId: string, color: string) => void;
  handleUpdateCartQty: (productId: string, color: string, qty: number) => void;
  clearCart: () => void;
}

const getInitialSelectedColors = () => {
  const initialColors: Record<string, string> = {};
  PRODUCTS_MOCK.forEach((p) => {
    initialColors[p.id] = p.colors[0];
  });
  return initialColors;
};

export const useEcommerceStore = create<EcommerceState>((set, get) => ({
  // Initial States
  searchQuery: "",
  selectedCategory: "All",
  sortBy: "default",
  viewMode: "grid",
  currentPage: 1,
  activeProductDetailId: null,
  quickViewProduct: null,
  selectedColors: getInitialSelectedColors(),
  toastMsg: null,
  showFiltersPanel: false,
  filterSizes: [],
  filterColors: [],
  filterPrice: "all",
  filterRating: null,
  detailActiveImageIdx: 0,
  quickViewActiveImageIdx: 0,
  cart: [],
  isCartOpen: false,
  detailQty: 1,

  // Setters & Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentPage: (page) =>
    set((state) => ({
      currentPage: typeof page === "function" ? page(state.currentPage) : page,
    })),
  setActiveProductDetailId: (id) => set({ activeProductDetailId: id, detailQty: 1, detailActiveImageIdx: 0 }),
  setQuickViewProduct: (product) =>
    set({ quickViewProduct: product, quickViewActiveImageIdx: 0 }),
  setToastMsg: (msg) => set({ toastMsg: msg }),
  setShowFiltersPanel: (show) =>
    set((state) => ({
      showFiltersPanel: typeof show === "function" ? show(state.showFiltersPanel) : show,
    })),
  toggleSizeFilter: (size) =>
    set((state) => ({
      filterSizes: state.filterSizes.includes(size)
        ? state.filterSizes.filter((s) => s !== size)
        : [...state.filterSizes, size],
    })),
  toggleColorFilter: (color) =>
    set((state) => ({
      filterColors: state.filterColors.includes(color)
        ? state.filterColors.filter((c) => c !== color)
        : [...state.filterColors, color],
    })),
  setFilterPrice: (price) => set({ filterPrice: price }),
  setFilterRating: (rating) => set({ filterRating: rating }),
  clearAllFilters: () =>
    set({
      filterSizes: [],
      filterColors: [],
      filterPrice: "all",
      filterRating: null,
    }),
  setDetailActiveImageIdx: (idx) =>
    set((state) => ({
      detailActiveImageIdx: typeof idx === "function" ? idx(state.detailActiveImageIdx) : idx,
    })),
  setQuickViewActiveImageIdx: (idx) => set({ quickViewActiveImageIdx: idx }),
  setIsCartOpen: (open) => set({ isCartOpen: open }),
  setDetailQty: (qty) =>
    set((state) => ({
      detailQty: typeof qty === "function" ? qty(state.detailQty) : qty,
    })),

  // Swatch Handlers
  handleColorChange: (productId, color) =>
    set((state) => ({
      selectedColors: { ...state.selectedColors, [productId]: color },
    })),
  handleDetailColorSelect: (productId, color) => {
    get().handleColorChange(productId, color);
    const prod = PRODUCTS_MOCK.find((p) => p.id === productId);
    if (prod) {
      const colorIdx = prod.colors.indexOf(color);
      if (colorIdx !== -1 && prod.images[colorIdx]) {
        set({ detailActiveImageIdx: colorIdx });
      } else {
        set({ detailActiveImageIdx: 0 });
      }
    }
  },
  handleQuickViewColorSelect: (productId, color) => {
    get().handleColorChange(productId, color);
    const { quickViewProduct } = get();
    if (quickViewProduct) {
      const colorIdx = quickViewProduct.colors.indexOf(color);
      if (colorIdx !== -1 && quickViewProduct.images[colorIdx]) {
        set({ quickViewActiveImageIdx: colorIdx });
      } else {
        set({ quickViewActiveImageIdx: 0 });
      }
    }
  },

  // Cart Handlers
  handleAddToCart: (product, color, qty, e) => {
    if (e) e.stopPropagation();
    // Ensure qty is a valid number and at least 1
    const finalQty = typeof qty === "number" && qty > 0 ? qty : 1;
    set((state) => {
      const idx = state.cart.findIndex(
        (item) => item.product.id === product.id && item.color === color
      );
      if (idx > -1) {
        const copy = [...state.cart];
        copy[idx].count += finalQty;
        return { cart: copy, toastMsg: `Successfully added ${product.title} (${color}) x${finalQty} to your cart!` };
      }
      return {
        cart: [...state.cart, { product, color, count: finalQty }],
        toastMsg: `Successfully added ${product.title} (${color}) x${finalQty} to your cart!`,
      };
    });
  },
  handleRemoveFromCart: (productId, color) =>
    set((state) => ({
      cart: state.cart.filter(
        (item) => !(item.product.id === productId && item.color === color)
      ),
    })),
  handleUpdateCartQty: (productId, color, qty) => {
    if (qty <= 0) {
      get().handleRemoveFromCart(productId, color);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId && item.color === color
          ? { ...item, count: qty }
          : item
      ),
    }));
  },
  clearCart: () => set({ cart: [] }),
}));
