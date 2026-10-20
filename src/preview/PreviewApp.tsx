import React, { useState, useEffect, useMemo } from "react";
import { GenericWidgetRenderer } from "../presentation/widgets/components";
import { applyReQueryResult } from "../utils/mcp";
import { useCartStore } from "../infrastructure/store/cartStore";
import { useAuthStore } from "../infrastructure/store/authStore";
import {
  useMcpWidgetStore,
} from "../infrastructure/store/mcpWidgetStore";
import { PREVIEW_FIXTURES } from "./mocks";
import { baseCar } from "./mocks/detail";
import { productDetailPayload } from "./mocks/productDetail";
import type {
  WidgetAudience,
} from "../domain/entities/GenericWidget";

export interface PreviewCompany {
  slug: string;
  name: string;
  themeColor: string;
  shopCatalogUrl: string;
}

export const PREVIEW_COMPANIES: PreviewCompany[] = [
  {
    slug: "apex_rentals",
    name: "Apex Car Rentals",
    themeColor: "#3b82f6",
    shopCatalogUrl: "https://apexrentals.com/catalog",
  },
  {
    slug: "nordic_stays",
    name: "Nordic Luxury Stays",
    themeColor: "#10b981",
    shopCatalogUrl: "https://nordicstays.com/catalog",
  },
  {
    slug: "lumina_tech",
    name: "Lumina Tech Store",
    themeColor: "#8b5cf6",
    shopCatalogUrl: "https://luminatech.com/shop",
  },
];

type ViewportMode = "desktop" | "mobile" | "mobile-plus";

const VIEWPORT_CONFIG: Record<
  ViewportMode,
  { label: string; width: string; height: string; icon: string }
> = {
  desktop: {
    label: "Desktop",
    width: "100%",
    height: "auto",
    icon: "💻",
  },
  mobile: {
    label: "Mobile (iPhone 390px)",
    width: "390px",
    height: "812px",
    icon: "📱",
  },
  "mobile-plus": {
    label: "Mobile Max (430px)",
    width: "430px",
    height: "880px",
    icon: "📱",
  },
};

export interface PreviewAppProps {
  embedded?: boolean;
  initialViewport?: ViewportMode;
  initialFixtureIndex?: number;
}

