import React, { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore, useSignupStore } from "../../../../hooks";
import { registerCompanyInfo } from "../../../../adapters/api/authApi";
import {
  LeftArrowIcon,
  EmailIcon,
  LockIcon,
  UserIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toasts";
import { stepOneSchema } from "../../../../infrastructure/validation/signupSchemas";
import styles from "../../../../styles/signup.module.css";
import z from "zod";
import { IndustryOptions } from "../../../../types/industryoptions";

const SignupStep1: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { setCompanyId, stepOneData, setStepOneData } = useSignupStore();

  const { mutate: stepOneMutate, isPending: isStepOnePending } = useMutation({
    mutationFn: registerCompanyInfo,
    onSuccess: (res) => {
      if (res && res.success && res.data) {
        setCompanyId(res.data._id);
        showToast("Company information saved successfully!", "success");
        navigate({ to: "/signup/step2" });
      } else {
        showToast(
          res?.message || "Failed to save company information.",
          "error",
        );
      }
    },
    onError: (err: any) => {
      showToast(err.message || "An error occurred during Step 1.", "error");
    },
  });

  const signupForm = useForm({
    defaultValues: {
      companyName: stepOneData.companyName || "",
      adminEmail: stepOneData.adminEmail || "",
      password: stepOneData.password || "",
      mcpSlug: stepOneData.subdomain || "",
      primaryIndustry: stepOneData.primaryIndustry || "saas",
    },
    onSubmit: async ({ value }) => {
      const parsed = stepOneSchema.safeParse(value);
      if (!parsed.success) {
        showToast("Please correct the errors in the form.", "error");
        return;
      }
      stepOneMutate({
        companyName: value.companyName,
        email: value.adminEmail,
        password: value.password,
        industry: value.primaryIndustry,
        mcpSlug: value.mcpSlug,
      });
    },
  });

  const handleStepOneSubmit = () => {
    signupForm.handleSubmit();
  };

  return (
    <motion.div
      key="signup-step-1"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="mt-4 w-full max-w-4xl text-left space-y-8 mx-auto"
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
        <div className="space-y-2">
          <h2
            className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-2"
            style={{ color: colors.TextHeading }}
          >
            Company Information
          </h2>
          <p
            className="font-medium text-lg leading-relaxed max-w-2xl"
            style={{ color: colors.TextBody }}
          >
            Initialize your interstellar workspace identity. Connect your brand
            to the protocol.
          </p>
        </div>

        <div className={`relative p-8 md:p-12 backdrop-blur-xl`}>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleStepOneSubmit();
            }}
          >
            <div className={`${styles.formField} md:col-span-2`}>
              <div className="flex flex-col gap-2">
                <label
                  className="font-label text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: colors.TextBody }}
                >
                  Legal Company Name
                </label>
                <signupForm.Field
                  name="companyName"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .string()
                        .min(2, "Company Name must be at least 2 characters")
                        .safeParse(value);
                      return res.success
                        ? undefined
                        : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="relative">
                      <span className="absolute left-4 top-4.5 flex items-center">
                        <UserIcon color={colors.IconColor} size={18} />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Nexus Corp"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const name = e.target.value;
                          field.handleChange(name);
                          const lowerName = name.toLowerCase();
                          let recommendedInd = "";
                          if (
                            lowerName.includes("travel") ||
                            lowerName.includes("booking") ||
                            lowerName.includes("flight") ||
                            lowerName.includes("trip") ||
                            lowerName.includes("tour") ||
                            lowerName.includes("hotel") ||
                            lowerName.includes("resort") ||
                            lowerName.includes("vacation") ||
                            lowerName.includes("cab") ||
                            lowerName.includes("car") ||
                            lowerName.includes("detailing") ||
                            lowerName.includes("shining car") ||
                            lowerName.includes("ride") ||
                            lowerName.includes("cleaning") ||
                            lowerName.includes("car care")
                          ) {
                            recommendedInd = "Travel & Booking";
                          } else if (
                            lowerName.includes("shop") ||
                            lowerName.includes("ecommerce") ||
                            lowerName.includes("store") ||
                            lowerName.includes("retail") ||
                            lowerName.includes("market") ||
                            lowerName.includes("cart") ||
                            lowerName.includes("sell") ||
                            lowerName.includes("buy") ||
                            lowerName.includes("deal") ||
                            lowerName.includes("boutique") ||
                            lowerName.includes("brand")
                          ) {
                            recommendedInd = "ecommerce";
                          } else if (
                            lowerName.includes("pay") ||
                            lowerName.includes("bank") ||
                            lowerName.includes("fintech") ||
                            lowerName.includes("finance") ||
                            lowerName.includes("capital") ||
                            lowerName.includes("crypto") ||
                            lowerName.includes("coin") ||
                            lowerName.includes("card") ||
                            lowerName.includes("wallet") ||
                            lowerName.includes("ledger") ||
                            lowerName.includes("bill")
                          ) {
                            recommendedInd = "fintech";
                          } else if (
                            lowerName.includes("logistics") ||
                            lowerName.includes("delivery") ||
                            lowerName.includes("shipping") ||
                            lowerName.includes("cargo") ||
                            lowerName.includes("freight") ||
                            lowerName.includes("transport") ||
                            lowerName.includes("ride") ||
                            lowerName.includes("taxi") ||
                            lowerName.includes("fleet") ||
                            lowerName.includes("courier")
                          ) {
                            recommendedInd = "logistics";
                          } else if (
                            lowerName.includes("saas") ||
                            lowerName.includes("software") ||
                            lowerName.includes("api") ||
                            lowerName.includes("cloud") ||
                            lowerName.includes("dev") ||
                            lowerName.includes("tech") ||
                            lowerName.includes("platform") ||
                            lowerName.includes("app")
                          ) {
                            recommendedInd = "saas";
                          } else if (
                            lowerName.includes("food") ||
                            lowerName.includes("restaurant") ||
                            lowerName.includes("cafe") ||
                            lowerName.includes("dine") ||
                            lowerName.includes("kitchen") ||
                            lowerName.includes("meal") ||
                            lowerName.includes("pizza") ||
                            lowerName.includes("burger") ||
                            lowerName.includes("coffee") ||
                            lowerName.includes("bar")
                          ) {
                            recommendedInd = "Food & Hospitality";
                          } else if (
                            lowerName.includes("forecast") ||
                            lowerName.includes("weather") ||
                            lowerName.includes("predict") ||
                            lowerName.includes("data") ||
                            lowerName.includes("analytics") ||
                            lowerName.includes("metric") ||
                            lowerName.includes("measure") ||
                            lowerName.includes("sensor")
                          ) {
                            recommendedInd = "Data & Forecasting";
                          } else if (
                            lowerName.includes("productivity") ||
                            lowerName.includes("creative") ||
                            lowerName.includes("design") ||
                            lowerName.includes("tool") ||
                            lowerName.includes("app")
                          ) {
                            recommendedInd = "Productivity & Creative Tools";
                          } else if (
                            lowerName.includes("utilities") ||
                            lowerName.includes("file") ||
                            lowerName.includes("convert") ||
                            lowerName.includes("pdf") ||
                            lowerName.includes("word")
                          ) {
                            recommendedInd = "Utilities & File Conversion";
                          } else if (
                            lowerName.includes("general") ||
                            lowerName.includes("business") ||
                            lowerName.includes("company") ||
                            lowerName.includes("admin")
                          ) {
                            recommendedInd = "General Business";
                          }

                          if (recommendedInd) {
                            signupForm.setFieldValue(
                              "primaryIndustry",
                              recommendedInd,
                            );
                            setStepOneData({
                              companyName: name,
                              primaryIndustry: recommendedInd,
                            });
                          } else {
                            setStepOneData({ companyName: name });
                          }
                        }}
                        className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                        style={{
                          background: colors.Background,
                          borderColor:
                            field.state.meta.errors?.length > 0
                              ? colors.Bordererror
                              : colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      />
                      {field.state.meta.errors?.length > 0 && (
                        <span
                          className={`text-[11px] mt-1 block font-semibold`}
                          style={{ color: colors.WarningText }}
                        >
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <div className="flex flex-col gap-2">
                <label
                  className="font-label text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: colors.TextBody }}
                >
                  Admin Email Address
                </label>
                <signupForm.Field
                  name="adminEmail"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .string()
                        .min(1, "Email is required")
                        .email("Invalid email address")
                        .safeParse(value);
                      return res.success
                        ? undefined
                        : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="relative">
                      <span className="absolute left-4 top-4.5 flex items-center">
                        <EmailIcon color={colors.IconColor} size={18} />
                      </span>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          setStepOneData({ adminEmail: e.target.value });
                        }}
                        className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label `}
                        style={{
                          background: colors.Background,
                          borderColor:
                            field.state.meta.errors?.length > 0
                              ? colors.Bordererror
                              : colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      />
                      {field.state.meta.errors?.length > 0 && (
                        <span className="text-[11px] text-red-500 mt-1 block font-semibold">
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <div className="flex flex-col gap-2">
                <label
                  className="font-label text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: colors.TextBody }}
                >
                  System Password
                </label>
                <signupForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .string()
                        .min(6, "Password must be at least 6 characters")
                        .safeParse(value);
                      return res.success
                        ? undefined
                        : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="relative">
                      <span className="absolute left-4 top-4.5">
                        <LockIcon size={18} color={colors.IconColor} />
                      </span>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          setStepOneData({ password: e.target.value });
                        }}
                        className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                        style={{
                          background: colors.Background,
                          borderColor:
                            field.state.meta.errors?.length > 0
                              ? colors.Bordererror
                              : colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      />
                      {field.state.meta.errors?.length > 0 && (
                        <span className="text-[11px] text-red-500 mt-1 block font-semibold">
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <div className="flex flex-col gap-2">
                <label
                  className="font-label text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: colors.TextBody }}
                >
                  Workspace Subdomain
                </label>
                <signupForm.Field
                  name="mcpSlug"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .string()
                        .min(2, "Subdomain must be at least 2 characters")
                        .regex(
                          /^[a-zA-Z0-9-]+$/,
                          "Only letters, numbers, and hyphens",
                        )
                        .safeParse(value);
                      return res.success
                        ? undefined
                        : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="flex flex-col w-full">
                      <div className="flex w-full">
                        <div className="relative grow">
                          <span className="absolute left-4 top-4.5">
                            <LockIcon size={18} color={colors.IconColor} />
                          </span>
                          <input
                            type="text"
                            placeholder="nexus"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              setStepOneData({ subdomain: e.target.value });
                            }}
                            className={`block w-full pl-12 pr-4 py-3 rounded-l-xl outline-none transition-all text-sm font-label `}
                            style={{
                              background: colors.Background,
                              borderColor:
                                field.state.meta.errors?.length > 0
                                  ? colors.Bordererror
                                  : colors.CardBorder,
                              color: colors.TextBody,
                            }}
                          />
                        </div>
                        <div
                          className={`px-4 flex items-center rounded-r-xl border-l border-white/5 text-slate-400 font-label text-xs tracking-wider`}
                          style={{
                            background: colors.Background,
                            opacity: 0.7,
                            border: `1px solid ${colors.CardBorder}`,
                            color: colors.TextBody,
                          }}
                        >
                          .softtechai.com
                        </div>
                      </div>
                      {field.state.meta.errors?.length > 0 && (
                        <span className="text-[11px] text-red-500 mt-1 block font-semibold w-full text-left">
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <div className="flex flex-col gap-2">
                <label
                  className="font-label text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: colors.TextBody }}
                >
                  Primary Industry
                </label>
                <signupForm.Field
                  name="primaryIndustry"
                  children={(field) => (
                    <div className="relative">
                      <span className="absolute left-4 top-4">
                        <LockIcon size={18} color={colors.IconColor} />
                      </span>
                      <select
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          setStepOneData({ primaryIndustry: e.target.value });
                        }}
                        className={`block w-full py-3 text-sm font-label`}
                        style={{
                          background: colors.Background,
                          borderColor: colors.CardBorder,
                          color: colors.TextBody,
                        }}
                      >
                        <option value="">Select Industry</option>
                        {IndustryOptions.map((industry, index) => (
                          <option key={index} value={industry.value}>
                            {industry.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER ACTION BAR FOR STEP 1 */}
        <div
          className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 pt-3"
          style={{ borderTop: `1px solid ${colors.Border}` }}
        >
          <button
            onClick={() => navigate({ to: "/login" })}
            className="w-full sm:w-auto px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ color: colors.TextBody }}
          >
            <LeftArrowIcon size={16} color={colors.IconColor} /> Back to Sign In
          </button>

          <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-center">
            <span
              className={`text-xs font-semibold uppercase tracking-wider`}
              style={{ color: colors.TextBody }}
            >
              Step 1 of 3
            </span>
            <button
              onClick={handleStepOneSubmit}
              className={`${styles.btn}`}
              style={{
                background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                opacity: isStepOnePending ? 0.7 : 1,
                color: colors.TextBody,
              }}
              disabled={isStepOnePending}
            >
              {isStepOnePending ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupStep1;
