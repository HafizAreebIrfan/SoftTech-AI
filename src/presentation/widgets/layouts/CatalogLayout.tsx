import React, { useState, useMemo } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { CardsBlock } from "../components/CardsBlock";
import { useCartStore, parseNumericPrice } from "../../../infrastructure/store/cartStore";
import { getFieldValue } from "../../../utils/schema/getValue";
import styles from "../../../styles/cataloglayout.module.css";
import { FormBlock } from "../components";

export const CatalogLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  records = [],
  fields = [],
  collection,
  capabilities,
  actions = [],
  audience,
  presentationPlan,
}) => {
  const blocks = presentationPlan?.blocks ?? [];
  const filtersBlock = blocks.find((b) => b.type === "filters");
  const cardsBlock = blocks.find((b) => b.type === "cards");

  // Cart store integration
  const openCart = useCartStore((state) => state.openCart);
  const totalCartCount = useCartStore((state) => state.getTotalCount());

  // Interactive filtering & sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("default");

  // 1. Identify category / type field dynamically
  const categoryField = useMemo(() => {
    return fields.find((f) => {
      const k = f.key.toLowerCase();
      return (
        k === "category" ||
        k === "type" ||
        k === "packagetype" ||
        k === "brand" ||
        k === "department" ||
        k === "genre"
      );
    });
  }, [fields]);

  // 2. Extract unique categories if present
  const availableCategories = useMemo(() => {
    if (!categoryField) return [];
    const catSet = new Set<string>();

    records.forEach((rec) => {
      const val = getFieldValue(rec, categoryField);
      if (typeof val === "string" && val.trim()) {
        if (val.includes(",")) {
          val.split(",").forEach((sub) => {
            const trimmed = sub.trim();
            if (trimmed) catSet.add(trimmed);
          });
        } else {
          catSet.add(val.trim());
        }
      } else if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === "string" && item.trim()) {
            catSet.add(item.trim());
          }
        });
      }
    });

    const list = Array.from(catSet);
    return list.length > 1 ? ["All", ...list] : [];
  }, [records, categoryField]);

  // 3. Identify Price & Rating fields for sort options
  const hasPriceField = useMemo(() => {
    return fields.some((f) => f.type === "currency" || f.key.toLowerCase().includes("price"));
  }, [fields]);

  const hasRatingField = useMemo(() => {
    return fields.some(
      (f) =>
        f.uiRole === "metric" ||
        f.key.toLowerCase().includes("rating") ||
        f.key.toLowerCase().includes("score"),
    );
  }, [fields]);

  // 4. Defensive customer filtering & Search + Category Filter
  const filteredRecords = useMemo(() => {
    let list = records;

    // Audience customer filter: drop inactive/pending records for customers
    if (audience === "customer") {
      list = list.filter((rec: any) => {
        if (!rec || typeof rec !== "object") return true;
        const statusVal = String(
          rec.$status ||
            rec.status ||
            rec.packagestatus ||
            rec.orderstatus ||
            rec.availabilityStatus ||
            "",
        )
          .toLowerCase()
          .trim();

        if (
          statusVal === "pending" ||
          statusVal === "inactive" ||
          statusVal === "draft" ||
          statusVal === "test" ||
          statusVal === "archived"
        ) {
          return false;
        }
        return true;
      });
    }

    // Category filter
    if (selectedCategory !== "All" && categoryField) {
      list = list.filter((rec) => {
        const val = String(getFieldValue(rec, categoryField) || "").toLowerCase();
        return val.includes(selectedCategory.toLowerCase());
      });
    }

    // Search query filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((rec) => {
        if (!rec || typeof rec !== "object") return false;
        return Object.values(rec as Record<string, unknown>).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(term),
        );
      });
    }

    // Sorting
    if (sortOption !== "default") {
      const sorted = [...list];
      if (sortOption === "price_asc") {
        sorted.sort((a: any, b: any) => {
          const pA = parseNumericPrice(a.$price ?? a.price ?? a.packageprice ?? 0);
          const pB = parseNumericPrice(b.$price ?? b.price ?? b.packageprice ?? 0);
          return pA - pB;
        });
      } else if (sortOption === "price_desc") {
        sorted.sort((a: any, b: any) => {
          const pA = parseNumericPrice(a.$price ?? a.price ?? a.packageprice ?? 0);
          const pB = parseNumericPrice(b.$price ?? b.price ?? b.packageprice ?? 0);
          return pB - pA;
        });
      } else if (sortOption === "rating_desc") {
        sorted.sort((a: any, b: any) => {
          const rA = Number(a.$metric ?? a.rating ?? 0);
          const rB = Number(b.$metric ?? b.rating ?? 0);
          return rB - rA;
        });
      } else if (sortOption === "name_asc") {
        sorted.sort((a: any, b: any) => {
          const nA = String(a.$title ?? a.title ?? a.name ?? a.packagename ?? "");
          const nB = String(b.$title ?? b.title ?? b.name ?? b.packagename ?? "");
          return nA.localeCompare(nB);
        });
      }
      return sorted;
    }

    return list;
  }, [
    records,
    audience,
    selectedCategory,
    categoryField,
    searchTerm,
    sortOption,
  ]);

  const showToolbar = records.length > 2 || availableCategories.length > 0;

  return (
    <section className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>
              {title || collection?.entity || "Catalog"}
            </h1>
            {records.length > 0 && (
              <span className={styles.countBadge}>{filteredRecords.length} items</span>
            )}
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* Live Cart Drawer Toggle Button */}
        <button
          type="button"
          className={styles.cartButton}
          onClick={openCart}
          title="Open Shopping Cart"
        >
          <span>🛒 Cart</span>
          {totalCartCount > 0 && (
            <span className={styles.cartBadge}>{totalCartCount}</span>
          )}
        </button>
      </header>

      {/* Structured Filters from Plan (if provided) */}
      {filtersBlock && (
        <div style={{ marginBottom: "12px" }}>
          <FormBlock block={filtersBlock} fields={fields} />
        </div>
      )}

      {/* Dynamic Catalog Toolbar (Search & Sort) */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <span style={{ color: "var(--app-text-secondary, #94a3b8)" }}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--app-text-secondary)",
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              className={styles.sortSelect}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort products"
            >
              <option value="default">Sort: Default</option>
              {hasPriceField && <option value="price_asc">Price: Low to High</option>}
              {hasPriceField && <option value="price_desc">Price: High to Low</option>}
              {hasRatingField && <option value="rating_desc">Highest Rated</option>}
              <option value="name_asc">Name: A–Z</option>
            </select>
          </div>
        </div>
      )}

      {/* Category Pills */}
      {availableCategories.length > 1 && (
        <div className={styles.categoriesWrapper}>
          {availableCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Cards Grid */}
      {filteredRecords.length > 0 ? (
        <CardsBlock
          block={cardsBlock}
          records={filteredRecords}
          fields={fields}
          collection={collection}
          capabilities={capabilities}
          actions={actions}
          audience={audience}
        />
      ) : (
        <div className={styles.noResults}>
          <p>No products match your current filters.</p>
          {(searchTerm || selectedCategory !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSortOption("default");
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--widget-card-border, rgba(255,255,255,0.2))",
                borderRadius: "6px",
                color: "var(--widget-accent, #6366f1)",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </section>
  );
};