export const PreviewApp: React.FC<PreviewAppProps> = ({
  embedded = false,
  initialViewport = "desktop",
  initialFixtureIndex = 1,
}) => {
  const { user } = useAuthStore();
  const [fixtureIndex, setFixtureIndex] = useState(initialFixtureIndex);
  const [audience, setAudience] = useState<WidgetAudience>("customer");
  const [viewport, setViewport] = useState<ViewportMode>(initialViewport);
  const [showStateInspector, setShowStateInspector] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [activeTestHint, setActiveTestHint] = useState<string | null>(
    "Tap '📱 Test Mobile Map Fullscreen' or '📱 Test Mobile Catalog' below to quickly verify your changes.",
  );

  const subViewHistory = useMcpWidgetStore((state) => state.subViewHistory);
  const popSubView = useMcpWidgetStore((state) => state.popSubView);

  // Dynamically include the user's active company in the switcher list
  const companiesList = useMemo(() => {
    const list = [...PREVIEW_COMPANIES];
    if (user?.id) {
      const userSlug = (user as any).mcpSlug || user.id || "my_tenant";
      if (!list.some((c) => c.slug === userSlug)) {
        list.unshift({
          slug: userSlug,
          name: user.name ? `${user.name} (Active Tenant)` : "Your Company (Active)",
          themeColor: (user as any)?.uiPreference?.themeColor || "#6366f1",
          shopCatalogUrl: "",
        });
      }
    }
    return list;
  }, [user]);

  const [company, setCompany] = useState<PreviewCompany>(companiesList[0]);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 19),
    ]);
  };

  // 1. Initialize Mock openai host environment for previewing
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(window as any).openai) {
      (window as any).openai = {};
    }

    const host = (window as any).openai;

    host.callTool = async (toolName: string, args: any) => {
      addLog(`Tool call dispatched: "${toolName}" with ${JSON.stringify(args)}`);
      // Simulate network response latency
      await new Promise((r) => setTimeout(r, 120));

      if (toolName === "get_car" || /car|vehicle/i.test(toolName)) {
        return {
          structuredContent: {
            data: {
              ...baseCar,
              id: args?.id || args?.carId || "car-1",
              name: `Enriched ${args?.id || "Vehicle"}`,
              isEnriched: true,
            },
          },
        };
      }

      if (toolName === "get_product" || /product|item/i.test(toolName)) {
        const productData = (productDetailPayload.structuredContent as any).data[0];
        return {
          structuredContent: {
            data: {
              ...productData,
              id: args?.id || args?.productId || 1,
              title: `Enriched Product #${args?.id || 1}`,
              isEnriched: true,
            },
          },
        };
      }

      if (/availab|calendar/i.test(toolName)) {
        return {
          data: {
            availableDates: ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-25"],
            conflictingBookings: [
              { pickupDate: "2026-10-23", dropoffDate: "2026-10-24", status: "CONFIRMED" },
            ],
          },
        };
      }

      return { success: true };
    };

    host.setWidgetState = (nextState: any) => {
      host.widgetState = nextState;
      setRefreshCounter((c) => c + 1);
    };

    host.requestDisplayMode = async ({ mode }: any) => {
      addLog(`Display mode requested: "${mode}"`);
      return { mode };
    };

    host.sendFollowUpMessage = ({ prompt }: any) => {
      addLog(`[sendFollowUpMessage triggered]: ${prompt}`);
    };
  }, []);

  // 2. Synchronize viewport attribute on documentElement
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (viewport === "desktop") {
      document.documentElement.dataset.previewViewport = "desktop";
    } else {
      document.documentElement.dataset.previewViewport = "mobile";
    }
  }, [viewport]);

  // 3. Prepare payload with Company & Audience stamped
  const fixture = useMemo(() => PREVIEW_FIXTURES[fixtureIndex], [fixtureIndex]);

  const preparedPayload = useMemo(() => {
    const clone = structuredClone(fixture.payload);
    clone.structuredContent.audience = audience;

    const meta = (clone.structuredContent.metadata || {}) as Record<string, any>;
    meta.companySlug = company.slug;
    meta.companyName = company.name;
    meta.themeColor = company.themeColor;
    meta.shopCatalogUrl = company.shopCatalogUrl;
    clone.structuredContent.metadata = meta;

    const auth = ((clone.structuredContent as any).authStrategy || {}) as Record<string, any>;
    auth.companySlug = company.slug;
    auth.companyName = company.name;
    auth.themeColor = company.themeColor;
    (clone.structuredContent as any).authStrategy = auth;

    return clone;
  }, [fixture, audience, company]);

  // 4. Apply result whenever fixture or company changes
  useEffect(() => {
    const cart = useCartStore.getState();
    cart.clearCart();

    addLog(`Loading fixture: "${fixture.label}" for company: "${company.name}"`);
    applyReQueryResult(preparedPayload);

    if (fixture.kind === "cart" && fixture.cartItems) {
      fixture.cartItems.forEach(({ quantity, ...rest }) => {
        cart.addItem(rest, quantity);
      });
      const t = setTimeout(() => {
        useCartStore.getState().setViewFullCart(true);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [preparedPayload, fixture.kind, fixture.cartItems, company.name, fixture.label]);

  // Track subview transitions
  useEffect(() => {
    if (subViewHistory.length > 0) {
      const top = subViewHistory[subViewHistory.length - 1];
      addLog(`SubView pushed: "${top.title}" (${top.blockType || "generic"})`);
    } else {
      addLog(`SubView history root`);
    }
  }, [subViewHistory.length]);

  // Read current company state for State Inspector
  const currentStateSnapshot = useMemo(() => {
    if (typeof window === "undefined") return { openaiState: {}, localStorageState: {} };
    const openaiState = (window as any).openai?.widgetState || {};
    const localEntries: Record<string, any> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("mcp_") || k === "last_mcp_widget_result")) {
          try {
            localEntries[k] = JSON.parse(localStorage.getItem(k) || "");
          } catch {
            localEntries[k] = localStorage.getItem(k);
          }
        }
      }
    } catch {}

    return { openaiState, localStorageState: localEntries };
  }, [refreshCounter, company, showStateInspector]);

  const activeVarName = `company_${company.slug}`;
  const activeStorageKey = `mcp_widget_result_${company.slug}`;

  // Quick verification presets for user convenience
  const handleRunPreset = (presetId: string) => {
    popSubView();
    if (presetId === "mobile_map") {
      setViewport("mobile");
      // Find "Map catalog (cars)" fixture
      const idx = PREVIEW_FIXTURES.findIndex((f) => /map catalog/i.test(f.label));
      setFixtureIndex(idx >= 0 ? idx : 1);
      setActiveTestHint(
        "🎯 Test 1 (Map on Mobile): Click any car card in the carousel or tap a marker. The Single Item View will open full screen (covering the whole layout, NO desktop sidebar dock). Click '← Back' inside the card to return to the map.",
      );
      addLog("Preset activated: Mobile Map Fullscreen Drilldown");
    } else if (presetId === "mobile_catalog") {
      setViewport("mobile");
      // Find "Catalog (products)" fixture
      const idx = PREVIEW_FIXTURES.findIndex((f) => /catalog \(products\)/i.test(f.label));
      setFixtureIndex(idx >= 0 ? idx : 0);
      setActiveTestHint(
        "🎯 Test 2 (Catalog on Mobile): Tap any product card below. The Single Item View will open immediately with full specs, price, and actions (no blank screen). Click '← Back' to return to products.",
      );
      addLog("Preset activated: Mobile Product Catalog Drilldown");
    } else if (presetId === "company_isolation") {
      setShowStateInspector(true);
      setActiveTestHint(
        "🎯 Test 3 (Multi-Company State Isolation): Switch companies above (Apex, Nordic, Lumina). Notice each company writes to its own isolated variable `company_<slug>` in window.openai.widgetState and localStorage. Zero UI collision or GPT hallucination!",
      );
      addLog("Preset activated: Multi-Company State Isolation Check");
    } else if (presetId === "desktop_map") {
      setViewport("desktop");
      const idx = PREVIEW_FIXTURES.findIndex((f) => /map catalog/i.test(f.label));
      setFixtureIndex(idx >= 0 ? idx : 1);
      setActiveTestHint(
        "🎯 Desktop Mode: On desktop screens (>768px), clicking a car docks the detail panel on the side while keeping the map interactively visible.",
      );
      addLog("Preset activated: Desktop Map View with Docked Sidebar");
    }
  };

  return (
    <div
      style={{
        minHeight: embedded ? "640px" : "100vh",
        background: "#09090b",
        color: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
        display: "flex",
        flexDirection: "column",
        borderRadius: embedded ? "12px" : "0",
        overflow: "hidden",
        border: embedded ? "1px solid #27272a" : "none",
      }}
    >
      {/* Top Testing Header Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "#121316",
          borderBottom: "1px solid #22242a",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 10px #22c55e",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
            Widget Preview Harness
          </span>
          {embedded && (
            <span
              style={{
                fontSize: "10px",
                background: "rgba(59, 130, 246, 0.2)",
                color: "#60a5fa",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              EMBEDDED
            </span>
          )}
        </div>

        {/* Layout Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label
            htmlFor="fixture-select"
            style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}
          >
            Fixture:
          </label>
          <select
            id="fixture-select"
            value={fixtureIndex}
            onChange={(e) => {
              popSubView();
              setFixtureIndex(Number(e.target.value));
            }}
            style={{
              background: "#09090b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              color: "#ffffff",
              padding: "6px 10px",
              fontSize: "12.5px",
              outline: "none",
            }}
          >
            {PREVIEW_FIXTURES.map((f, i) => (
              <option key={f.label} value={i}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Viewport Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>
            Viewport:
          </span>
          <div
            style={{
              display: "flex",
              background: "#09090b",
              borderRadius: "8px",
              padding: "2px",
              border: "1px solid #27272a",
            }}
          >
            {(["desktop", "mobile", "mobile-plus"] as ViewportMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                style={{
                  background: viewport === v ? "#3b82f6" : "transparent",
                  color: viewport === v ? "#ffffff" : "#94a3b8",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{VIEWPORT_CONFIG[v].icon}</span>
                <span>
                  {v === "desktop"
                    ? "Desktop"
                    : v === "mobile"
                      ? "Mobile (390px)"
                      : "Max (430px)"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Company Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>
            Company:
          </span>
          <select
            value={company.slug}
            onChange={(e) => {
              const selected = companiesList.find((c) => c.slug === e.target.value);
              if (selected) {
                popSubView();
                setCompany(selected);
              }
            }}
            style={{
              background: "#09090b",
              border: `1px solid ${company.themeColor}`,
              borderRadius: "8px",
              color: "#ffffff",
              padding: "6px 10px",
              fontSize: "12.5px",
              outline: "none",
            }}
          >
            {companiesList.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Audience */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setAudience("customer")}
            style={{
              background: audience === "customer" ? "#3b82f6" : "transparent",
              color: audience === "customer" ? "#ffffff" : "#94a3b8",
              border: `1px solid ${audience === "customer" ? "#3b82f6" : "#27272a"}`,
              borderRadius: "8px",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setAudience("admin")}
            style={{
              background: audience === "admin" ? "#3b82f6" : "transparent",
              color: audience === "admin" ? "#ffffff" : "#94a3b8",
              border: `1px solid ${audience === "admin" ? "#3b82f6" : "#27272a"}`,
              borderRadius: "8px",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Admin
          </button>
        </div>

        {/* State Inspector Toggle */}
        <button
          type="button"
          onClick={() => setShowStateInspector(!showStateInspector)}
          style={{
            marginLeft: "auto",
            background: showStateInspector ? "#8b5cf6" : "#1e1e24",
            color: "#ffffff",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🔍</span>
          <span>{showStateInspector ? "Hide State Inspector" : "Inspect State Variables"}</span>
        </button>

        {/* Fullscreen external opener for embedded mode */}
        {embedded && (
          <a
            href="/preview"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>Open Studio</span>
            <span>↗</span>
          </a>
        )}
      </header>

      {/* Quick Test Presets Navigation Bar */}
      <div
        style={{
          background: "#16171d",
          borderBottom: "1px solid #22242a",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>
          ⚡ 1-Click Verification Tests:
        </span>
        <button
          type="button"
          onClick={() => handleRunPreset("mobile_map")}
          style={{
            background:
              viewport === "mobile" && /map/i.test(fixture.label)
                ? "#2563eb"
                : "rgba(255, 255, 255, 0.06)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>📱</span>
          <span>Test Mobile Map Drilldown</span>
        </button>
        <button
          type="button"
          onClick={() => handleRunPreset("mobile_catalog")}
          style={{
            background:
              viewport === "mobile" && /catalog \(products\)/i.test(fixture.label)
                ? "#2563eb"
                : "rgba(255, 255, 255, 0.06)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>📱</span>
          <span>Test Mobile Catalog Drilldown</span>
        </button>
        <button
          type="button"
          onClick={() => handleRunPreset("company_isolation")}
          style={{
            background: showStateInspector ? "#7c3aed" : "rgba(255, 255, 255, 0.06)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>🏢</span>
          <span>Test Company State Separation</span>
        </button>
        <button
          type="button"
          onClick={() => handleRunPreset("desktop_map")}
          style={{
            background:
              viewport === "desktop" && /map/i.test(fixture.label)
                ? "#2563eb"
                : "rgba(255, 255, 255, 0.06)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>💻</span>
          <span>Test Desktop Map Dock</span>
        </button>
      </div>

      {/* Guided Test Hint Callout Banner */}
      {activeTestHint && (
        <div
          style={{
            background: "linear-gradient(90deg, #1e1b4b, #172554)",
            borderBottom: "1px solid rgba(99, 102, 241, 0.3)",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#e0e7ff",
            lineHeight: 1.4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💡</span>
            <span>{activeTestHint}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTestHint(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#a5b4fc",
              fontSize: "14px",
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Real-time Status Banner */}
      <div
        style={{
          background: "#0c0d12",
          borderBottom: "1px solid #1a1c23",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          fontSize: "11.5px",
          color: "#94a3b8",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#64748b" }}>Active Company:</span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>{company.name}</span>
          <span
            style={{
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              padding: "1px 6px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "10.5px",
            }}
          >
            slug: {company.slug}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#64748b" }}>State Variable:</span>
          <code style={{ color: "#34d399", fontSize: "11px" }}>
            openai.widgetState.{activeVarName}
          </code>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#64748b" }}>Storage Key:</span>
          <code style={{ color: "#fbbf24", fontSize: "11px" }}>
            {activeStorageKey}
          </code>
        </div>

        {subViewHistory.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <span
              style={{
                background: "rgba(139, 92, 246, 0.25)",
                color: "#c084fc",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 600,
                border: "1px solid rgba(139, 92, 246, 0.35)",
              }}
            >
              Full-Screen SubView: {subViewHistory[subViewHistory.length - 1].title}
            </span>
            <button
              type="button"
              onClick={() => popSubView()}
              style={{
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Pop to Root
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: viewport === "desktop" ? "stretch" : "center",
          padding: viewport === "desktop" ? "0" : embedded ? "16px 8px" : "32px 16px",
          background: viewport === "desktop" ? "#09090b" : "#050507",
        }}
      >
        {viewport === "desktop" ? (
          /* Desktop Mode: Full width widget rendering */
          <div style={{ width: "100%", maxWidth: "100%", minHeight: embedded ? "580px" : "100vh" }}>
            <GenericWidgetRenderer />
          </div>
        ) : (
          /* Mobile Mode: Realistic Phone Device Mockup */
          <div
            style={{
              width: VIEWPORT_CONFIG[viewport].width,
              height: embedded ? "640px" : VIEWPORT_CONFIG[viewport].height,
              maxHeight: embedded ? "680px" : "92vh",
              background: "#09090b",
              borderRadius: "44px",
              border: "3.5px solid #27272a",
              boxShadow:
                "0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Phone Top Notch / Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "116px",
                height: "28px",
                background: "#000000",
                borderRadius: "20px",
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#18181b",
                }}
              />
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#09090b",
                }}
              />
            </div>

            {/* Mobile Status Bar */}
            <div
              style={{
                height: "44px",
                padding: "0 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                fontWeight: 600,
                color: "#ffffff",
                background: "#09090b",
                flexShrink: 0,
                zIndex: 1500,
              }}
            >
              <span>9:41</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span>5G</span>
                <span>📶</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* Mobile Sub-view back bar indicator */}
            {subViewHistory.length > 0 && (
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  borderBottom: "1px solid rgba(99, 102, 241, 0.3)",
                  padding: "5px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  zIndex: 1400,
                }}
              >
                <button
                  type="button"
                  onClick={() => popSubView()}
                  style={{
                    background: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  &larr; Back to {/map/i.test(fixture.label) ? "Map" : "Catalog"}
                </button>
                <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
                  Full Screen Drilldown Active
                </span>
              </div>
            )}

            {/* Scrollable Widget Content inside Phone Container */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                position: "relative",
              }}
            >
              <GenericWidgetRenderer />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div
              style={{
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#09090b",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "134px",
                  height: "4.5px",
                  background: "rgba(255, 255, 255, 0.45)",
                  borderRadius: "3px",
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* State Inspector Drawer */}
      {showStateInspector && (
        <aside
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            width: "min(640px, 100%)",
            height: "70vh",
            background: "#111215",
            borderTop: "2px solid #8b5cf6",
            borderLeft: "1px solid #27272a",
            zIndex: 3000,
            boxShadow: "0 -20px 50px rgba(0, 0, 0, 0.85)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid #22242a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#16171d",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px" }}>🔍</span>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                MCP Company State Inspector
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  background: "rgba(34, 197, 94, 0.15)",
                  color: "#22c55e",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                ✓ Isolated per company
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowStateInspector(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "18px",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Quick Test Instructions */}
            <div
              style={{
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                color: "#93c5fd",
                lineHeight: 1.5,
              }}
            >
              <strong>State Isolation Verification:</strong> When you switch companies above, this
              company&apos;s state is stored in its own dedicated variable <code>{activeVarName}</code>{" "}
              inside <code>openai.widgetState</code> and in <code>localStorage</code> under{" "}
              <code>{activeStorageKey}</code>. Neither state will ever overwrite other companies!
            </div>

            {/* Active Company Dedicated Variable */}
            <div>
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}
              >
                1. window.openai.widgetState.{activeVarName}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#09090b",
                  border: "1px solid #27272a",
                  color: "#a5b4fc",
                  fontSize: "11.5px",
                  fontFamily: "monospace",
                  maxHeight: "180px",
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(
                  currentStateSnapshot.openaiState[activeVarName] || {
                    status: "Empty (switch company to seed)",
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            {/* All Isolated Companies in State */}
            <div>
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", marginBottom: "6px" }}
              >
                2. window.openai.widgetState.companies (All Registered Companies)
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#09090b",
                  border: "1px solid #27272a",
                  color: "#6ee7b7",
                  fontSize: "11.5px",
                  fontFamily: "monospace",
                  maxHeight: "140px",
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(currentStateSnapshot.openaiState.companies || {}, null, 2)}
              </pre>
            </div>

            {/* LocalStorage Keys */}
            <div>
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#fbbf24", marginBottom: "6px" }}
              >
                3. Isolated LocalStorage Entries
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#09090b",
                  border: "1px solid #27272a",
                  color: "#fde047",
                  fontSize: "11.5px",
                  fontFamily: "monospace",
                  maxHeight: "160px",
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(currentStateSnapshot.localStorageState, null, 2)}
              </pre>
            </div>

            {/* Recent Event Logs */}
            <div>
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}
              >
                4. Live Activity Stream
              </div>
              <div
                style={{
                  background: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  maxHeight: "120px",
                  overflowY: "auto",
                  color: "#94a3b8",
                }}
              >
                {logs.length === 0 ? (
                  <div>No activity recorded yet</div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{ padding: "2px 0", borderBottom: "1px solid #18181b" }}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
