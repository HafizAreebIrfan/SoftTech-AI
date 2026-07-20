import React, { FC, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore, useAuthStore, useSignupStore } from "../../../../hooks";
import { saveCompanyUiSelection } from "../../../../adapters/api/authApi";
import {
  LayoutGridIcon,
  TerminalIcon,
  SlidersIcon,
  DatabaseIcon,
  CheckIcon,
  LeftArrowIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { stepThreeSchema } from "../../../../infrastructure/validation/signupSchemas";
import styles from "../../../../styles/signup.module.css";

const SignupStep3: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const {
    companyId,
    selectedLayout,
    stepOneData,
    setSelectedLayout,
    clearSignupProgress,
  } = useSignupStore();
  const { setAuth } = useAuthStore();

  const { mutate: stepThreeMutate, isPending: isStepThreePending } =
    useMutation({
      mutationFn: ({
        id,
        uiPreference,
      }: {
        id: string;
        uiPreference: { layout: string };
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
    const result = stepThreeSchema.safeParse({ layout: selectedLayout });
    if (!result.success) {
      showToast(
        result.error.issues[0]?.message || "Invalid layout selection.",
        "error",
      );
      return;
    }
    stepThreeMutate({
      id: companyId,
      uiPreference: {
        layout: selectedLayout,
      },
    });
  };
  useEffect(() => {
    const industryLayoutMapping: Record<string, "grid" | "list" | "cards" | "table"> = {
      "e-commerce": "grid",
      ecommerce: "grid",
      fintech: "table",
      "data & forecasting": "grid",
      "data-forecasting": "grid",
      saas: "list",
      "saas / developer tools": "list",
      logistics: "list",
      healthtech: "grid",
      "food & hospitality": "grid",
      "travel & booking": "list",
      "ai & automation": "list",
      "general business": "grid",
    };
    const industry = stepOneData?.primaryIndustry?.toLowerCase() || "";
    // Recommend and auto-select the best layout
    const recommended = industryLayoutMapping[industry] || "grid";
    setSelectedLayout(recommended);
  }, [stepOneData?.primaryIndustry, setSelectedLayout]);

  return (
    <motion.div
      key="signup-step-3"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="mt-4 w-full mx-auto max-w-7xl text-left"
    >
      <div
        className={styles.signupcard}
        style={{
          background: colors.BackgroundSecondary,
          border: `1px solid ${colors.CardBorder}`,
          borderLeft: `4px solid ${colors.CardActiveBorder}`,
          boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left pane: selector choices */}
          <div className="lg:col-span-7 space-y-8">
            <div className="mb-4 text-left">
              <h2
                className="font-headline text-3xl font-extrabold mb-2"
                style={{ color: colors.TextHeading }}
              >
                UI Preferences
              </h2>
              <p
                className="text-base leading-relaxed max-w-xl"
                style={{ color: colors.TextBody }}
              >
                Define how your Digital Curator protocol visualizes data
                streams. This can be updated at any time from your platform
                settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Bento Grid layout */}
              <div
                onClick={() => setSelectedLayout("grid")}
                className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                style={
                  selectedLayout === "grid"
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                      }
                    : {
                        background: colors.Background,
                        border: `1px solid ${colors.CardBorder}`,
                      }
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    style={
                      selectedLayout === "grid"
                        ? { background: colors.UISelectionCardBackground }
                        : { background: colors.BackgroundSecondary }
                    }
                  >
                    <LayoutGridIcon size={20} color={colors.IconColor} />
                  </div>
                  {selectedLayout === "grid" && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: colors.BackgroundGradientTwo,
                        color: colors.TextHeading,
                      }}
                    >
                      <CheckIcon size={12} color={colors.IconColor} />
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className="font-headline font-bold text-sm mb-1"
                    style={{ color: colors.TextHeading }}
                  >
                    Grid
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: colors.TextBody }}
                  >
                    Modular bento-style layout optimized for data-rich
                    dashboards and visual assets.
                  </p>
                </div>
              </div>

              {/* Traditional List layout */}
              <div
                onClick={() => setSelectedLayout("list")}
                className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                style={
                  selectedLayout === "list"
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                      }
                    : {
                        background: colors.Background,
                        border: `1px solid ${colors.CardBorder}`,
                      }
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    style={
                      selectedLayout === "list"
                        ? { background: colors.UISelectionCardBackground }
                        : { background: colors.BackgroundSecondary }
                    }
                  >
                    <TerminalIcon size={20} color={colors.IconColor} />
                  </div>
                  {selectedLayout === "list" && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: colors.BackgroundGradientTwo,
                        color: colors.TextHeading,
                      }}
                    >
                      <CheckIcon size={12} color={colors.IconColor} />
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className="font-headline font-bold text-sm mb-1"
                    style={{ color: colors.TextHeading }}
                  >
                    List
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: colors.TextBody }}
                  >
                    Traditional linear flow for rapid scanning of documentation
                    and sequential logs.
                  </p>
                </div>
              </div>

              {/* Expandable Cards layout */}
              <div
                onClick={() => setSelectedLayout("cards")}
                className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                style={
                  selectedLayout === "cards"
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                      }
                    : {
                        background: colors.Background,
                        border: `1px solid ${colors.CardBorder}`,
                      }
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    style={
                      selectedLayout === "cards"
                        ? { background: colors.UISelectionCardBackground }
                        : { background: colors.BackgroundSecondary }
                    }
                  >
                    <SlidersIcon size={20} color={colors.IconColor} />
                  </div>
                  {selectedLayout === "cards" && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ background: colors.BackgroundGradientTwo }}
                    >
                      <CheckIcon size={12} color={colors.IconColor} />
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className="font-headline font-bold text-sm mb-1"
                    style={{ color: colors.TextHeading }}
                  >
                    Cards
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: colors.TextBody }}
                  >
                    Expanded view highlighting metadata and high-level summaries
                    for each entry.
                  </p>
                </div>
              </div>

              {/* Condensed Spreadsheet Table layout */}
              <div
                onClick={() => setSelectedLayout("table")}
                className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                style={
                  selectedLayout === "table"
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                      }
                    : {
                        background: colors.Background,
                        border: `1px solid ${colors.CardBorder}`,
                      }
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    style={
                      selectedLayout === "table"
                        ? { background: colors.UISelectionCardBackground }
                        : { background: colors.BackgroundSecondary }
                    }
                  >
                    <DatabaseIcon size={20} color={colors.IconColor} />
                  </div>
                  {selectedLayout === "table" && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ background: colors.BackgroundGradientTwo }}
                    >
                      <CheckIcon size={12} color={colors.IconColor} />
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className="font-headline font-bold text-sm mb-1"
                    style={{ color: colors.TextHeading }}
                  >
                    Table
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: colors.TextBody }}
                  >
                    Condensed spreadsheet-style view for power users handling
                    massive data sets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right pane: visual preview stream alignment */}
          <div className="lg:col-span-5 sticky top-12">
            <div
              className={`backdrop-blur-xl ${styles.rightpaneview}`}
              style={{
                background: colors.Background,
                borderColor: colors.Border,
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <h4
                  className="font-label text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: colors.TextBody }}
                >
                  ChatGPT Widget Preview
                </h4>
                <div className="flex gap-1.5 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8a95ff]/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#9699ff]/40"></div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <div className="mt-4 space-y-6">
                  {selectedLayout === "grid" && (
                    <motion.div
                      key="pref-grid"
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -15 }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 14,
                      }}
                      className="space-y-4"
                    >
                      <div
                        className="h-10 w-full rounded-xl flex items-center px-4"
                        style={{ background: colors.BackgroundSecondary }}
                      >
                        <div
                          className="w-4 h-4 rounded-full me-3 animate-pulse"
                          style={{
                            background: colors.UISelectionCardBackground,
                          }}
                        ></div>
                        <div
                          className="h-2 w-32 rounded"
                          style={{
                            background: colors.UISelectionCardBackground,
                          }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {[
                          {
                            delay: 0.05,
                            h: "aspect-square",
                            gradient: "from-indigo-500/20 to-purple-500/5",
                          },
                          {
                            delay: 0.1,
                            h: "aspect-square",
                            gradient: "from-purple-500/20 to-violet-500/5",
                          },
                          {
                            delay: 0.15,
                            h: "aspect-square",
                            gradient: "from-violet-500/20 to-pink-500/5",
                          },
                          {
                            delay: 0.2,
                            h: "aspect-square",
                            gradient: "from-indigo-500/20 to-indigo-600/5",
                          },
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              delay: item.delay,
                              type: "spring",
                              stiffness: 100,
                            }}
                            whileHover={{ scale: 1.04 }}
                            className={`p-3 bg-[#1c1c28] rounded-xl flex flex-col justify-end gap-2 bg-gradient-to-br ${item.gradient} ${item.h}`}
                          >
                            <motion.div
                              animate={{ width: ["40%", "70%", "40%"] }}
                              transition={{
                                repeat: Infinity,
                                duration: 2.5,
                                delay: idx * 0.2,
                              }}
                              className="h-2 w-3/4 bg-indigo-400/50 rounded"
                            />
                            <div className="h-1.5 w-1/2 bg-slate-600/40 rounded"></div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {selectedLayout === "list" && (
                    <motion.div
                      key="pref-list"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 14,
                      }}
                      className="space-y-3"
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, type: "spring" }}
                          whileHover={{
                            x: 6,
                            backgroundColor: "rgba(99, 102, 241, 0.06)",
                          }}
                          className="mb-3 p-3 rounded-xl flex justify-between items-center"
                          style={{ background: colors.BackgroundSecondary }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.span
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{
                                repeat: Infinity,
                                duration: 2,
                                delay: i * 0.25,
                              }}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: colors.BackgroundGradientOne,
                              }}
                            />
                            <div
                              className="h-2 w-28 rounded"
                              style={{
                                background: colors.UISelectionCardBackground,
                              }}
                            ></div>
                          </div>
                          <div
                            className="h-2 w-10 rounded"
                            style={{ background: colors.OverlayShadow }}
                          ></div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {selectedLayout === "cards" && (
                    <motion.div
                      key="pref-cards"
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -15 }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 14,
                      }}
                      className="space-y-4"
                    >
                      <motion.div
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 rounded-xl text-left space-y-3 shadow-lg shadow-indigo-500/5"
                        style={{ background: colors.BackgroundSecondary }}
                      >
                        <div className="flex justify-between items-center">
                          <div
                            className="h-3 w-32 rounded animate-pulse"
                            style={{
                              background: colors.UISelectionCardBackground,
                            }}
                          ></div>
                          <div
                            className="h-2 w-12 rounded"
                            style={{ background: colors.OverlayShadow }}
                          ></div>
                        </div>
                        <div
                          className="h-2 w-full rounded my-2"
                          style={{
                            background: colors.UISelectionCardBackground,
                          }}
                        ></div>
                        <div
                          className="h-2 w-5/6 rounded"
                          style={{
                            background: colors.UISelectionCardBackground,
                          }}
                        ></div>
                      </motion.div>

                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 0.55 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="mt-4 p-4 rounded-xl text-left space-y-3 opacity-60"
                        style={{ background: colors.BackgroundSecondary }}
                      >
                        <div className="flex justify-between items-center">
                          <div
                            className="h-3 w-28 rounded animate-pulse"
                            style={{
                              background: colors.UISelectionCardBackground,
                            }}
                          ></div>
                          <div
                            className="h-2 w-12 rounded"
                            style={{ background: colors.OverlayShadow }}
                          ></div>
                        </div>
                        <div
                          className="h-2 w-full my-2 rounded"
                          style={{
                            background: colors.UISelectionCardBackground,
                          }}
                        ></div>
                        <div
                          className="h-2 w-full my-2 rounded"
                          style={{
                            background: colors.UISelectionCardBackground,
                          }}
                        ></div>
                      </motion.div>
                    </motion.div>
                  )}

                  {selectedLayout === "table" && (
                    <motion.div
                      key="pref-table"
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="p-3 space-y-3"
                      style={{ background: colors.BackgroundSecondary }}
                    >
                      <div className="flex justify-between items-center pb-2 text-[10px] text-slate-500 uppercase font-mono">
                        <span style={{ color: colors.TextHeading }}>ID</span>
                        <span style={{ color: colors.TextHeading }}>
                          Endpoint
                        </span>
                        <span style={{ color: colors.TextHeading }}>
                          Payload
                        </span>
                      </div>
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex justify-between items-center text-xs pb-1 border-b border-white/5"
                        >
                          <div
                            className="h-1.5 w-16 rounded my-2"
                            style={{ background: colors.OverlayShadow }}
                          ></div>
                          <div
                            className="h-1.5 w-16 rounded"
                            style={{ background: colors.OverlayShadow }}
                          ></div>
                          <div
                            className="h-1.5 w-26 rounded"
                            style={{
                              background: colors.UISelectionCardBackground,
                            }}
                          ></div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION BAR FOR STEP 3 */}
        <div
          className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 pt-3"
          style={{ borderTop: `1px solid ${colors.Border}` }}
        >
          <button
            onClick={() => navigate({ to: "/signup/step2" })}
            className="w-full sm:w-auto px-6 py-3 font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LeftArrowIcon size={16} color={colors.IconColor} /> Back
          </button>

          <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-center">
            <span
              className="text-xs text-slate-500 font-semibold uppercase"
              style={{ color: colors.TextBody }}
            >
              Step 3 of 3
            </span>
            <button
              onClick={handleStepThreeSubmit}
              className={`w-full sm:w-auto items-center justify-center gap-2 group cursor-pointer ${styles.btn}`}
              style={{
                background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                opacity: isStepThreePending ? 0.7 : 1,
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
