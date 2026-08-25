import React, { FC, useEffect, useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore, useAuthStore, useSignupStore } from "../../../../hooks";
import { saveCompanyUiSelection } from "../../../../adapters/api/authApi";
import {
  CheckIcon,
  LeftArrowIcon,
  SlidersIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { SimulatedWidgetPreview } from "../../../components/common/SimulatedWidgetPreview";
import styles from "../../../../styles/signup.module.css";

const SignupStep3: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const {
    companyId,
    selectedLayout,
    selectedThemeColor = colors.SwatchIndigo,
    selectedAudienceDefault = "customer",
    apisList = [],
    stepOneData,
    setSelectedThemeColor,
    setSelectedAudienceDefault,
    clearSignupProgress,
  } = useSignupStore();
  const { setAuth, isAuthenticated } = useAuthStore();

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
    if (!companyId && !isAuthenticated) {
      showToast("Please complete Step 1 first.", "warning");
      navigate({ to: "/signup/step1" });
    }
  }, [companyId, isAuthenticated, navigate]);

  const { mutate: stepThreeMutate, isPending: isStepThreePending } =
    useMutation({
      mutationFn: ({
        id,
        uiPreference,
      }: {
        id: string;
        uiPreference: {
          layout: string;
          themeColor?: string;
          audienceDefault?: string;
        };
      }) => saveCompanyUiSelection(id, uiPreference),
      onSuccess: (res) => {
        if (res && res.success && res.data) {
          const user = {
            id: res.data._id,
            name: res.data.companyName,
            email: res.data.email,
          };
          setAuth(user);
          clearSignupProgress();
          showToast(
            "Registration completed successfully! Welcome aboard.",
            "success",
          );
          navigate({ to: "/dashboard" });
        } else {
          showToast(res?.message || "Failed to save UI details.", "error");
        }
      },
      onError: (err: any) => {
        showToast(err.message || "An error occurred during Step 3.", "error");
      },
    });

  const handleStepThreeSubmit = () => {
    if (!companyId) {
      showToast("Company ID is missing. Please restart signup.", "error");
      navigate({ to: "/signup/step1" });
      return;
    }

    stepThreeMutate({
      id: companyId,
      uiPreference: {
        layout: selectedLayout || "auto",
        themeColor: selectedThemeColor || "#6366f1",
        audienceDefault:
          selectedAudienceDefault || calculatedAudienceDefault || "customer",
      },
    });
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
      <div
        className={styles.signupcard}
        style={{
          background: colors.Headerbackground,
          border: `1px solid ${colors.CardBorder}`,
          borderRadius: "16px",
          boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
        }}
      >
        <div className={styles.step3Grid}>
          {/* Left Pane (~30%): Theme Swatches & Brand Styling */}
          <div className={styles.step3LeftPane}>
            <div>
              <h2
                className={styles.step3Title}
                style={{ color: colors.TextHeading }}
              >
                Brand Theme & Styling
              </h2>
              <p
                className={styles.step3Desc}
                style={{ color: colors.TextBody }}
              >
                Choose your primary brand accent color. SoftTech AI's MCP engine
                dynamically themes your ChatGPT widgets to match your brand
                identity.
              </p>
            </div>

            {/* Color Swatches Grid */}
            <div>
              <label
                className={styles.step3Label}
                style={{ color: colors.TextSecondary }}
              >
                Brand Color Palette
              </label>
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
              <label
                className={styles.step3Label}
                style={{ color: colors.TextSecondary }}
              >
                Custom HEX Accent Color
              </label>
              <div
                className={styles.hexInputRow}
                style={{
                  background: colors.Headerbackground,
                  border: `1px solid ${colors.CardBorderSecondary}`,
                  boxShadow: `0 10px 40px ${colors.OverlayShadow}`,
                }}
              >
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
                  style={{ color: colors.TextHeading }}
                />
              </div>
            </div>

            {/* AI Auto-Prediction Summary Card */}
            <div
              className={styles.aiSummaryCard}
              style={{
                background: colors.Headerbackground,
                border: `1px solid ${colors.CardBorderSecondary}`,
                boxShadow: `0 10px 40px ${colors.OverlayShadow}`,
              }}
            >
              <div className={styles.aiSummaryHeader}>
                <SlidersIcon size={14} color={colors.BrandIndigo} />
                <span
                  className={styles.aiSummaryTitle}
                  style={{ color: colors.TextHeading }}
                >
                  AI Layout Prediction Active
                </span>
              </div>
              <p
                className={styles.aiSummaryText}
                style={{ color: colors.TextBody }}
              >
                SoftTech AI automatically formats your {apisList.length || 1}{" "}
                API(s) into responsive multi-block views (Metrics + Cards + Data
                Tables) dynamically per chat query.
              </p>
            </div>
          </div>

          {/* Right Pane (~70%): Interactive Live Widget Preview */}
          <div className={styles.step3RightPane}>
            {/* Audience Tabs (Rendered ONLY if hasAudienceTabs is true) */}
            {hasAudienceTabs && (
              <div
                className={styles.audienceTabsContainer}
                style={{
                  background: colors.Background,
                  border: `1px solid ${colors.CardBorder}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleAudienceChange("customer")}
                  className={styles.audienceTabBtn}
                  style={{
                    background:
                      activeAudienceTab === "customer"
                        ? selectedThemeColor
                        : "transparent",
                    color:
                      activeAudienceTab === "customer"
                        ? colors.TextOverlay
                        : colors.TextBody,
                    boxShadow:
                      activeAudienceTab === "customer"
                        ? `0 4px 12px ${colors.OverlayShadow}`
                        : "none",
                  }}
                >
                  Customer View
                </button>
                <button
                  type="button"
                  onClick={() => handleAudienceChange("admin")}
                  className={styles.audienceTabBtn}
                  style={{
                    background:
                      activeAudienceTab === "admin"
                        ? selectedThemeColor
                        : "transparent",
                    color:
                      activeAudienceTab === "admin"
                        ? colors.TextOverlay
                        : colors.TextBody,
                    boxShadow:
                      activeAudienceTab === "admin"
                        ? `0 4px 12px ${colors.OverlayShadow}`
                        : "none",
                  }}
                >
                  Admin View
                </button>
              </div>
            )}

            {/* Real Simulated Live Widget Component */}
            <SimulatedWidgetPreview
              activeAudience={activeAudienceTab}
              accentColor={selectedThemeColor}
              industry={stepOneData?.primaryIndustry}
              apisList={apisList}
            />
          </div>
        </div>

        {/* FOOTER ACTION BAR FOR STEP 3 */}
        <div
          className={styles.step3Footer}
          style={{ borderTop: `1px solid ${colors.Border}` }}
        >
          <button
            onClick={() => navigate({ to: "/signup/step2" })}
            className={styles.step3BackBtn}
            style={{ color: colors.TextBody }}
          >
            <LeftArrowIcon size={16} color={colors.IconColor} /> Back
          </button>

          <div className={styles.step3RightFooter}>
            <span
              className={styles.step3Indicator}
              style={{ color: colors.TextBody }}
            >
              Step 3 of 3
            </span>
            <button
              onClick={handleStepThreeSubmit}
              className={`${styles.btn}`}
              style={{
                background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                opacity: isStepThreePending ? 0.7 : 1,
                color: colors.TextOverlay,
              }}
              disabled={isStepThreePending}
            >
              {isStepThreePending ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupStep3;
