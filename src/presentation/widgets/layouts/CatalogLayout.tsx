import React, { useState, useMemo, useEffect } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { CardsBlock } from "../components/CardsBlock";
import { useCartStore, parseNumericPrice } from "../../../infrastructure/store/cartStore";
import { getFieldValue } from "../../../utils/schema/getValue";
import { callMcpTool, applyReQueryResult, getToolInput } from "../../../utils/mcpBridge";
import { extractToolResult } from "../../../infrastructure/store/mcpWidgetStore";
import styles from "../../../styles/cataloglayout.module.css";
import { useRealtimeStream } from "../hooks/useRealtimeStream";

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
  const cardsBlock = blocks.find((b) => b.type === "cards");

  const [localRecords, setLocalRecords] = useState<any[]>(records);

  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  const streamUrl: string | undefined =
    (window as any).__WIDGET_METADATA__?.streamUrl ||
    (window as any).__WIDGET_DATA__?.streamUrl ||
    actions?.find((a: any) => a?.streamUrl || a?.isRealtimeApi)?.streamUrl;

  useRealtimeStream({
    streamUrl,
    onMessage: (payload) => {
      if (!payload) return;
      const incomingList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.records)
            ? payload.records
            : [payload];

      setLocalRecords((prev) => {
        let updated = [...prev];
        for (const item of incomingList) {
          if (!item || typeof item !== "object") continue;
          const itemId = item.id || item._id || item.packageId || item.productId;
          if (itemId) {
            const idx = updated.findIndex(
              (r) => (r.id || r._id || r.packageId || r.productId) === itemId,
            );
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], ...item };
            } else {
              updated = [item, ...updated];
            }
          } else {
            updated = [item, ...updated];
          }
        }
        return updated;
      });
    },
  });

  // Cart store integration
  const openCart = useCartStore((state) => state.openCart);
  const totalCartCount = useCartStore((state) => state.getTotalCount());

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

    localRecords.forEach((rec) => {
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
  }, [localRecords, categoryField]);

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

  // Category Facet integration (Backend-driven)
  const categoryFacet = collection?.facets?.find(
    (f) =>
      f.name.toLowerCase() === "category" ||
      f.param.toLowerCase().includes("category") ||
      f.param.toLowerCase() === "slug",
  );

  const [backendCategories, setBackendCategories] = useState<
    Array<{ label: string; value: string }>
  >([]);

  React.useEffect(() => {
    if (!categoryFacet?.optionsTool) return;
    let active = true;
    callMcpTool(categoryFacet.optionsTool, {})
      .then((res: any) => {
        if (!active) return;
        const payload = extractToolResult(res) as any;
        let rawList: any[] = [];
        const d = payload?.structuredContent?.data || payload?.data || res;
        if (Array.isArray(d)) {
          rawList = d;
        } else if (d && typeof d === "object") {
          const arr = Object.values(d).find((v) => Array.isArray(v)) as any[];
          if (arr) rawList = arr;
        }
        const parsed = rawList
          .map((item) => {
            if (typeof item === "string") {
              return {
                label: item
                  .replace(/[-_]+/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
                value: item,
              };
            }
            if (item && typeof item === "object") {
              const val = String(
                item.slug || item.category || item.name || item.id || "",
              );
              const lbl = String(item.name || item.title || item.label || val);
              return { label: lbl, value: val };
            }
            return { label: String(item), value: String(item) };
          })
          .filter((o) => o.value);

        if (parsed.length > 0) {
          setBackendCategories(parsed);
        }
      })
      .catch((err) =>
        console.warn("[CatalogLayout] Failed to load backend categories:", err),
      );

    return () => {
      active = false;
    };
  }, [categoryFacet?.optionsTool]);

  // Interactive filtering & sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("default");
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string>>({});
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  // Pagination & Loading states
  const [pageSize, setPageSize] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCategorySelect = async (cat: string) => {
    setSelectedCategory(cat);
    if (categoryFacet?.optionsTool) {
      setIsLoading(true);
      try {
        let res: unknown;
        if (cat === "All" || cat === "") {
          if (categoryFacet.listTool) {
            res = await callMcpTool(categoryFacet.listTool, {});
          } else if (categoryFacet.tool) {
            res = await callMcpTool(categoryFacet.tool, {
              [categoryFacet.param]: "all",
            });
          }
        } else if (categoryFacet.tool) {
          res = await callMcpTool(categoryFacet.tool, {
            [categoryFacet.param]: cat,
          });
        }
        if (res) {
          applyReQueryResult(res);
        }
      } catch (err) {
        console.error("[CatalogLayout] Error switching category:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Detect applied sort from backend collection.appliedQuery, toolInput, or prompt (#C)
  const detectedInitialSort = useMemo(() => {
    const applied = collection?.appliedQuery || {};
    const toolInput = getToolInput() || {};
    const prompt = String(
      (window as any).__WIDGET_METADATA__?.user_raw_prompt ||
        (window as any).__WIDGET_DATA__?.user_raw_prompt ||
        applied.user_raw_prompt ||
        "",
    ).toLowerCase();

    const sortBy = String(
      applied.sortBy ||
        applied.sort ||
        toolInput.sortBy ||
        toolInput.sort ||
        "",
    ).toLowerCase();
    const order = String(
      applied.order ||
        applied.orderBy ||
        applied.direction ||
        toolInput.order ||
        toolInput.direction ||
        "",
    ).toLowerCase();

    // 1. Check applied / toolInput parameters
    if (sortBy.includes("price") || sortBy === "price") {
      if (
        order.includes("desc") ||
        order === "high" ||
        order.includes("high_to_low")
      )
        return "price_desc";
      return "price_asc";
    }
    if (
      sortBy.includes("rating") ||
      sortBy === "rating" ||
      sortBy.includes("score")
    ) {
      return "rating_desc";
    }
    if (sortBy.includes("name") || sortBy.includes("title")) {
      return "name_asc";
    }

    // 2. Check user raw prompt for explicit sort intents
    if (
      /price.*(low|asc|cheap|least)/i.test(prompt) ||
      /cheapest/i.test(prompt) ||
      /lowest price/i.test(prompt) ||
      /low to high/i.test(prompt)
    ) {
      return "price_asc";
    }
    if (
      /price.*(high|desc|expensive|most)/i.test(prompt) ||
      /highest price/i.test(prompt) ||
      /most expensive/i.test(prompt) ||
      /high to low/i.test(prompt)
    ) {
      return "price_desc";
    }
    if (
      /rating|rated|top rated|best rated|highest rated|stars/i.test(prompt)
    ) {
      return "rating_desc";
    }
    if (/alphabetical|name\s*(a.*z|asc)/i.test(prompt)) {
      return "name_asc";
    }

    return "default";
  }, [collection?.appliedQuery, title]);

  // Reset/sync filters when the tool data / entity / sort changes
  React.useEffect(() => {
    if (categoryFacet?.selected) {
      setSelectedCategory(String(categoryFacet.selected));
    } else {
      setSelectedCategory("All");
    }
    setSearchTerm("");
    setSelectedFacets({});
    if (detectedInitialSort && detectedInitialSort !== "default") {
      setSortOption(detectedInitialSort);
    } else {
      setSortOption("default");
    }
  }, [title, collection?.entity, detectedInitialSort, categoryFacet?.selected]);

  // Smart Dynamic Facet Extraction for slide-over drawer
  const smartFacets = useMemo(() => {
    const blacklistedKeys = new Set([
      "id",
      "_id",
      "__v",
      "images",
      "image",
      "url",
      "link",
      "createdat",
      "updatedat",
      "created_at",
      "updated_at",
      "latitude",
      "longitude",
      "locationid",
      "postalcode",
      "zipcode",
      "phone",
      "email",
      "address",
      "description",
      "isrestricted",
      "restrictexpiresat",
      "passwordhash",
      "hash",
      "licenseplate",
    ]);

    const facetMap: Record<string, { label: string; values: Set<string> }> = {};

    localRecords.forEach((rec: any) => {
      if (!rec || typeof rec !== "object") return;
      for (const [key, rawVal] of Object.entries(rec)) {
        if (key.startsWith("$")) continue;
        const kLower = key.toLowerCase();
        if (blacklistedKeys.has(kLower)) continue;

        const fieldSchema = fields.find((f) => f.key === key || f.path === key);
        if (fieldSchema?.hidden) continue;

        const fieldLabel =
          fieldSchema?.label ||
          key
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

        if (typeof rawVal === "string" || typeof rawVal === "number" || typeof rawVal === "boolean") {
          const strVal = String(rawVal).trim();
          if (strVal && strVal.length <= 30 && !strVal.startsWith("http")) {
            if (!facetMap[key]) {
              facetMap[key] = { label: fieldLabel, values: new Set() };
            }
            facetMap[key].values.add(strVal);
          }
        } else if (Array.isArray(rawVal) && rawVal.length > 0 && rawVal.length <= 15) {
          rawVal.forEach((item) => {
            if (typeof item === "string" && item.trim() && item.length <= 30 && !item.startsWith("http")) {
              if (!facetMap[key]) {
                facetMap[key] = { label: fieldLabel, values: new Set() };
              }
              facetMap[key].values.add(item.trim());
            }
          });
        } else if (rawVal && typeof rawVal === "object" && (rawVal as any).city) {
          const cityVal = String((rawVal as any).city).trim();
          if (cityVal) {
            const cityKey = `${key}.city`;
            if (!facetMap[cityKey]) {
              facetMap[cityKey] = { label: "City", values: new Set() };
            }
            facetMap[cityKey].values.add(cityVal);
          }
        }
      }
    });

    return Object.entries(facetMap)
      .filter(([_, data]) => data.values.size >= 2 && data.values.size <= 12)
      .map(([key, data]) => ({
        key,
        label: data.label,
        options: Array.from(data.values),
      }));
  }, [localRecords, fields]);

  // 4. Defensive customer filtering & Search + Dynamic Facets Filter
  const filteredRecords = useMemo(() => {
    let list = localRecords;

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

    // Category filter (client-side fallback if not handled by server tool)
    if (selectedCategory !== "All" && categoryField && !categoryFacet?.tool) {
      list = list.filter((rec) => {
        const val = String(getFieldValue(rec, categoryField) || "").toLowerCase();
        return val.includes(selectedCategory.toLowerCase());
      });
    }

    // Dynamic Facets filter
    Object.entries(selectedFacets).forEach(([fKey, fVal]) => {
      if (!fVal || fVal === "All") return;
      list = list.filter((rec: any) => {
        if (!rec || typeof rec !== "object") return false;
        if (fKey.includes(".")) {
          const parts = fKey.split(".");
          let cur = rec;
          for (const p of parts) {
            cur = cur?.[p];
          }
          return String(cur || "").toLowerCase() === fVal.toLowerCase();
        }
        const val = rec[fKey];
        if (Array.isArray(val)) {
          return val.some((item) => String(item).toLowerCase() === fVal.toLowerCase());
        }
        return String(val || "").toLowerCase() === fVal.toLowerCase();
      });
    });

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

    // Price Range Filter
    if (priceMin.trim()) {
      const min = Number(priceMin);
      if (!isNaN(min)) {
        list = list.filter((rec: any) => {
          const p = parseNumericPrice(
            rec.dailyRate ??
              rec.pricePerDay ??
              rec.price_per_day ??
              rec.$price ??
              rec.price ??
              0,
          );
          return p >= min;
        });
      }
    }
    if (priceMax.trim()) {
      const max = Number(priceMax);
      if (!isNaN(max)) {
        list = list.filter((rec: any) => {
          const p = parseNumericPrice(
            rec.dailyRate ??
              rec.pricePerDay ??
              rec.price_per_day ??
              rec.$price ??
              rec.price ??
              0,
          );
          return p <= max;
        });
      }
    }

    // Sorting
    if (sortOption !== "default") {
      const sorted = [...list];
      if (sortOption === "price_asc") {
        sorted.sort((a: any, b: any) => {
          const pA = parseNumericPrice(a.pricePerDay ?? a.price_per_day ?? a.$price ?? a.price ?? a.packageprice ?? 0);
          const pB = parseNumericPrice(b.pricePerDay ?? b.price_per_day ?? b.$price ?? b.price ?? b.packageprice ?? 0);
          return pA - pB;
        });
      } else if (sortOption === "price_desc") {
        sorted.sort((a: any, b: any) => {
          const pA = parseNumericPrice(a.pricePerDay ?? a.price_per_day ?? a.$price ?? a.price ?? a.packageprice ?? 0);
          const pB = parseNumericPrice(b.pricePerDay ?? b.price_per_day ?? b.$price ?? b.price ?? b.packageprice ?? 0);
          return pB - pA;
        });
      } else if (sortOption === "rating_desc") {
        sorted.sort((a: any, b: any) => {
          const rA = Number(a.$metric ?? a.rating ?? a.averageRating ?? 0);
          const rB = Number(b.$metric ?? b.rating ?? b.averageRating ?? 0);
          return rB - rA;
        });
      } else if (sortOption === "name_asc") {
        sorted.sort((a: any, b: any) => {
          const nA = String(a.make ? `${a.make} ${a.model || ""}` : (a.$title ?? a.title ?? a.name ?? ""));
          const nB = String(b.make ? `${b.make} ${b.model || ""}` : (b.$title ?? b.title ?? b.name ?? ""));
          return nA.localeCompare(nB);
        });
      }
      return sorted;
    }

    return list;
  }, [
    localRecords,
    audience,
    selectedCategory,
    categoryField,
    categoryFacet?.tool,
    selectedFacets,
    searchTerm,
    priceMin,
    priceMax,
    sortOption,
  ]);

  const showToolbar =
    localRecords.length > 1 ||
    availableCategories.length > 0 ||
    smartFacets.length > 0 ||
    Boolean(categoryFacet?.optionsTool);

  // Active filter chips detection
  const hasCategoryFilter =
    selectedCategory !== "All" && selectedCategory !== "";
  const hasSearchFilter = Boolean(searchTerm.trim());
  const hasSortFilter = sortOption !== "default";
  const activeFacetEntries = Object.entries(selectedFacets).filter(
    ([_, val]) => val && val !== "All",
  );
  const activeFiltersCount =
    (hasCategoryFilter ? 1 : 0) +
    (hasSearchFilter ? 1 : 0) +
    (hasSortFilter ? 1 : 0) +
    activeFacetEntries.length;

  // Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Reset pagination to page 1 on filter/search/sort/pageSize change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedFacets, sortOption, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const rawItemLabel = collection?.itemLabel || collection?.entity || "item";
  const itemLabelPlural = rawItemLabel.endsWith("s")
    ? rawItemLabel
    : `${rawItemLabel}s`;
  const searchPlaceholder = `Search ${itemLabelPlural.toLowerCase()}...`;

  const isEcomCart = Boolean(
    totalCartCount > 0 ||
    actions?.some((a: any) => /cart|order/i.test(a?.id || a?.label || a?.tool || ""))
  );

  return (
    <section className={styles.container}>
      {/* Dynamic Catalog Toolbar (Search, Filter Sidebar Trigger & Cart Button) */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={styles.searchClearBtn}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.filterDrawerTrigger}
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-label="Open filter and sort drawer"
            >
              <span>🎛️</span>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className={styles.filterCountBadge}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isEcomCart && (
              <button
                type="button"
                className={styles.cartHeaderBtn}
                onClick={openCart}
                aria-label={`View Shopping Cart (${totalCartCount} items)`}
              >
                <span>🛒</span>
                <span>Cart</span>
                {totalCartCount > 0 && (
                  <span className={styles.cartCountBadge}>{totalCartCount}</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Slide-over Filter Drawer */}
      {isFilterDrawerOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <aside
            className={styles.drawerSidebar}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h3>Filter & Sort</h3>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Sort Options */}
              <div className={styles.filterSection}>
                <label className={styles.filterSectionTitle}>Sort By</label>
                <div className={styles.sortOptionsList}>
                  {[
                    { label: "Default", value: "default" },
                    ...(hasPriceField
                      ? [
                          { label: "Price: Low to High", value: "price_asc" },
                          { label: "Price: High to Low", value: "price_desc" },
                        ]
                      : []),
                    ...(hasRatingField
                      ? [{ label: "Highest Rated", value: "rating_desc" }]
                      : []),
                    { label: "Name: A–Z", value: "name_asc" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.filterOptionBtn} ${sortOption === opt.value ? styles.filterOptionBtnActive : ""}`}
                      onClick={() => {
                        setSortOption(opt.value);
                        setIsFilterDrawerOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Options */}
              {(backendCategories.length > 0 ||
                availableCategories.length > 1) && (
                <div className={styles.filterSection}>
                  <label className={styles.filterSectionTitle}>Category</label>
                  <div className={styles.categoryChipsList}>
                    <button
                      type="button"
                      className={`${styles.filterOptionBtn} ${selectedCategory === "All" ? styles.filterOptionBtnActive : ""}`}
                      onClick={() => {
                        handleCategorySelect("All");
                        setIsFilterDrawerOpen(false);
                      }}
                    >
                      All Categories
                    </button>
                    {(backendCategories.length > 0
                      ? backendCategories
                      : availableCategories
                          .slice(1)
                          .map((c) => ({ label: c, value: c }))
                    ).map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`${styles.filterOptionBtn} ${selectedCategory === cat.value ? styles.filterOptionBtnActive : ""}`}
                        onClick={() => {
                          handleCategorySelect(cat.value);
                          setIsFilterDrawerOpen(false);
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Facets (Transmission, Fuel, Seats, Make, City, etc.) */}
              {smartFacets.map((facet) => {
                const currentSelected = selectedFacets[facet.key] || "All";
                return (
                  <div key={facet.key} className={styles.filterSection}>
                    <label className={styles.filterSectionTitle}>
                      {facet.label}
                    </label>
                    <div className={styles.categoryChipsList}>
                      <button
                        type="button"
                        className={`${styles.filterOptionBtn} ${currentSelected === "All" ? styles.filterOptionBtnActive : ""}`}
                        onClick={() => {
                          setSelectedFacets((prev) => {
                            const next = { ...prev };
                            delete next[facet.key];
                            return next;
                          });
                        }}
                      >
                        All
                      </button>
                      {facet.options.map((opt) => {
                        const isSelected = currentSelected === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`${styles.filterOptionBtn} ${isSelected ? styles.filterOptionBtnActive : ""}`}
                            onClick={() => {
                              setSelectedFacets((prev) => ({
                                ...prev,
                                [facet.key]: isSelected ? "All" : opt,
                              }));
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerResetBtn}
                onClick={() => {
                  handleCategorySelect("All");
                  setSelectedFacets({});
                  setSearchTerm("");
                  setSortOption("default");
                  setIsFilterDrawerOpen(false);
                }}
              >
                Reset All
              </button>
              <button
                type="button"
                className={styles.drawerApplyBtn}
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Apply & Close
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Applied Filters Chips Row */}
      {activeFiltersCount > 0 && (
        <div className={styles.appliedFiltersRow}>
          {hasCategoryFilter && (
            <span className={styles.filterChip}>
              Category: {selectedCategory}
              <button
                type="button"
                className={styles.filterChipRemove}
                onClick={() => handleCategorySelect("All")}
                title="Remove Category filter"
              >
                ✕
              </button>
            </span>
          )}

          {activeFacetEntries.map(([fKey, fVal]) => {
            const facetLabel =
              smartFacets.find((f) => f.key === fKey)?.label || fKey;
            return (
              <span key={fKey} className={styles.filterChip}>
                {facetLabel}: {fVal}
                <button
                  type="button"
                  className={styles.filterChipRemove}
                  onClick={() =>
                    setSelectedFacets((prev) => {
                      const next = { ...prev };
                      delete next[fKey];
                      return next;
                    })
                  }
                  title={`Remove ${facetLabel} filter`}
                >
                  ✕
                </button>
              </span>
            );
          })}

          {hasSearchFilter && (
            <span className={styles.filterChip}>
              Search: "{searchTerm}"
              <button
                type="button"
                className={styles.filterChipRemove}
                onClick={() => setSearchTerm("")}
                title="Remove Search filter"
              >
                ✕
              </button>
            </span>
          )}

          {hasSortFilter && (
            <span className={styles.filterChip}>
              Sort: {sortOption.replace("_", " ")}
              <button
                type="button"
                className={styles.filterChipRemove}
                onClick={() => setSortOption("default")}
                title="Reset Sort"
              >
                ✕
              </button>
            </span>
          )}

          {activeFiltersCount > 1 && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={() => {
                handleCategorySelect("All");
                setSelectedFacets({});
                setSearchTerm("");
                setSortOption("default");
              }}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      <div className={styles.catalogWrapper}>
        {/* Main Products Grid Area */}
        <div className={styles.sidebarMain}>
          {/* Category Pills (When no backend optionsTool exists, fallback to available in-record pills) */}
          {!categoryFacet?.optionsTool && availableCategories.length > 1 && (
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

      {/* Product Cards Grid & Loading Overlay */}
      {isLoading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Loading products...</span>
        </div>
      ) : filteredRecords.length > 0 ? (
        <>
          <CardsBlock
            block={cardsBlock}
            records={paginatedRecords}
            fields={fields}
            collection={collection}
            capabilities={capabilities}
            actions={actions}
            audience={audience}
          />

          {/* Pagination Bar (Only show if more than 8 items) */}
          {filteredRecords.length > 8 && (
            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                <span>
                  Showing{" "}
                  <strong>{(currentPage - 1) * pageSize + 1}</strong>–
                  <strong>
                    {Math.min(filteredRecords.length, currentPage * pageSize)}
                  </strong>{" "}
                  of <strong>{filteredRecords.length}</strong> items
                </span>
                <div className={styles.pageSizeGroup}>
                  <span>Show:</span>
                  <select
                    className={styles.limitSelect}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Items per page"
                  >
                    <option value={8}>8 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={48}>48 per page</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationControls}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                  >
                    &larr; Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      return Math.abs(p - currentPage) <= 1;
                    })
                    .map((p, idx, arr) => {
                      const showEllipsisBefore =
                        idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={`page-${p}`}>
                          {showEllipsisBefore && (
                            <span className={styles.ellipsis}>
                              …
                            </span>
                          )}
                          <button
                            type="button"
                            className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ""}`}
                            onClick={() => setCurrentPage(p)}
                            aria-label={`Page ${p}`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Next Page"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.noResults}>
          <p>
            {searchTerm || selectedCategory !== "All"
              ? "No products match your current filters."
              : "No products available."}
          </p>
          {(searchTerm || selectedCategory !== "All") && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSortOption("default");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
        </div>
      </div>
    </section>
  );
};
