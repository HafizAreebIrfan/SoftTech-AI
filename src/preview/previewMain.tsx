import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { GenericWidgetRenderer } from "../presentation/widgets/components";
import { applyReQueryResult } from "../utils/mcpBridge";
import { useCartStore } from "../infrastructure/store/cartStore";
import { PREVIEW_FIXTURES } from "./mocks";
import type {
  McpToolResultPayload,
  WidgetAudience,
} from "../domain/entities/GenericWidget";

/**
 * DEV-ONLY widget preview harness. Served by Vite at /preview.html (this file
 * is in no build input, so `npm run build` / `build:widget` never emit it).
 *
 * It seeds the real widget store with mock fixtures via `applyReQueryResult`
 * (the same seam a re-query uses), so what renders here is the exact
 * `GenericWidgetRenderer` ChatGPT would show — no ChatGPT host required (the
 * Apps SDK connect fails gracefully when `window.openai` is absent).
 */

/** Clone a fixture and stamp the chosen audience onto its structuredContent. */
function withAudience(
  payload: McpToolResultPayload,
  audience: WidgetAudience,
): McpToolResultPayload {
  const clone = structuredClone(payload);
  clone.structuredContent.audience = audience;
  return clone;
}

const barStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  padding: "12px 16px",
  marginBottom: 8,
  background: "#111215",
  borderBottom: "1px solid #22242a",
  fontFamily: "'Poppins', sans-serif",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#94a3b8",
};

const selectStyle: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #22242a",
  borderRadius: 8,
  color: "#ffffff",
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
  minWidth: 220,
};

function audienceBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#3b82f6" : "transparent",
    border: `1px solid ${active ? "#3b82f6" : "#22242a"}`,
    borderRadius: 8,
    color: active ? "#ffffff" : "#94a3b8",
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function PreviewApp() {
  const [index, setIndex] = useState(0);
  const [audience, setAudience] = useState<WidgetAudience>("customer");

  const fixture = useMemo(() => PREVIEW_FIXTURES[index], [index]);

  useEffect(() => {
    const cart = useCartStore.getState();
    // Fresh start every switch so a cart seed can't leak into other layouts.
    cart.clearCart();

    applyReQueryResult(withAudience(fixture.payload, audience));

    if (fixture.kind === "cart" && fixture.cartItems) {
      fixture.cartItems.forEach(({ quantity, ...rest }) => {
        cart.addItem(rest, quantity);
      });
      // Defer opening the overlay: GenericWidget resets `viewFullCart` in a
      // `[toolResult]` effect on every new result, so we must win that race.
      const t = setTimeout(() => {
        useCartStore.getState().setViewFullCart(true);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [fixture, audience]);

  return (
    <>
      <div style={barStyle}>
        <span style={{ ...labelStyle, color: "#ffffff", fontWeight: 700 }}>
          Widget Preview
        </span>
        <label style={labelStyle} htmlFor="preview-layout">
          Layout
        </label>
        <select
          id="preview-layout"
          style={selectStyle}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {PREVIEW_FIXTURES.map((f, i) => (
            <option key={f.label} value={i}>
              {f.label}
            </option>
          ))}
        </select>

        <span style={labelStyle}>Audience</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            style={audienceBtnStyle(audience === "customer")}
            onClick={() => setAudience("customer")}
          >
            Customer
          </button>
          <button
            type="button"
            style={audienceBtnStyle(audience === "admin")}
            onClick={() => setAudience("admin")}
          >
            Admin
          </button>
        </div>

        <span style={{ ...labelStyle, marginLeft: "auto", opacity: 0.7 }}>
          dev-only · mock data
        </span>
      </div>

      <GenericWidgetRenderer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreviewApp />
  </StrictMode>,
);
