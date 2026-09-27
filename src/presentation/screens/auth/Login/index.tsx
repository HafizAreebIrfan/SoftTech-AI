import React, { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import styles from "../../../../styles/login.module.css";
import { login } from "../../../../adapters/api/authApi";
import {
  EmailIcon,
  EyeIcon,
  EyeOffIcon,
  HelpIcon,
  LeftArrowIcon,
  LockIcon,
  MoonIcon,
  PhoneIcon,
  RightArrowIcon,
  SearchIcon,
  SpinnerIcon,
  SunIcon,
} from "../../../../assets/icons";
import { useThemeStore, useAuthStore, useLoginStore } from "../../../../hooks";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "@tanstack/react-form";
import { showToast } from "../../../../utils/toasts";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login: FC = () => {
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { setAuth } = useAuthStore();
  const {
    email,
    password,
    setEmail,
    setPassword,
    showPassword,
    togglepasswordvis,
    fillCredentials: fillCredentialsStore,
  } = useLoginStore();
  const navigate = useNavigate();

  const {
    mutate: loginMutate,
    isPending,
    error: loginError,
  } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const user = {
        id: data?._id || data?.user?._id || data?.user?.id || "",
        name: data?.companyName || data?.user?.name || "",
        email: data?.email || data?.user?.email || "",
        role: data?.role || data?.user?.role || "",
      };
      console.log(user.role);

      setAuth(user);
      showToast("Logged in successfully!", "success");
      navigate({
        to: user.role === "admin" ? "/admin-preview" : "/dashboard",
        replace: true,
      });
    },
    onError: (err: any) => {
      showToast(
        err.message || "Failed to log in. Please check your credentials.",
        "error",
      );
    },
  });

  const loginForm = useForm({
    defaultValues: {
      email: email || "",
      password: password || "",
    },
    onSubmit: async ({ value }) => {
      const parsed = loginSchema.safeParse(value);
      if (!parsed.success) {
        showToast("Please enter a valid email and password.", "error");
        return;
      }
      loginMutate({
        email: value.email,
        password: value.password,
      });
    },
  });

  const handleLoginSubmit = () => {
    loginForm.handleSubmit();
  };

  return (
    <div
      className="min-h-screen w-full flex overflow-hidden font-sans transition-colors duration-300"
      style={{
        background: isDark ? "#0b0f19" : "transparent",
      }}
    >
      {/* LEFT COLUMN: FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-screen lg:h-screen overflow-y-auto relative z-10 p-6 sm:p-12 lg:px-24 xl:px-32">
        {/* Header / Logo */}
        <header className="flex justify-between items-center w-full mb-8 lg:mb-0">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              {/* Placeholder for Logo mark */}
              <div className="w-4 h-4 border-2 border-white rounded-sm transform rotate-45"></div>
            </div>
            <span
              className="text-xl font-bold tracking-tight transition-transform group-hover:scale-105"
              style={{
                color: isDark ? colors.TextHeading : "#1e293b",
              }}
            >
              SoftTech AI
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}`}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <SunIcon size={18} color={colors.HeaderIconColor} />
            ) : (
              <MoonIcon size={18} color="#475569" />
            )}
          </button>
        </header>

        {/* Main Form Container */}
        <div className="w-full max-w-md mx-auto flex-grow flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1
                className="text-4xl font-bold mb-3 tracking-tight"
                style={{ color: isDark ? colors.TextHeading : "#0f172a" }}
              >
                Log in to your Account
              </h1>
              <p
                className="text-base"
                style={{ color: isDark ? colors.TextBody : "#64748b" }}
              >
                Welcome back!
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLoginSubmit();
              }}
              className="space-y-5"
            >
              {}
              <div>
                <loginForm.Field
                  name="email"
                  validators={{
                    onChange: ({ value }: any) => {
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
                  children={(field: any) => (
                    <div className="relative group">
                      <span className="absolute left-4 top-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                        <EmailIcon
                          color={isDark ? colors.IconColor : "#94a3b8"}
                          size={20}
                        />
                      </span>
                      <input
                        type="email"
                        placeholder="Email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={`block w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-base border focus:ring-2 focus:ring-opacity-50 ${isDark ? "bg-[#0f1115] border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20" : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"}`}
                        style={{
                          borderColor:
                            field.state.meta.errors?.length > 0
                              ? isDark
                                ? colors.WarningBorder
                                : "#ef4444"
                              : undefined,
                        }}
                      />
                      {field.state.meta.errors?.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 mt-1.5 block font-medium ml-1"
                        >
                          {field.state.meta.errors.join(", ")}
                        </motion.span>
                      )}
                    </div>
                  )}
                />
              </div>

              {}
              <div>
                <loginForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }: any) => {
                      const res = z
                        .string()
                        .min(6, "Password must be at least 6 characters")
                        .safeParse(value);
                      return res.success
                        ? undefined
                        : res.error.issues[0].message;
                    },
                  }}
                  children={(field: any) => (
                    <div className="relative group">
                      <span className="absolute left-4 top-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                        <LockIcon
                          color={isDark ? colors.IconColor : "#94a3b8"}
                          size={20}
                        />
                      </span>
                      <input
                        placeholder="Password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        type={showPassword ? "text" : "password"}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={`block w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all text-base border focus:ring-2 focus:ring-opacity-50 ${isDark ? "bg-[#0f1115] border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20" : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"}`}
                        style={{
                          borderColor:
                            field.state.meta.errors?.length > 0
                              ? isDark
                                ? colors.WarningBorder
                                : "#ef4444"
                              : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglepasswordvis(showPassword)}
                        className="absolute right-4 top-3.5 flex items-center transition-colors hover:text-blue-500 focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeIcon
                            size={20}
                            color={isDark ? colors.IconColor : "#94a3b8"}
                          />
                        ) : (
                          <EyeOffIcon
                            size={20}
                            color={isDark ? colors.IconColor : "#94a3b8"}
                          />
                        )}
                      </button>
                      {field.state.meta.errors?.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 mt-1.5 block font-medium ml-1"
                        >
                          {field.state.meta.errors.join(", ")}
                        </motion.span>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center"> </div>
                <div className="text-sm">
                  <a
                    href="/forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate({ to: "/forgot-password" });
                    }}
                    className="cursor-pointer font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 mt-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 border border-red-100 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {(loginError as any).message ||
                        "Invalid credentials. Please verify your details."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className={`cursor-pointer w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white transition-all duration-300 transform ${isPending ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"} ${isDark ? "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-600" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"}`}
                style={{
                  background: isDark
                    ? `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`
                    : `linear-gradient(240deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                }}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <SpinnerIcon size={12} color={colors.IconColor} />
                    {/* <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg> */}
                    Authenticating...
                  </span>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p
              className={`mt-8 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="cursor-pointer font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div
          className={`text-xs text-center lg:text-left mt-8 ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          &copy; {new Date().getFullYear()} SoftTech AI. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN: BRANDING / GRAPHIC (Split Screen) */}
      {}
      <div
        className={`hidden lg:flex w-3/4 relative flex-col items-center justify-center p-12 overflow-hidden 
          ${isDark ? "bg-gradient-to-br from-indigo-900 to-[#0f1115]" : "bg-[#0F5FE9]"}`}
        style={{
          borderTopLeftRadius: "72px",
          borderBottomLeftRadius: "72px",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300 blur-[100px]"></div>

          {/* Subtle pattern or grid could go here */}
          <svg
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 40V0H40"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                ></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
          </svg>
        </div>

        {/* Central Graphic / Mockup inspired by first image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 w-full max-w-lg"
        >
          {/* Abstract graphic representing connectivity/dashboard */}
          <div className="relative aspect-square flex items-center justify-center">
            {/* Large circle behind */}
            <div className="absolute w-[80%] h-[80%] rounded-full bg-blue-500/30 border border-blue-400/20 shadow-2xl backdrop-blur-sm"></div>
            <div className="absolute w-[60%] h-[60%] rounded-full bg-blue-400/30 border border-blue-300/20 backdrop-blur-md"></div>

            {/* Dashboard Mockup Panel */}
            <div className="relative z-20 w-[60%] h-[70%] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden ml-auto transform translate-x-12 flex flex-col">
              {/* Fake Browser/Window Header */}
              <div className="h-8 bg-white/10 border-b border-white/10 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
              {/* Fake Content */}
              <div className="flex-1 p-4 space-y-4">
                <div className="w-full h-8 bg-white/10 rounded-lg animate-pulse"></div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="w-3/4 h-3 bg-white/20 rounded"></div>
                    <div className="w-1/2 h-3 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="w-2/3 h-3 bg-white/20 rounded"></div>
                    <div className="w-1/3 h-3 bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Nodes (simulating connections) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute left-[10%] top-[25%] w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl z-30"
            >
              <SearchIcon size={24} color={colors.IconColor} />
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute left-[5%] top-[50%] w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl z-30"
            >
              <PhoneIcon size={20} color={colors.IconColor} />
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{
                repeat: Infinity,
                duration: 4.5,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute left-[20%] bottom-[20%] w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl z-30"
            >
              <EmailIcon size={28} color={colors.IconColor} />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Content below graphic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative z-10 text-center text-white mt-12 max-w-md mx-auto space-y-4"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Connect with every application.
          </h2>
          <p className="text-blue-100 text-lg">
            Everything you need in an easily customizable dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
