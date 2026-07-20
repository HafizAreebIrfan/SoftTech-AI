import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "../../../../hooks";
import { useApplyGlobalThemeVars } from "../../../../infrastructure/store/themeStore";
import { useEcommerceStore } from "../../../../infrastructure/store/ecommerceStore";
import styles from "../../../../styles/ecommerce.module.css";
import {
  RatingStarIcon,
  CartIcon,
  EyeIcon,
  SearchIcon,
  ListIcon,
  LayoutGridIcon,
  LeftArrowIcon,
  RightArrowIcon,
  CloseIcon,
  CheckIcon,
  SlidersIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
} from "../../../../assets/icons";

import { Product } from "../../../../types";
import { PRODUCTS_MOCK } from "../../../../hooks/mockData/ecommerce";

interface InnerZoomImageProps {
  src: string;
  alt: string;
  className?: string;
}

const InnerZoomImage: React.FC<InnerZoomImageProps> = ({ src, alt, className }) => {
  const [zoomStyle, setZoomStyle] = React.useState<React.CSSProperties>({
    transformOrigin: "center center",
    transform: "scale(1)"
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.2)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: "zoom-in",
        borderRadius: "inherit"
      }}
    >
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          width: "100%",
          height: "100%",
          transition: "transform 0.15s ease-out",
          pointerEvents: "none",
          ...zoomStyle
        }}
      />
    </div>
  );
};

interface EcommerceScreenProps {
  title: string;
  subtitle?: string;
  blocks?: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void,
  ) => React.ReactNode;
}

