import React, { FC, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useThemeStore, useSignupStore, useAuthStore } from "../../../../hooks";
import { registerCompanyInfo } from "../../../../adapters/api/authApi";
import {
  EmailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  BriefcaseIcon,
  BuildingIcon,
  GlobeIcon,
  DevicesIcon,
} from "../../../../assets/icons";
import { showToast } from "../../../../utils/toast";
import { stepOneSchema } from "../../../../infrastructure/validation/signupSchemas";
import { z } from "zod";
import { IndustryOptions } from "../../../../types/industryoptions";
import styles from "../../../../styles/signup.module.css";

const SignupStep1: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark } = useThemeStore();
  const { setAuth } = useAuthStore();
  const {
    companyId,
    setCompanyId,
    stepOneData,
    setStepOneData,
    lastSavedStepOneData,
    setLastSavedStepOneData,
    setSignupOnboardingStep,
    setSignupOnboardingDone,
  } = useSignupStore();

  const [showPassword, setShowPassword] = useState(false);

  const { mutate: stepOneMutate, isPending: isStepOnePending } = useMutation({
    mutationFn: registerCompanyInfo,
    onSuccess: (res) => {
      if (res && res.success && res.data) {
        const newCompanyId = res.data._id;
        const authToken = (res as any).token || res.data?.token;
        if (authToken) {
          localStorage.setItem("authToken", authToken);
        }
        setCompanyId(newCompanyId);
        setLastSavedStepOneData({ ...stepOneData });
        setSignupOnboardingStep(1);
        setSignupOnboardingDone(false);

        // Authenticate company in SoftTech AI session:
        setAuth({
          id: newCompanyId,
          name: res.data.companyName || stepOneData.companyName,
          email: res.data.email || stepOneData.adminEmail,
          role: (res.data as any).role || "company",
          isSignupOnboardingDone: false,
          signupOnboardingStep: 1,
          onboardingStep: 1,
          apis: res.data.apis || [],
        });

        showToast("Account created successfully!", "success");
        navigate({ to: "/signup/success" });
      } else {
        showToast(res?.message || "Failed to create company account.", "error");
      }
    },
    onError: (err: any) => {
      showToast(err.message || "An error occurred during Signup.", "error");
    },
  });

  const signupForm = useForm({
    defaultValues: {
      companyName: stepOneData.companyName || "",
      adminEmail: stepOneData.adminEmail || "",
      password: stepOneData.password || "",
      mcpSlug: stepOneData.subdomain || "",
      primaryIndustry: stepOneData.primaryIndustry || "saas",
      targetPlatform: stepOneData.targetPlatform || "web",
    },
    onSubmit: async ({ value }) => {
      const parsed = stepOneSchema.safeParse(value);
      if (!parsed.success) {
        showToast("Please correct the errors in the form.", "error");
        return;
      }

      const isUnchanged =
        Boolean(companyId) &&
        Boolean(lastSavedStepOneData) &&
        lastSavedStepOneData?.companyName === value.companyName &&
        lastSavedStepOneData?.adminEmail === value.adminEmail &&
        lastSavedStepOneData?.password === value.password &&
        lastSavedStepOneData?.subdomain === value.mcpSlug &&
        lastSavedStepOneData?.primaryIndustry === value.primaryIndustry &&
        lastSavedStepOneData?.targetPlatform === value.targetPlatform;

      if (isUnchanged) {
        navigate({ to: "/signup/success" });
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
      key="step1"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 15 }}
      className="w-full mx-auto lg:mx-0 py-4"
    >
      {/* Header section */}
      <div className="mb-7">
        <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${styles.signupTitle}`}>
          Create new account<span className="text-blue-600">.</span>
        </h2>
        <p className={`text-sm font-normal ${styles.signupSubtitle}`}>
          Already a Member?{" "}
          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
          >
            Log In
          </button>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStepOneSubmit();
        }}
        className="space-y-4"
      >
        {/* Legal Company Name */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider ${styles.fieldLabel}`}>
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
                  return res.success ? undefined : res.error.issues[0].message;
                },
              }}
              children={(field) => (
                <div className="relative">
                  <span className="absolute left-4 top-3.5 flex items-center pointer-events-none text-slate-400">
                    <BuildingIcon size={18} color={colors.IconColor} />
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
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all text-sm border ${styles.inputfield}`}
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <span className={`text-[11px] mt-1.5 block font-semibold ${styles.fieldError}`}>
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Admin Email */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider ${styles.fieldLabel}`}>
              Admin Email
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
                  return res.success ? undefined : res.error.issues[0].message;
                },
              }}
              children={(field) => (
                <div className="relative">
                  <span className="absolute left-4 top-3.5 flex items-center pointer-events-none text-slate-400">
                    <EmailIcon size={18} color={colors.IconColor} />
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
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all text-sm border ${styles.inputfield}`}
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <span className={`text-[11px] mt-1.5 block font-semibold ${styles.fieldError}`}>
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${styles.fieldLabel}`}>
            Password
          </label>
          <signupForm.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                const res = z
                  .string()
                  .min(6, "Password must be at least 6 characters")
                  .safeParse(value);
                return res.success ? undefined : res.error.issues[0].message;
              },
            }}
            children={(field) => (
              <div className="relative">
                <span className="absolute left-4 top-3.5 flex items-center pointer-events-none text-slate-400">
                  <LockIcon size={18} color={colors.IconColor} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setStepOneData({ password: e.target.value });
                  }}
                  className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all text-sm border ${styles.inputfield}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 flex items-center p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} color={colors.IconColor} />
                  ) : (
                    <EyeIcon size={18} color={colors.IconColor} />
                  )}
                </button>
                {field.state.meta.errors?.length > 0 && (
                  <span className={`text-[11px] mt-1.5 block font-semibold ${styles.fieldError}`}>
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          />
        </div>

        {/* Workspace Subdomain */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${styles.fieldLabel}`}>
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
                return res.success ? undefined : res.error.issues[0].message;
              },
            }}
            children={(field) => (
              <div>
                <div className={`flex rounded-xl overflow-hidden transition-all ${styles.subdomainInputGroup}`}>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-3.5 flex items-center pointer-events-none text-slate-400">
                      <GlobeIcon size={18} color={colors.IconColor} />
                    </span>
                    <input
                      type="text"
                      placeholder="nexus"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const val = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "");
                        field.handleChange(val);
                        setStepOneData({ subdomain: val });
                      }}
                      className={`block w-full pl-11 pr-4 py-3 outline-none transition-all text-sm border ${styles.inputfield}`}
                    />
                  </div>
                  <div
                    className={`px-4 py-3 border-l border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 text-sm font-semibold whitespace-nowrap flex items-center select-none `}
                  >
                    .softtech.ai
                  </div>
                </div>
                {field.state.meta.errors?.length > 0 && (
                  <span className={`text-[11px] mt-1.5 block font-semibold ${styles.fieldError}`}>
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          />
        </div>

        {/* Primary Industry & Target Platform side-by-side in flex */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Primary Industry */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider ${styles.fieldLabel}`}>
              Primary Industry
            </label>
            <signupForm.Field
              name="primaryIndustry"
              validators={{
                onChange: ({ value }) =>
                  value ? undefined : "Please select an industry",
              }}
              children={(field) => (
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 flex items-center pointer-events-none text-slate-400">
                    <BriefcaseIcon
                      size={18}
                      color={colors.IconColor || "#64748b"}
                    />
                  </span>
                  <select
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setStepOneData({ primaryIndustry: e.target.value });
                    }}
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all text-sm border ${styles.selectfield}`}
                  >
                    <option value="" className={styles.selectOption}>Select Industry</option>
                    {IndustryOptions.map((industry, index) => (
                      <option
                        key={index}
                        value={industry.value}
                        className={styles.selectOption}
                      >
                        {industry.label}
                      </option>
                    ))}
                  </select>
                  {field.state.meta.errors?.length > 0 && (
                    <span className={`text-[11px] mt-1.5 block font-semibold ${styles.fieldError}`}>
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Target Platform */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider ${styles.fieldLabel}`}>
              Target Platform
            </label>
            <signupForm.Field
              name="targetPlatform"
              children={(field) => (
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 flex items-center pointer-events-none text-slate-400">
                    <DevicesIcon
                      size={18}
                      color={colors.IconColor || "#64748b"}
                    />
                  </span>
                  <select
                    value={stepOneData.targetPlatform || "web"}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      field.handleChange(val);
                      setStepOneData({ targetPlatform: val });
                    }}
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all text-sm border ${styles.selectfield}`}
                  >
                    <option value="web" className={styles.selectOption}>
                      Web App
                    </option>
                    <option value="mobile" className={styles.selectOption}>
                      Mobile App
                    </option>
                    <option value="both" className={styles.selectOption}>
                      Both (Web & Mobile)
                    </option>
                  </select>
                </div>
              )}
            />
          </div>
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={isStepOnePending}
          className={`w-full mt-7 py-3.5 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${styles.primarySubmitBtn}`}
        >
          {isStepOnePending ? (
            <span>Creating Account...</span>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default SignupStep1;
