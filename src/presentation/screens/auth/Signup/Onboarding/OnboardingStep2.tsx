import React, { FC, useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  useThemeStore,
  useAuthStore,
  useSignupStore,
} from "../../../../../hooks";
import {
  CheckIcon,
  LeftArrowIcon,
  SlidersIcon,
} from "../../../../../assets/icons";
import { showToast } from "../../../../../utils/toast";
import { SimulatedWidgetPreview } from "../../../../components/common/SimulatedWidgetPreview";
import styles from "../../../../../styles/signup.module.css";

const OnboardingStep2: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const {
    companyId,
    selectedThemeColor = colors.SwatchIndigo,
    selectedAudienceDefault = "customer",
    apisList = [],
    stepOneData,
    setSelectedThemeColor,
    setSelectedAudienceDefault,
    updateApiField,
    clearSignupProgress,
    signupOnboardingStep,
  } = useSignupStore();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const effectiveCompanyId = companyId || user?.id;
  const isStep1Done =
    Boolean(effectiveCompanyId) &&
    (signupOnboardingStep >= 2 ||
      (typeof user?.signupOnboardingStep === "number" &&
        user.signupOnboardingStep >= 2) ||
      (apisList &&
        apisList.length > 0 &&
        apisList.some(
          (a) =>
            a.apiName?.trim() &&
            a.apiEndpoint?.trim() &&
            a.apiEndpoint !== "https://",
        )));

  const PRESET_COLOR_SWATCHES = useMemo(
    () => [
      { name: "Indigo Neon", hex: colors.SwatchIndigo },
      { name: "Emerald Mint", hex: colors.SwatchEmerald },
      { name: "Crimson Coral", hex: colors.SwatchCrimson },
      { name: "Ocean Blue", hex: colors.SwatchOcean },
      { name: "Cyber Violet", hex: colors.SwatchViolet },
      { name: "Sunset Amber", hex: colors.SwatchAmber },
      { name: "Slate Stealth", hex: colors.SwatchSlate },
    ],
    [colors],
  );

  // Audience Tab Visibility Intelligence
  const { hasAudienceTabs, calculatedAudienceDefault } = useMemo(() => {
    if (!apisList || apisList.length === 0) {
      return {
        hasAudienceTabs: false,
        calculatedAudienceDefault: "customer" as const,
      };
    }

    const hasAdmin = apisList.some((api) => api.audience === "admin");
    const hasCustomer = apisList.some(
      (api) => api.audience === "customer" || !api.audience,
    );

    if (hasAdmin && hasCustomer) {
      return {
        hasAudienceTabs: true,
        calculatedAudienceDefault: "customer" as const,
      };
    }

    if (hasAdmin && !hasCustomer) {
      return {
        hasAudienceTabs: false,
        calculatedAudienceDefault: "admin" as const,
      };
    }

    return {
      hasAudienceTabs: false,
      calculatedAudienceDefault: "customer" as const,
    };
  }, [apisList]);

  const [activeAudienceTab, setActiveAudienceTab] = useState<
    "customer" | "admin"
  >(selectedAudienceDefault === "admin" ? "admin" : "customer");

  useEffect(() => {
    if (setSelectedAudienceDefault) {
      setSelectedAudienceDefault(calculatedAudienceDefault);
    }
  }, [calculatedAudienceDefault, setSelectedAudienceDefault]);

  const handleAudienceChange = (tab: "customer" | "admin") => {
    setActiveAudienceTab(tab);
    if (setSelectedAudienceDefault) {
      setSelectedAudienceDefault(tab);
    }
  };

  useEffect(() => {
    if (!effectiveCompanyId && !isAuthenticated) {
      showToast("Please complete Signup first.", "warning");
      navigate({ to: "/signup/company", replace: true });
      return;
    }

    if (!isStep1Done) {
      showToast("Please complete Onboarding Step 1 first.", "warning");
      navigate({ to: "/signup/onboarding-step1", replace: true });
    }
  }, [effectiveCompanyId, isAuthenticated, isStep1Done, navigate]);

  const handleStepThreeSubmit = () => {
    if (!companyId) {
      showToast(
        "Looks like you are not registered. Please register first.",
        "error",
      );
      navigate({ to: "/signup/company" });
      return;
    }

    navigate({ to: "/signup/onboarding-success" });
  };

  const handleColorChange = (hex: string) => {
    if (setSelectedThemeColor) {
      setSelectedThemeColor(hex);
    }
  };

  return (
    <motion.div
      key="signup-step-3"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={styles.step3Wrapper}
    >
      <div className={styles.signupcard}>
        <div className={styles.step3Grid}>
          {/* Left Pane (~30%): Theme Swatches & Brand Styling */}
          <div className={styles.step3LeftPane}>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Onboarding Step 2 of 2
                </span>
              </div>
              <h2 className={styles.step3Title}>Brand Theme & Styling</h2>
              <p className={styles.step3Desc}>
                Choose your primary brand accent color. SoftTech AI's MCP engine
                dynamically themes your ChatGPT widgets to match your brand
                identity.
              </p>
            </div>

            {/* Color Swatches Grid */}
            <div>
              <label className={styles.step3Label}>Brand Color Palette</label>
              <div className={styles.swatchGrid}>
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
                      className={styles.swatchBtn}
                      style={{
                        backgroundColor: swatch.hex,
                        boxShadow: isSelected
                          ? `0 0 0 2px ${colors.Headerbackground}, 0 0 0 4px ${swatch.hex}`
                          : "none",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {isSelected && (
                        <CheckIcon size={14} color={colors.TextOverlay} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Color Picker Input */}
            <div>
              <label className={styles.step3Label}>
                Custom HEX Accent Color
              </label>
              <div className={styles.hexInputRow}>
                <input
                  type="color"
                  value={selectedThemeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className={styles.hexColorInput}
                />
                <input
                  type="text"
                  value={selectedThemeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder={colors.SwatchIndigo}
                  className={styles.hexTextInput}
                />
              </div>
            </div>
          </div>

          {/* Right Pane (~60%): Interactive Live Widget Preview */}
          <div className={styles.step3RightPane}>
            {hasAudienceTabs && (
              <div className={styles.audienceTabsContainer}>
                <button
                  type="button"
                  onClick={() => handleAudienceChange("customer")}
                  className={`${styles.audienceTabBtn} ${
                    activeAudienceTab === "customer"
                      ? styles.audienceTabBtnActive
                      : ""
                  }`}
                >
                  Customer View
                </button>
                <button
                  type="button"
                  onClick={() => handleAudienceChange("admin")}
                  className={`${styles.audienceTabBtn} ${
                    activeAudienceTab === "admin"
                      ? styles.audienceTabBtnActive
                      : ""
                  }`}
                >
                  Admin View
                </button>
              </div>
            )}

            <SimulatedWidgetPreview
              activeAudience={activeAudienceTab}
              accentColor={selectedThemeColor}
              industry={stepOneData?.primaryIndustry}
              apisList={apisList}
            />
          </div>
        </div>

        {apisList.length > 0 && (
          <div className={styles.apiConfigSection}>
            <div className={styles.apiConfigHeader}>
              <div className={styles.apiConfigTitleCol}>
                <h3 className={styles.apiConfigHeading}>MCP Tools & Widgets</h3>
                <p className={styles.apiConfigSubheading}>
                  Manage per-tool ChatGPT interactive widget UI and Map View
                  toggles.
                </p>
              </div>
            </div>

            <div className={styles.apiConfigList}>
              {apisList.map((api, idx) => {
                const isWidgetOn = api.isWidgetEnabled !== false;
                const isMapOn = Boolean(api.isMapViewEnabled);

                return (
                  <div key={api.id || idx} className={styles.apiConfigRow}>
                    {/* Left: Method + Name + Endpoint */}
                    <div className={styles.apiConfigRowLeft}>
                      <span
                        className={
                          api.apiMethod === "POST"
                            ? styles.methodBadgePost
                            : api.apiMethod === "PUT"
                              ? styles.methodBadgePut
                              : api.apiMethod === "DELETE"
                                ? styles.methodBadgeDelete
                                : styles.methodBadgeGet
                        }
                      >
                        {api.apiMethod || "GET"}
                      </span>
                      <div className={styles.apiConfigInfo}>
                        <span
                          className={styles.apiConfigName}
                          title={api.apiName || `API Endpoint #${idx + 1}`}
                        >
                          {api.apiName || `API Endpoint #${idx + 1}`}
                        </span>
                        <span
                          className={styles.apiConfigEndpoint}
                          title={api.apiEndpoint}
                        >
                          {api.apiEndpoint}
                        </span>
                      </div>
                    </div>

                    {/* Right: Inline Toggles */}
                    <div className={styles.apiConfigRowRight}>
                      {/* Widget Toggle */}
                      <div className={styles.toggleGroup}>
                        <span
                          className={`${styles.toggleLabel} ${
                            isWidgetOn ? styles.toggleLabelActive : ""
                          }`}
                        >
                          Widget
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isWidgetOn}
                          title={
                            isWidgetOn
                              ? "Disable Widget UI"
                              : "Enable Widget UI"
                          }
                          onClick={() => {
                            const nextVal = !isWidgetOn;
                            updateApiField(api.id, "isWidgetEnabled", nextVal);
                            if (!nextVal) {
                              updateApiField(api.id, "isMapViewEnabled", false);
                            }
                          }}
                          className={`${styles.toggleSwitch} ${
                            isWidgetOn ? styles.toggleSwitchActive : ""
                          }`}
                        >
                          <span className={styles.toggleThumb} />
                        </button>
                      </div>

                      {/* Map Toggle */}
                      <div className={styles.toggleGroup}>
                        <span
                          className={`${styles.toggleLabel} ${
                            isWidgetOn && isMapOn
                              ? styles.toggleLabelActive
                              : ""
                          }`}
                        >
                          Map
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isMapOn}
                          disabled={!isWidgetOn}
                          title={
                            !isWidgetOn
                              ? "Enable Widget UI first to activate Map View"
                              : isMapOn
                                ? "Disable Map View"
                                : "Enable Map View"
                          }
                          onClick={() => {
                            if (isWidgetOn) {
                              updateApiField(
                                api.id,
                                "isMapViewEnabled",
                                !isMapOn,
                              );
                            }
                          }}
                          className={`${styles.toggleSwitch} ${
                            isMapOn && isWidgetOn
                              ? styles.toggleSwitchActive
                              : ""
                          }`}
                        >
                          <span className={styles.toggleThumb} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.step3Footer}>
          <button
            onClick={() => navigate({ to: "/signup/onboarding-step1" })}
            className={styles.step3BackBtn}
          >
            <LeftArrowIcon size={16} color="currentColor" /> Back to Onboarding
            Step 1
          </button>

          <div className={styles.step3RightFooter}>
            <span className={styles.step3Indicator}>
              Onboarding Step 2 of 2
            </span>
            <button onClick={handleStepThreeSubmit} className={styles.btn}>
              Finalize & Provision AI →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingStep2;