export const EcommerceScreen: React.FC<EcommerceScreenProps> = ({
  title,
  subtitle,
  blocks = [],
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  // Apply theme-aware system
  const { isDark, toggleTheme, colors } = useThemeStore();
  useApplyGlobalThemeVars();

  // Extract dynamic products if provided in MCP blocks
  const displayProducts = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const listBlock = blocks.find((b: any) => (b?.type === "list" || b?.type === "table") && (Array.isArray(b?.listItems) || Array.isArray(b?.tableRows)));
      if (listBlock) {
        const items = listBlock.listItems || listBlock.tableRows || [];
        if (items.length > 0) {
          return items.map((itm: any, idx: number) => ({
            id: `dyn_prod_${idx}`,
            title: itm.title || itm.name || itm[0] || "Product Title",
            category: itm.category || "Audio & Electronics",
            description: itm.description || itm[1] || "High fidelity item",
            price: typeof itm.meta === 'string' ? parseFloat(itm.meta.replace(/[^0-9.]/g, '')) || 99.99 : typeof itm.price === 'number' ? itm.price : 99.99,
            rating: itm.rating || 4.7,
            reviewsCount: 120,
            colors: ["#090d16", "#ffffff"],
            images: [itm.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop"],
            bullets: ["High definition acoustic drivers", "Fast charge battery support"],
            inStock: true,
            sizes: ["Standard"]
          }));
        }
      }
    }
    return PRODUCTS_MOCK;
  }, [blocks]);


  // Connect Zustand store
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    activeProductDetailId,
    setActiveProductDetailId,
    quickViewProduct,
    setQuickViewProduct,
    selectedColors,
    toastMsg,
    setToastMsg,
    showFiltersPanel,
    setShowFiltersPanel,
    filterSizes,
    toggleSizeFilter,
    filterColors,
    toggleColorFilter,
    filterPrice,
    setFilterPrice,
    filterRating,
    setFilterRating,
    clearAllFilters,
    detailActiveImageIdx,
    setDetailActiveImageIdx,
    quickViewActiveImageIdx,
    setQuickViewActiveImageIdx,
    cart,
    isCartOpen,
    setIsCartOpen,
    detailQty,
    setDetailQty,
    handleDetailColorSelect,
    handleQuickViewColorSelect,
    handleColorChange,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateCartQty,
    clearCart,
  } = useEcommerceStore();

  // Sticky bottom bar visibility
  const [showBottomBar, setShowBottomBar] = React.useState(false);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg, setToastMsg]);

  // Handle scroll detection for the details page sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (activeProductDetailId && window.scrollY > 380) {
        setShowBottomBar(true);
      } else {
        setShowBottomBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeProductDetailId]);

  // Cart calculations
  const subtotal = cart.reduce((acc, curr) => {
    const price = curr.product.salePrice || curr.product.price;
    return acc + price * curr.count;
  }, 0);
  const tax = subtotal * 0.0825;
  const shipping = subtotal > 0 ? 10.0 : 0;
  const total = subtotal + tax + shipping;

  // Filter & Sort Logic
  const filteredProducts = displayProducts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    // Price range filters
    let matchesPrice = true;
    const finalPrice = p.salePrice || p.price;
    if (filterPrice === "under-100") {
      matchesPrice = finalPrice < 100;
    } else if (filterPrice === "100-200") {
      matchesPrice = finalPrice >= 100 && finalPrice <= 200;
    } else if (filterPrice === "over-200") {
      matchesPrice = finalPrice > 200;
    }

    // Size filter
    const matchesSize =
      filterSizes.length === 0 ||
      (p.sizes && p.sizes.some((s) => filterSizes.includes(s)));

    // Color filter
    const matchesColor =
      filterColors.length === 0 ||
      p.colors.some((c) => filterColors.includes(c));

    // Rating filter
    const matchesRating = filterRating === null || p.rating >= filterRating;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesSize &&
      matchesColor &&
      matchesRating
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = a.salePrice || a.price;
    const bPrice = b.salePrice || b.price;
    if (sortBy === "price-asc") return aPrice - bPrice;
    if (sortBy === "price-desc") return bPrice - aPrice;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const itemsPerPage = 4;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const displayedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const categories = ["All", "Headphones", "Audio", "Wearables", "Accessories"];
  const allSizes = ["S", "M", "L", "XL", "Standard", "Plus"];
  const allColors = [
    "#090d16",
    "#ffffff",
    "#4f46e5",
    "#d4af37",
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#7e838f",
    "#f59e0b",
  ];

  const activeDetailProduct = PRODUCTS_MOCK.find(
    (p) => p.id === activeProductDetailId,
  );

  const renderStars = (rating: number) => {
    const stars: React.ReactNode[] = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ marginRight: "2px", display: "inline-flex" }}>
          <RatingStarIcon size={14} color="#f59e0b" filled={i <= floor} />
        </span>,
      );
    }
    return stars;
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className={styles.toast}>
          <CheckIcon size={16} color="currentColor" />
          {toastMsg}
        </div>
      )}

      {isPreview &&
        renderPreviewControls &&
        setPreviewIndustry &&
        previewIndustry && (
          <div style={{ marginBottom: "1rem" }}>
            {renderPreviewControls(previewIndustry, setPreviewIndustry)}
          </div>
        )}

      {/* Main Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => toggleTheme()}
            className={styles.themeToggleBtn}
            title="Toggle theme"
          >
            {isDark ? (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <SunIcon size={16} color="currentColor" />
                Light Mode
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MoonIcon size={16} color="currentColor" />
                Dark Mode
              </span>
            )}
          </button>

          {/* Shopping Cart Summary Pill */}
          <div
            className={styles.cartPill}
            onClick={() => setIsCartOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <CartIcon size={18} color="currentColor" />
            <span>
              Cart ({cart.reduce((total, item) => total + item.count, 0)})
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeProductDetailId && activeDetailProduct ? (
          <motion.div
            key="product-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
          <button
            onClick={() => {
              setActiveProductDetailId(null);
            }}
            className={styles.backButton}
          >
            <LeftArrowIcon size={16} color="currentColor" />
            Back to Catalog
          </button>

          <div className={styles.detailGrid}>
            {/* Left Column: Product Gallery Carousel & Zoom */}
            <div className={styles.carouselContainer}>
              {/* Carousel Navigation Buttons */}
              {activeDetailProduct.images.length > 1 && (
                <>
                  <button
                    className={`${styles.carouselBtn} ${styles.carouselLeftBtn}`}
                    onClick={() =>
                      setDetailActiveImageIdx((prev) =>
                        prev === 0
                          ? activeDetailProduct.images.length - 1
                          : prev - 1,
                      )
                    }
                  >
                    ‹
                  </button>
                  <button
                    className={`${styles.carouselBtn} ${styles.carouselRightBtn}`}
                    onClick={() =>
                      setDetailActiveImageIdx((prev) =>
                        prev === activeDetailProduct.images.length - 1
                          ? 0
                          : prev + 1,
                      )
                    }
                  >
                    ›
                  </button>
                </>
              )}

              <div className={styles.mainImageWrapper}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={detailActiveImageIdx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <InnerZoomImage
                      src={
                        activeDetailProduct.images[detailActiveImageIdx] ||
                        activeDetailProduct.images[0]
                      }
                      alt={activeDetailProduct.title}
                      className={styles.mainImage}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnails list */}
              <div className={styles.thumbGrid}>
                {activeDetailProduct.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setDetailActiveImageIdx(idx)}
                    className={`${styles.thumb} ${
                      idx === detailActiveImageIdx
                        ? styles.thumbActive
                        : styles.thumbInactive
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <img src={img} alt="" className={styles.thumbImg} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Details Info */}
            <div
              className={styles.detailsCol}
              style={{ gap: "20px", display: "flex", flexDirection: "column" }}
            >
              <div>
                <span className={styles.categoryText}>
                  {activeDetailProduct.category}
                </span>
                <h3 className={styles.productTitle} style={{ margin: "4px 0" }}>
                  {activeDetailProduct.title}
                </h3>

                {/* Rating & Reviews */}
                <div
                  className={styles.ratingRow}
                  style={{ marginBottom: "12px" }}
                >
                  <div style={{ display: "flex" }}>
                    {renderStars(activeDetailProduct.rating)}
                  </div>
                  <span className={styles.reviewsCount}>
                    {activeDetailProduct.rating} (
                    {activeDetailProduct.reviewsCount} reviews)
                  </span>
                </div>

                <p
                  className={styles.descText}
                  style={{ margin: "12px 0", lineHeight: "1.6" }}
                >
                  {activeDetailProduct.description}
                </p>

                {/* Swatches */}
                {activeDetailProduct.colors.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <span className={styles.sectionTitle}>Select Color</span>
                    <div
                      className={styles.swatchesRow}
                      style={{ gap: "8px", marginTop: "6px" }}
                    >
                      {activeDetailProduct.colors.map((c) => {
                        const isSel =
                          selectedColors[activeDetailProduct.id] === c;
                        return (
                          <button
                            key={c}
                            onClick={() =>
                              handleDetailColorSelect(activeDetailProduct.id, c)
                            }
                            className={`${styles.swatch} ${isSel ? styles.swatchActive : ""}`}
                            style={{
                              backgroundColor: c,
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              border: isSel
                                ? "2px solid var(--app-text-primary)"
                                : "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bulleted Short Specs */}
                {activeDetailProduct.bullets && activeDetailProduct.bullets.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <span className={styles.sectionTitle}>Product Highlights</span>
                    <ul className={styles.bulletsList} style={{ marginTop: "8px", paddingLeft: "16px" }}>
                      {activeDetailProduct.bullets.map((bullet, idx) => (
                        <li key={idx} className={styles.bulletItem} style={{ fontSize: "12px", marginBottom: "6px" }}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Price, Action & Payment Modes */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  className={styles.priceRow}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "10px",
                  }}
                >
                  {activeDetailProduct.salePrice ? (
                    <>
                      <span
                        className={styles.salePrice}
                        style={{ fontSize: "24px", fontWeight: "900" }}
                      >
                        $
                        {(activeDetailProduct.salePrice * detailQty).toFixed(2)}
                      </span>
                      <span className={styles.originalPrice}>
                        ${(activeDetailProduct.price * detailQty).toFixed(2)}
                      </span>
                      <span className={styles.saveBadge}>
                        SAVE $
                        {Math.round(
                          (activeDetailProduct.price -
                            activeDetailProduct.salePrice) *
                            detailQty,
                        )}
                      </span>
                    </>
                  ) : (
                    <span
                      className={styles.salePrice}
                      style={{ fontSize: "24px", fontWeight: "900" }}
                    >
                      ${(activeDetailProduct.price * detailQty).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Quantity and Checkout buttons */}
                <div
                  className={styles.addToCartRow}
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <div className={styles.qtySelectWidget}>
                    <button
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      className={styles.qtyWidgetBtn}
                    >
                      -
                    </button>
                    <span className={styles.qtyWidgetVal}>{detailQty}</span>
                    <button
                      onClick={() => setDetailQty((q) => q + 1)}
                      className={styles.qtyWidgetBtn}
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={!activeDetailProduct.inStock}
                    onClick={() =>
                      handleAddToCart(
                        activeDetailProduct,
                        selectedColors[activeDetailProduct.id] ||
                          activeDetailProduct.colors[0],
                        detailQty,
                      )
                    }
                    className={`${styles.addToCartBtn} ${!activeDetailProduct.inStock ? styles.disabledBtn : ""}`}
                    style={{ flex: 1, padding: "12px 20px" }}
                  >
                    {activeDetailProduct.inStock
                      ? "Add to Shopping Cart"
                      : "Out of Stock"}
                  </button>
                </div>

                {/* Available Payment Modes - ONLY Images */}
                <div className={styles.paymentBadges}>
                  <span
                    className={styles.sectionTitle}
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    Guaranteed Safe Checkout
                  </span>
                  <div
                    className={styles.paymentBadgesGrid}
                    style={{ display: "flex", gap: "8px" }}
                  >
                    {/* Visa Icon */}
                    <div className={styles.paymentBadge}>
                      <svg viewBox="0 0 48 32" width="38" height="24">
                        <rect width="48" height="32" rx="4" fill="#1A1F71" />
                        <path
                          d="M19.2 11.5l-2.1 9.1h-2.5l2.1-9.1h2.5zm11.3 0h-2c-.6 0-1.1.3-1.4.9l-3.9 8.2h2.6l.5-1.5h3.2l.3 1.5h2.3l-1.6-9.1zm-2.2 5.9l1-3 1.6 3H28.3zm-17.5-5.9l-2.4 6.2-.3-1.3C8 14.1 7.2 12.3 5.4 11.6l2.4 9h2.6l3.9-9.1H10.8zm23.8 3.8c0-1.4-1-2.4-3.1-2.5-1.6-.1-3.1.4-3.8.8l.5 2.1c.7-.3 1.8-.7 2.9-.7.9 0 1.5.4 1.5 1 0 .7-.8 1-1.6 1.4-1.3.6-2.1 1.4-2.1 2.7 0 1.5 1.2 2.5 3.3 2.5 1.8 0 3-.4 3.5-.7l-.5-2.1c-.6.3-1.5.6-2.4.6-1 0-1.6-.4-1.6-1 0-.8.9-1.1 1.9-1.6 1.3-.6 2.1-1.3 2.1-2.7z"
                          fill="#FFF"
                        />
                      </svg>
                    </div>
                    {/* Mastercard Icon */}
                    <div className={styles.paymentBadge}>
                      <svg viewBox="0 0 48 32" width="38" height="24">
                        <rect width="48" height="32" rx="4" fill="#222" />
                        <path
                          d="M16.5 12c-1.3 0-2.4 1-2.4 2.4 0 1.3 1.1 2.3 2.4 2.3s2.4-1 2.4-2.3c0-1.4-1.1-2.4-2.4-2.4zm8.6.6c-.6-.4-1.3-.6-2-.6-1.5 0-2.7 1-2.7 2.6s1.2 2.6 2.7 2.6c.7 0 1.4-.2 2-.6v.5c0 1.2-.7 1.8-1.7 1.8-.8 0-1.4-.4-1.6-9h-1.2c.2 1 1.2 1.8 2.8 1.8 1.7 0 2.9-1 2.9-2.8v-4.9h-1.2v.5zm-.1 2c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6.7-1.6 1.6-1.6 1.6.7 1.6 1.6z"
                          fill="#000"
                        />
                        <path
                          d="M18.8 16c0-2.1 1.2-3.8 2.8-4.8-1-1.1-2.5-1.8-4.1-1.8-3.2 0-5.8 2.6-5.8 5.8s2.6 5.8 5.8 5.8c1.6 0 3.1-.7 4.1-1.8-1.6-1-2.8-2.7-2.8-4.8z"
                          fill="#FF5F00"
                        />
                        <circle
                          cx="17.5"
                          cy="16"
                          r="6"
                          fill="#EB001B"
                          opacity="0.8"
                        />
                        <circle
                          cx="24.5"
                          cy="16"
                          r="6"
                          fill="#F79E1B"
                          opacity="0.8"
                        />
                      </svg>
                    </div>
                    {/* Apple Pay Icon */}
                    <div className={styles.paymentBadge}>
                      <svg viewBox="0 0 48 32" width="38" height="24">
                        <rect width="48" height="32" rx="4" fill="#000" />
                        <path
                          d="M33 13.5c.1-1 1-1.7 2-1.7-.5 1-1 1.7-2 1.7zm1 5.3c-.6 0-1.2-.4-1.6-.4-.4 0-1 .4-1.6.4-.8 0-1.6-.5-2-1.3-.8-1.5-.2-3.7 1-4.7.6-.5 1.2-.8 1.9-.8.6 0 1.2.4 1.6.4.4 0 1-.4 1.6-.4.7 0 1.4.3 1.8.8-1.5.6-1.8 2-1.2 3.1.6.8 1.4 1.4 1.5 1.5-.2.5-.7 1.2-1.5 1.2z"
                          fill="#FFF"
                        />
                      </svg>
                    </div>
                    {/* Paypal Icon */}
                    <div className={styles.paymentBadge}>
                      <svg viewBox="0 0 48 32" width="38" height="24">
                        <rect width="48" height="32" rx="4" fill="#F2F5F8" />
                        <path
                          d="M18 10h5.5c2.5 0 4 1.2 4 3.2 0 2.5-1.8 4.3-4.3 4.3h-2.7l-1.5 6.5H15l3-14zm9 2h5.5c2.5 0 4 1.2 4 3.2 0 2.5-1.8 4.3-4.3 4.3h-2.7l-1.5 6.5H24l3-14z"
                          fill="#0079C1"
                          opacity="0.6"
                        />
                        <path
                          d="M19 11h5.5c2.2 0 3.7 1 3.7 2.8 0 2.2-1.6 3.7-3.7 3.7h-2.5L20.5 24H16.5l3-13z"
                          fill="#0079C1"
                        />
                      </svg>
                    </div>
                    {/* Google Pay Icon */}
                    <div className={styles.paymentBadge}>
                      <svg viewBox="0 0 48 32" width="38" height="24">
                        <rect
                          width="48"
                          height="32"
                          rx="4"
                          fill="#FFF"
                          stroke="#E0E0E0"
                          strokeWidth="1"
                        />
                        <path
                          d="M14.5 13.5v5c0 1.4 1 2.2 2.2 2.2s2.2-.8 2.2-2.2v-5h-4.4zm9 0h-2v7.2h2v-7.2zm3.3 0c-.8 0-1.5.4-1.8.9v-.9h-1.8v7.2h1.8v-3.8c0-1.1.8-1.8 1.8-1.8s1.8.7 1.8 1.8v3.8h1.8v-4.1c0-2-1.4-3.1-3.6-3.1z"
                          fill="#5F6368"
                        />
                        <path
                          d="M10 13c-.6 0-1.4.1-1.9.4v4.3c.5.3 1.3.4 1.9.4.9 0 1.6-.4 1.6-1.2v-2.7c0-.8-.7-1.2-1.6-1.2z"
                          fill="#34A853"
                        />
                        <path
                          d="M10 13c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1s1-.4 1-1v-4c0-.6-.4-1-1-1z"
                          fill="#4285F4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className={styles.reviewsSection} style={{ marginTop: "40px" }}>
            <h4
              className={styles.sectionTitle}
              style={{ fontSize: "18px", marginBottom: "20px" }}
            >
              Customer Reviews
            </h4>
            <div
              className={styles.reviewsGrid}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                {
                  id: "rev-1",
                  name: "Sarah M.",
                  rating: 5,
                  title: "Incredible sound quality!",
                  comment:
                    "The active noise cancellation is top notch. Extremely comfortable to wear for hours. Totally worth the price!",
                  date: "July 12, 2026",
                },
                {
                  id: "rev-2",
                  name: "David K.",
                  rating: 5,
                  title: "Perfect for office and travel",
                  comment:
                    "Battery life is stellar - lasted me a whole week of calls and commuting without a charge. ANC blocks everything.",
                  date: "June 15, 2026",
                },
              ].map((rev) => (
                <div
                  key={rev.id}
                  className={styles.reviewCard}
                  style={{ padding: "16px", borderRadius: "12px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span className={styles.reviewUser}>{rev.name}</span>
                    <span className={styles.reviewDate}>{rev.date}</span>
                  </div>
                  <div style={{ display: "flex", marginBottom: "6px" }}>
                    {renderStars(rev.rating)}
                  </div>
                  <h5 className={styles.reviewTitle}>{rev.title}</h5>
                  <p className={styles.reviewComment}>{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Sticky Bottom Bar */}
          {showBottomBar && (
            <div className={styles.bottomBar}>
              <div className={styles.bottomBarContent}>
                <div className={styles.bottomBarProduct}>
                  <img
                    src={activeDetailProduct.images[0]}
                    alt=""
                    className={styles.bottomBarImage}
                  />
                  <div>
                    <h5 className={styles.bottomBarTitle}>
                      {activeDetailProduct.title}
                    </h5>
                    <span className={styles.bottomBarCategory}>
                      {activeDetailProduct.category}
                    </span>
                  </div>
                </div>

                <div className={styles.bottomBarActions}>
                  <div className={styles.bottomBarPrice}>
                    $
                    {(
                      (activeDetailProduct.salePrice ||
                        activeDetailProduct.price) * detailQty
                    ).toFixed(2)}
                  </div>

                  <div className={styles.qtySelectWidget}>
                    <button
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      className={styles.qtyWidgetBtn}
                    >
                      -
                    </button>
                    <span className={styles.qtyWidgetVal}>{detailQty}</span>
                    <button
                      onClick={() => setDetailQty((q) => q + 1)}
                      className={styles.qtyWidgetBtn}
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={!activeDetailProduct.inStock}
                    onClick={() =>
                      handleAddToCart(
                        activeDetailProduct,
                        selectedColors[activeDetailProduct.id] ||
                          activeDetailProduct.colors[0],
                        detailQty,
                      )
                    }
                    className={styles.addToCartBtn}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    {activeDetailProduct.inStock
                      ? "Add to Cart"
                      : "Out of Stock"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        ) : (
          <motion.div
            key="product-catalog"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
          {/* Controls: Search, Category, Sorting, View Switcher */}
          <div className={styles.controlsRow}>
            {/* Search Bar */}
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>
                <SearchIcon size={16} color={colors.TextSecondary} />
              </span>
            </div>

            {/* Sorting & Filter Panels Switcher */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Expand Filter Button */}
              <button
                onClick={() => setShowFiltersPanel((v) => !v)}
                className={`${styles.filterToggleBtn} ${showFiltersPanel ? styles.filterOptionBtnActive : ""}`}
              >
                <SlidersIcon size={14} color="currentColor" />
                <span>Filters</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {/* View Layout Switcher */}
              <div className={styles.layoutSwitcher}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`${styles.switchBtn} ${viewMode === "grid" ? styles.switchBtnActive : ""}`}
                >
                  <LayoutGridIcon size={14} color="currentColor" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`${styles.switchBtn} ${viewMode === "list" ? styles.switchBtnActive : ""}`}
                >
                  <ListIcon size={14} color="currentColor" />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Advanced Filters Panel */}
          {showFiltersPanel && (
            <div className={styles.filtersPanel}>
              {/* Filter Group: Sizes */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Sizes</span>
                <div className={styles.filterOptionsRow}>
                  {allSizes.map((size) => {
                    const isSel = filterSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSizeFilter(size)}
                        className={`${styles.filterOptionBtn} ${isSel ? styles.filterOptionBtnActive : ""}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Group: Colors */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Colors</span>
                <div className={styles.filterOptionsRow} style={{ gap: "6px" }}>
                  {allColors.map((col) => {
                    const isSel = filterColors.includes(col);
                    return (
                      <button
                        key={col}
                        onClick={() => toggleColorFilter(col)}
                        className={`${styles.filterOptionBtn}`}
                        style={{
                          backgroundColor: col,
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: isSel
                            ? "2px solid var(--app-text-primary)"
                            : "1px solid var(--app-card-border)",
                          padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Filter Group: Price Range */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Price Range</span>
                <div className={styles.filterOptionsRow}>
                  {[
                    { val: "all", label: "All Prices" },
                    { val: "under-100", label: "Under $100" },
                    { val: "100-200", label: "$100 - $200" },
                    { val: "over-200", label: "Over $200" },
                  ].map((pr) => (
                    <button
                      key={pr.val}
                      onClick={() => setFilterPrice(pr.val)}
                      className={`${styles.filterOptionBtn} ${filterPrice === pr.val ? styles.filterOptionBtnActive : ""}`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Group: Minimum Reviews */}
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupTitle}>Rating</span>
                <div className={styles.filterOptionsRow}>
                  {[
                    { val: null, label: "All Stars" },
                    { val: 4.5, label: "4.5★ & Up" },
                    { val: 4.2, label: "4.2★ & Up" },
                  ].map((rt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFilterRating(rt.val)}
                      className={`${styles.filterOptionBtn} ${filterRating === rt.val ? styles.filterOptionBtnActive : ""}`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters Button */}
              {/* <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={clearAllFilters}
                  className={styles.filterToggleBtn}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Clear Filters
                </button>
              </div> */}
            </div>
          )}

          {/* Category Tabs */}
          <div className={styles.categoryTabs}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`${styles.tabBtn} ${isSelected ? styles.tabBtnActive : ""}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Products Grid or List View */}
          {displayedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              No products found matching your filters.
            </div>
          ) : viewMode === "grid" ? (
            /* GRID CATALOG LAYOUT */
            <div className={styles.productsGrid}>
              {displayedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className={styles.card}
                  onClick={() => setActiveProductDetailId(prod.id)}
                >
                  <div>
                    {/* Image Area */}
                    <div className={styles.cardImageArea}>
                      {(() => {
                        const activeColor = selectedColors[prod.id] || prod.colors[0];
                        const colorIdx = prod.colors.indexOf(activeColor);
                        const displayImage = colorIdx !== -1 && prod.images[colorIdx] ? prod.images[colorIdx] : prod.images[0];
                        return (
                          <img
                            src={displayImage}
                            alt={prod.title}
                            className={styles.cardImg}
                          />
                        );
                      })()}

                      {/* Quick View Floating Action Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(prod);
                        }}
                        className={styles.quickViewBtn}
                      >
                        <EyeIcon size={14} color="white" />
                      </button>
                    </div>

                    <div className={styles.cardDetails}>
                      <h4 className={styles.cardTitle}>{prod.title}</h4>
                      <p className={styles.cardCategory}>{prod.description}</p>

                      {/* Color Swatches */}
                      {prod.colors.length > 0 && (
                        <div
                          className={styles.swatchGrid}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "flex",
                            gap: "6px",
                            marginTop: "10px",
                          }}
                        >
                          {prod.colors.map((c) => {
                            const isSel = selectedColors[prod.id] === c;
                            return (
                              <button
                                key={c}
                                onClick={() => handleColorChange(prod.id, c)}
                                className={`${styles.swatch} ${isSel ? styles.swatchActive : ""}`}
                                style={{
                                  backgroundColor: c,
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action row */}
                  <div className={styles.cardFooter}>
                    {prod.salePrice ? (
                      <div className={styles.priceCol}>
                        <span className={styles.salePrice}>
                          ${prod.salePrice}
                        </span>
                        <span className={styles.originalPrice}>
                          ${prod.price}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.cardPrice}>${prod.price}</span>
                    )}

                    {((prod.colors && prod.colors.length > 1) || (prod.sizes && prod.sizes.length > 1)) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(prod);
                        }}
                        className={styles.cardAddBtn}
                      >
                        Select Options
                      </button>
                    ) : (
                      <button
                        onClick={(e) =>
                          handleAddToCart(
                            prod,
                            selectedColors[prod.id] || prod.colors[0],
                            1,
                            e,
                          )
                        }
                        className={styles.cardAddBtn}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST CATALOG LAYOUT */
            <div className={styles.productsList}>
              {displayedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className={styles.listCard}
                  onClick={() => setActiveProductDetailId(prod.id)}
                >
                  <div className={styles.listCardImageArea}>
                    {(() => {
                      const activeColor = selectedColors[prod.id] || prod.colors[0];
                      const colorIdx = prod.colors.indexOf(activeColor);
                      const displayImage = colorIdx !== -1 && prod.images[colorIdx] ? prod.images[colorIdx] : prod.images[0];
                      return (
                        <img
                          src={displayImage}
                          alt={prod.title}
                          className={styles.cardImg}
                        />
                      );
                    })()}
                  </div>

                  <div className={styles.listCardDetails}>
                    <div className={styles.listCardHeader}>
                      <div>
                        <h4 className={styles.cardTitle}>{prod.title}</h4>
                        <p className={styles.listCardDesc}>
                          {prod.description}
                        </p>
                      </div>

                      {prod.salePrice ? (
                        <div className={styles.priceCol}>
                          <span className={styles.salePrice}>
                            ${prod.salePrice}
                          </span>
                          <span className={styles.originalPrice}>
                            ${prod.price}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.cardPrice}>${prod.price}</span>
                      )}
                    </div>

                    <div
                      className={styles.cardFooter}
                      style={{ padding: "8px 0 0 0", marginTop: "12px" }}
                    >
                      {/* Swatches in list view */}
                      <div
                        className={styles.swatchGrid}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", gap: "6px" }}
                      >
                        {prod.colors.map((c) => {
                          const isSel = selectedColors[prod.id] === c;
                          return (
                            <button
                              key={c}
                              onClick={() => handleColorChange(prod.id, c)}
                              className={`${styles.swatch} ${isSel ? styles.swatchActive : ""}`}
                              style={{
                                backgroundColor: c,
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                              }}
                            />
                          );
                        })}
                      </div>

                      <div
                        style={{ display: "flex", gap: "8px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(prod);
                          }}
                          className={styles.listCardQuickBtn}
                        >
                          Quick View
                        </button>

                        {((prod.colors && prod.colors.length > 1) || (prod.sizes && prod.sizes.length > 1)) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewProduct(prod);
                            }}
                            className={styles.listCardAddBtn}
                          >
                            Select Options
                          </button>
                        ) : (
                          <button
                            onClick={(e) =>
                              handleAddToCart(
                                prod,
                                selectedColors[prod.id] || prod.colors[0],
                                1,
                                e,
                              )
                            }
                            className={styles.listCardAddBtn}
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className={styles.paginationBtn}
              >
                Previous
              </button>

              <span className={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className={styles.paginationBtn}
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* ==================== QUICK VIEW MODAL ==================== */}
      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setQuickViewProduct(null)}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className={styles.modalClose}
            >
              <CloseIcon size={18} color="currentColor" />
            </button>

            <div className={styles.detailGrid}>
              {/* Image Carousel/Gallery area in Quick View */}
              <div>
                <div className={styles.modalImageWrapper}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quickViewActiveImageIdx}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <InnerZoomImage
                        src={
                          quickViewProduct.images[quickViewActiveImageIdx] ||
                          quickViewProduct.images[0]
                        }
                        alt=""
                        className={styles.modalImage}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Thumbnails visible in modal */}
                <div
                  className={styles.thumbGrid}
                  style={{ marginTop: "10px", display: "flex", gap: "6px" }}
                >
                  {quickViewProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setQuickViewActiveImageIdx(idx)}
                      className={`${styles.thumb} ${
                        idx === quickViewActiveImageIdx
                          ? styles.thumbActive
                          : styles.thumbInactive
                      }`}
                      style={{
                        cursor: "pointer",
                        width: "100%",
                        height: "160px",
                      }}
                    >
                      <img src={img} alt="" className={styles.thumbImg} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.detailsCol}>
                <div>
                  <span className={styles.categoryText}>
                    {quickViewProduct.category}
                  </span>
                  <h4
                    className={styles.productTitle}
                    style={{ margin: "4px 0" }}
                  >
                    {quickViewProduct.title}
                  </h4>
                  <div
                    className={styles.ratingRow}
                    style={{ marginBottom: "12px" }}
                  >
                    <div style={{ display: "flex" }}>
                      {renderStars(quickViewProduct.rating)}
                    </div>
                    <span className={styles.reviewsCount}>
                      ({quickViewProduct.reviewsCount})
                    </span>
                  </div>
                  <p
                    className={styles.descText}
                    style={{ fontSize: "12px", lineHeight: "1.5" }}
                  >
                    {quickViewProduct.description}
                  </p>

                  {/* Swatches in Modal */}
                  {quickViewProduct.colors.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <span className={styles.sectionTitle}>Color Options</span>
                      <div
                        className={styles.swatchesRow}
                        style={{ gap: "6px", marginTop: "4px" }}
                      >
                        {quickViewProduct.colors.map((c) => {
                          const isSel =
                            selectedColors[quickViewProduct.id] === c;
                          return (
                            <button
                              key={c}
                              onClick={() =>
                                handleQuickViewColorSelect(
                                  quickViewProduct.id,
                                  c,
                                )
                              }
                              className={`${styles.swatch} ${isSel ? styles.swatchActive : ""}`}
                              style={{
                                backgroundColor: c,
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bulleted Short Specs in Quick View */}
                  {quickViewProduct.bullets && quickViewProduct.bullets.length > 0 && (
                    <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                      <span className={styles.sectionTitle}>Key Features</span>
                      <ul className={styles.bulletsList} style={{ marginTop: "6px", paddingLeft: "16px" }}>
                        {quickViewProduct.bullets.map((bullet, idx) => (
                          <li key={idx} className={styles.bulletItem} style={{ fontSize: "11px", marginBottom: "4px" }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={styles.paymentBadges}>
                    <span
                      className={styles.sectionTitle}
                      style={{ display: "block", marginBottom: "8px" }}
                    >
                      Guaranteed Safe Checkout
                    </span>
                    <div
                      className={styles.paymentBadgesGrid}
                      style={{ display: "flex", gap: "8px" }}
                    >
                      {/* Visa Icon */}
                      <div className={styles.paymentBadge}>
                        <svg viewBox="0 0 48 32" width="50" height="50">
                          <rect width="48" height="32" rx="4" fill="#1A1F71" />
                          <path
                            d="M19.2 11.5l-2.1 9.1h-2.5l2.1-9.1h2.5zm11.3 0h-2c-.6 0-1.1.3-1.4.9l-3.9 8.2h2.6l.5-1.5h3.2l.3 1.5h2.3l-1.6-9.1zm-2.2 5.9l1-3 1.6 3H28.3zm-17.5-5.9l-2.4 6.2-.3-1.3C8 14.1 7.2 12.3 5.4 11.6l2.4 9h2.6l3.9-9.1H10.8zm23.8 3.8c0-1.4-1-2.4-3.1-2.5-1.6-.1-3.1.4-3.8.8l.5 2.1c.7-.3 1.8-.7 2.9-.7.9 0 1.5.4 1.5 1 0 .7-.8 1-1.6 1.4-1.3.6-2.1 1.4-2.1 2.7 0 1.5 1.2 2.5 3.3 2.5 1.8 0 3-.4 3.5-.7l-.5-2.1c-.6.3-1.5.6-2.4.6-1 0-1.6-.4-1.6-1 0-.8.9-1.1 1.9-1.6 1.3-.6 2.1-1.3 2.1-2.7z"
                            fill="#FFF"
                          />
                        </svg>
                      </div>
                      {/* Mastercard Icon */}
                      <div className={styles.paymentBadge}>
                        <svg viewBox="0 0 48 32" width="50" height="50">
                          <rect width="48" height="32" rx="4" fill="#222" />
                          <path
                            d="M16.5 12c-1.3 0-2.4 1-2.4 2.4 0 1.3 1.1 2.3 2.4 2.3s2.4-1 2.4-2.3c0-1.4-1.1-2.4-2.4-2.4zm8.6.6c-.6-.4-1.3-.6-2-.6-1.5 0-2.7 1-2.7 2.6s1.2 2.6 2.7 2.6c.7 0 1.4-.2 2-.6v.5c0 1.2-.7 1.8-1.7 1.8-.8 0-1.4-.4-1.6-9h-1.2c.2 1 1.2 1.8 2.8 1.8 1.7 0 2.9-1 2.9-2.8v-4.9h-1.2v.5zm-.1 2c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6.7-1.6 1.6-1.6 1.6.7 1.6 1.6z"
                            fill="#000"
                          />
                          <path
                            d="M18.8 16c0-2.1 1.2-3.8 2.8-4.8-1-1.1-2.5-1.8-4.1-1.8-3.2 0-5.8 2.6-5.8 5.8s2.6 5.8 5.8 5.8c1.6 0 3.1-.7 4.1-1.8-1.6-1-2.8-2.7-2.8-4.8z"
                            fill="#FF5F00"
                          />
                          <circle
                            cx="17.5"
                            cy="16"
                            r="6"
                            fill="#EB001B"
                            opacity="0.8"
                          />
                          <circle
                            cx="24.5"
                            cy="16"
                            r="6"
                            fill="#F79E1B"
                            opacity="0.8"
                          />
                        </svg>
                      </div>
                      {/* Apple Pay Icon */}
                      <div className={styles.paymentBadge}>
                        <svg viewBox="0 0 48 32" width="50" height="50">
                          <rect width="48" height="32" rx="4" fill="#000" />
                          <path
                            d="M33 13.5c.1-1 1-1.7 2-1.7-.5 1-1 1.7-2 1.7zm1 5.3c-.6 0-1.2-.4-1.6-.4-.4 0-1 .4-1.6.4-.8 0-1.6-.5-2-1.3-.8-1.5-.2-3.7 1-4.7.6-.5 1.2-.8 1.9-.8.6 0 1.2.4 1.6.4.4 0 1-.4 1.6-.4.7 0 1.4.3 1.8.8-1.5.6-1.8 2-1.2 3.1.6.8 1.4 1.4 1.5 1.5-.2.5-.7 1.2-1.5 1.2z"
                            fill="#FFF"
                          />
                        </svg>
                      </div>
                      {/* Paypal Icon */}
                      <div className={styles.paymentBadge}>
                        <svg viewBox="0 0 48 32" width="50" height="50">
                          <rect width="48" height="32" rx="4" fill="#F2F5F8" />
                          <path
                            d="M18 10h5.5c2.5 0 4 1.2 4 3.2 0 2.5-1.8 4.3-4.3 4.3h-2.7l-1.5 6.5H15l3-14zm9 2h5.5c2.5 0 4 1.2 4 3.2 0 2.5-1.8 4.3-4.3 4.3h-2.7l-1.5 6.5H24l3-14z"
                            fill="#0079C1"
                            opacity="0.6"
                          />
                          <path
                            d="M19 11h5.5c2.2 0 3.7 1 3.7 2.8 0 2.2-1.6 3.7-3.7 3.7h-2.5L20.5 24H16.5l3-13z"
                            fill="#0079C1"
                          />
                        </svg>
                      </div>
                      {/* Google Pay Icon */}
                      <div className={styles.paymentBadge}>
                        <svg viewBox="0 0 48 32" width="50" height="50">
                          <rect
                            width="48"
                            height="32"
                            rx="4"
                            fill="#FFF"
                            stroke="#E0E0E0"
                            strokeWidth="1"
                          />
                          <path
                            d="M14.5 13.5v5c0 1.4 1 2.2 2.2 2.2s2.2-.8 2.2-2.2v-5h-4.4zm9 0h-2v7.2h2v-7.2zm3.3 0c-.8 0-1.5.4-1.8.9v-.9h-1.8v7.2h1.8v-3.8c0-1.1.8-1.8 1.8-1.8s1.8.7 1.8 1.8v3.8h1.8v-4.1c0-2-1.4-3.1-3.6-3.1z"
                            fill="#5F6368"
                          />
                          <path
                            d="M10 13c-.6 0-1.4.1-1.9.4v4.3c.5.3 1.3.4 1.9.4.9 0 1.6-.4 1.6-1.2v-2.7c0-.8-.7-1.2-1.6-1.2z"
                            fill="#34A853"
                          />
                          <path
                            d="M10 13c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1s1-.4 1-1v-4c0-.6-.4-1-1-1z"
                            fill="#4285F4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div
                    className={styles.priceRow}
                    style={{ marginBottom: "12px", marginTop: "12px" }}
                  >
                    {quickViewProduct.salePrice ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          className={styles.salePrice}
                          style={{ fontSize: "20px" }}
                        >
                          ${(quickViewProduct.salePrice * detailQty).toFixed(2)}
                        </span>
                        <span className={styles.originalPrice}>
                          ${(quickViewProduct.price * detailQty).toFixed(2)}
                        </span>
                        <span className={styles.saveBadge}>
                          SAVE $
                          {Math.round(
                            (quickViewProduct.price -
                              quickViewProduct.salePrice) *
                              detailQty,
                          )}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={styles.salePrice}
                        style={{ fontSize: "20px" }}
                      >
                        ${(quickViewProduct.price * detailQty).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div
                    className={styles.addToCartRow}
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div className={styles.qtySelectWidget}>
                      <button
                        onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                        className={styles.qtyWidgetBtn}
                      >
                        -
                      </button>
                      <span className={styles.qtyWidgetVal}>{detailQty}</span>
                      <button
                        onClick={() => setDetailQty((q) => q + 1)}
                        className={styles.qtyWidgetBtn}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        handleAddToCart(
                          quickViewProduct,
                          selectedColors[quickViewProduct.id] ||
                            quickViewProduct.colors[0],
                          detailQty,
                        );
                        setQuickViewProduct(null);
                      }}
                      className={styles.addToCartBtn}
                      style={{ width: "100%", padding: "10px" }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== INTERACTIVE SIDEBAR CART ==================== */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Overlay background */}
            <motion.div
              className={styles.cartSidebarOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCartOpen(false)}
            />

            {/* Sidebar drawer container */}
            <motion.div
              className={styles.cartSidebar}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
            >
            <div className={styles.cartHeader}>
              <h3 className={styles.cartTitle}>Shopping Cart</h3>
              <button
                className={styles.cartCloseBtn}
                onClick={() => setIsCartOpen(false)}
              >
                <CloseIcon size={16} color="currentColor" />
              </button>
            </div>

            <div className={styles.cartItemsList}>
              {cart.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "var(--app-text-secondary)",
                  }}
                >
                  Your cart is empty.
                </div>
              ) : (
                cart.map((item, idx) => {
                  const price = item.product.salePrice || item.product.price;
                  return (
                    <div
                      key={`${item.product.id}-${item.color}-${idx}`}
                      className={styles.cartItem}
                    >
                      <img
                        src={item.product.images[0]}
                        alt=""
                        className={styles.cartItemImage}
                      />
                      <div className={styles.cartItemDetails}>
                        <div>
                          <h4 className={styles.cartItemTitle}>
                            {item.product.title}
                          </h4>
                          <span className={styles.cartItemMeta}>
                            Color: {item.color}
                          </span>
                        </div>

                        <div className={styles.cartItemPriceRow}>
                          <span className={styles.cartItemPrice}>
                            ${(price * item.count).toFixed(2)}
                          </span>
                          {item.count > 1 && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--app-text-secondary)",
                                marginLeft: "4px",
                              }}
                            >
                              (${price.toFixed(2)} ea)
                            </span>
                          )}
                          <div className={styles.cartQtyControls}>
                            <button
                              onClick={() =>
                                handleUpdateCartQty(
                                  item.product.id,
                                  item.color,
                                  item.count - 1,
                                )
                              }
                              className={styles.cartQtyBtn}
                            >
                              -
                            </button>
                            <span className={styles.cartQtyVal}>
                              {item.count}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateCartQty(
                                  item.product.id,
                                  item.color,
                                  item.count + 1,
                                )
                              }
                              className={styles.cartQtyBtn}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove item button */}
                      <button
                        onClick={() =>
                          handleRemoveFromCart(item.product.id, item.color)
                        }
                        className={styles.cartItemRemove}
                        title="Remove product"
                      >
                        <TrashIcon size={14} color="currentColor" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Calculations Summary and Checkout CTA */}
            {cart.length > 0 && (
              <div className={styles.cartSummary}>
                <div className={styles.cartSummaryRow}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.cartSummaryRow}>
                  <span>Estimated Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className={styles.cartSummaryRow}>
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className={styles.cartSummaryTotal}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    setToastMsg("Proceeding to secure checkout! Thank you.");
                    clearCart();
                    setIsCartOpen(false);
                  }}
                  className={styles.checkoutBtn}
                  style={{ marginTop: "12px" }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
