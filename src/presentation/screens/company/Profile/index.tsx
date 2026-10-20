import React, { FC, useState } from "react";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { showToast } from "../../../../utils/toast";
import {
  saveCompanyUiSelection,
  updateCompanyApis,
} from "../../../../adapters/api/authApi";
import { SimulatedWidgetPreview } from "../../../components/common/SimulatedWidgetPreview";
import { PreviewApp } from "../../../../preview/PreviewApp";
import {
  CheckIcon,
  SlidersIcon,
  SparklesIcon,
  KeyIcon,
  LockIcon,
  ShieldLockIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/dashboard.module.css";

interface ProfileProps {
  embedMode?: boolean;
}

export const Profile: FC<ProfileProps> = ({ embedMode = false }) => {
  const { colors } = useThemeStore();
  const { user, apisList, MapsApiKey, setMapsApiKey } = useAuthStore();

  const [selectedThemeColor, setSelectedThemeColor] = useState<string>(
    (user as any)?.uiPreference?.themeColor || colors.SwatchIndigo || "#6366f1",
  );
  const [activeAudienceTab, setActiveAudienceTab] = useState<
    "customer" | "admin"
  >(((user as any)?.uiPreference?.audienceDefault as any) || "customer");
  const [mapsKeyInput, setMapsKeyInput] = useState<string>(MapsApiKey || "");
  const [isSavingMapsKey, setIsSavingMapsKey] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"widget" | "card">("widget");

  const PRESET_COLOR_SWATCHES = [
    { name: "Indigo Neon", hex: colors.SwatchIndigo || "#6366f1" },
    { name: "Emerald Mint", hex: colors.SwatchEmerald || "#10b981" },
    { name: "Crimson Coral", hex: colors.SwatchCrimson || "#f43f5e" },
    { name: "Ocean Blue", hex: colors.SwatchOcean || "#0284c7" },
    { name: "Cyber Violet", hex: colors.SwatchViolet || "#8b5cf6" },
    { name: "Sunset Amber", hex: colors.SwatchAmber || "#f59e0b" },
    { name: "Slate Stealth", hex: colors.SwatchSlate || "#64748b" },
  ];

  const handleColorChange = async (hex: string) => {
    setSelectedThemeColor(hex);
    if (user?.id) {
      try {
        await saveCompanyUiSelection(user.id, {
          themeColor: hex,
          audienceDefault: activeAudienceTab,
        } as any);
        showToast("Brand theme color saved successfully!", "success");
      } catch (err) {
        console.warn("Save UI selection error:", err);
      }
    }
  };

  const handleAudienceChange = async (tab: "customer" | "admin") => {
    setActiveAudienceTab(tab);
    if (user?.id) {
      try {
        await saveCompanyUiSelection(user.id, {
          themeColor: selectedThemeColor,
          audienceDefault: tab,
        } as any);
      } catch (err) {
        console.warn("Save UI selection error:", err);
      }
    }
  };

  const handleSaveMapsKey = async () => {
    setMapsApiKey(mapsKeyInput);
    if (!user?.id) return;
    setIsSavingMapsKey(true);
    try {
      await updateCompanyApis(user.id, {
        apis: apisList,
        MapsApiKey: mapsKeyInput,
      });
      showToast("Map API key saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save Map key", "error");
    } finally {
      setIsSavingMapsKey(false);
    }
  };

  const companyInitials = (user?.name || "CO")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Active Member";

  const content = (
    <div className="flex flex-col gap-6">
      {!embedMode && (
        <div className="flex flex-col gap-1 mb-2">
          <h1 className={styles.welcomeTitle}>Organization &amp; UI Theming</h1>
          <p className={styles.subtitle}>
            Manage brand appearance, ChatGPT widget theme curator, and
            organization credentials.
          </p>
        </div>
      )}

      {/* Brand Theme & Color Curator */}
      <div className={styles.curatorCard}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Brand Appearance &amp; UI Theming
          </span>
          <h3 className="text-xl font-bold mt-1 text-slate-100">
            ChatGPT Interactive Widget Curator
          </h3>
          <p className={styles.subtitle}>
            Select your brand accent color. SoftTech AI's MCP engine dynamically
            themes your interactive ChatGPT cards and widgets to reflect your
            corporate identity.
          </p>
        </div>

        <div className={styles.curatorGrid}>
          {/* Controls Column */}
          <div className={styles.curatorLeft}>
            {/* Preset Color Swatches */}
            <div>
              <label className={styles.curatorSectionLabel}>
                Preset Brand Color Palette
              </label>
              <div className={styles.swatchesGrid}>
                {PRESET_COLOR_SWATCHES.map((swatch) => {
                  const isSelected =
                    selectedThemeColor.toLowerCase() ===
                    swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => handleColorChange(swatch.hex)}
                      title={swatch.name}
                      className={`${styles.swatchBtn} ${
                        isSelected ? styles.swatchBtnSelected : ""
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && <CheckIcon size={16} color="#ffffff" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Picker */}
            <div>
              <label className={styles.curatorSectionLabel}>
                Custom HEX Accent Color
              </label>
              <div className={styles.customHexRow}>
                <input
                  type="color"
                  value={selectedThemeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className={styles.colorPickerInput}
                />
                <input
                  type="text"
                  value={selectedThemeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#6366f1"
                  className={styles.hexTextInput}
                />
              </div>
            </div>

            {/* Target Audience View Toggle */}
            <div>
              <label className={styles.curatorSectionLabel}>
                Target Audience View Mode
              </label>
              <div className={styles.audienceToggleGroup}>
                <button
                  type="button"
                  onClick={() => handleAudienceChange("customer")}
                  className={`${styles.audienceBtn} ${
                    activeAudienceTab === "customer"
                      ? styles.audienceBtnActive
                      : ""
                  }`}
                >
                  Customer View
                </button>
                <button
                  type="button"
                  onClick={() => handleAudienceChange("admin")}
                  className={`${styles.audienceBtn} ${
                    activeAudienceTab === "admin"
                      ? styles.audienceBtnActive
                      : ""
                  }`}
                >
                  Admin Telemetry
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
                Preview how interactive catalog cards render for public
                end-users vs internal staff.
              </p>
            </div>

            {/* Map API Key (MapsApiKey) */}
            <div className="pt-2 border-t border-slate-700/40">
              <label className={styles.curatorSectionLabel}>
                Map API Key (MapsApiKey)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={mapsKeyInput}
                  onChange={(e) => setMapsKeyInput(e.target.value)}
                  placeholder="Enter MapsApiKey (optional)..."
                  className={styles.hexTextInput}
                />
                <button
                  type="button"
                  disabled={isSavingMapsKey}
                  onClick={handleSaveMapsKey}
                  className={styles.ghostBtn}
                >
                  {isSavingMapsKey ? "Saving..." : "Save Key"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Optional: Custom tile provider or reverse geocoding key (MapsApiKey).
              </p>
            </div>
          </div>

          {/* Live Preview Column */}
          <div>
            <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <SparklesIcon size={14} color={selectedThemeColor} />
                  <span>Interactive ChatGPT MCP Widget Preview</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  LIVE RENDERING
                </span>
              </div>

              {/* View Mode Toggle: Real Widget vs Static Card & External Studio Link */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("widget")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      previewMode === "widget"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Live Widget (Mobile/Desktop)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("card")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      previewMode === "card"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Card Mockup
                  </button>
                </div>

                <a
                  href="/preview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 flex items-center gap-1 transition-all"
                  title="Open dedicated testing console in full window"
                >
                  <span>Open Full Studio</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            <div
              className={styles.previewCardBox}
              style={{
                padding: previewMode === "widget" ? "0" : undefined,
                background: previewMode === "widget" ? "#09090b" : undefined,
              }}
            >
              {previewMode === "widget" ? (
                <PreviewApp
                  embedded={true}
                  initialViewport="mobile"
                  initialFixtureIndex={1}
                />
              ) : (
                <SimulatedWidgetPreview
                  activeAudience={activeAudienceTab}
                  accentColor={selectedThemeColor}
                  industry={(user as any)?.industry || "tech"}
                  apisList={apisList}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Organization Identity & Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Identity Details */}
        <div className={styles.tableCard}>
          <div className={styles.profileHeroCard}>
            <div className={styles.avatarBox}>{companyInitials}</div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {user?.name || "Acme Corporation"}
              </h2>
              <p className="text-xs text-slate-400">
                {user?.email || "admin@company.com"}
              </p>
            </div>
          </div>

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Industry Category</span>
              <span className={styles.detailItemVal}>
                {(user as any)?.industry || "Technology & Software"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>
                Tenant Gateway Slug
              </span>
              <span className="font-mono text-xs font-bold text-indigo-400">
                {user?.id || "softtech-tenant"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Platform Plan</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {(user as any)?.plan || "Neural Pro"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>
                Tenant Account Status
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active &amp; Verified</span>
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Registration Date</span>
              <span className={styles.detailItemVal}>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Security & Access Protocols */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableCardTitle}>
              Security &amp; Protocol Settings
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl border border-slate-700/40 bg-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <LockIcon size={18} color="currentColor" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Enterprise Password &amp; Auth
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Protected with BCrypt salted hashing and session cookies
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckIcon size={14} color="currentColor" /> Active
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-700/40 bg-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldLockIcon size={18} color="currentColor" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Model Context Protocol Gatekeeper
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Per-tenant OpenAPI 3.1 strict schema isolation
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckIcon size={14} color="currentColor" /> Enabled
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-700/40 bg-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <KeyIcon size={18} color="currentColor" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    OAuth &amp; API Key Gateway
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Secures external provider requests via header injection
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-400">
                {
                  apisList.filter(
                    (a) => a.apiAuthType && a.apiAuthType !== "none",
                  ).length
                }{" "}
                Secured
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedMode) {
    return content;
  }

  return (
    <div className={styles.dashboardWrapper}>
      <main className={styles.mainContent} style={{ marginLeft: 0 }}>
        {content}
      </main>
    </div>
  );
};

export default Profile;
