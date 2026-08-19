import React, { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import styles from "../../../../styles/login.module.css";
import { login } from "../../../../adapters/api/authApi";
import {
  EmailIcon,
  HelpIcon,
  LeftArrowIcon,
  LockIcon,
  MoonIcon,
  RightArrowIcon,
  SunIcon,
} from "../../../../assets/icons";
import { useThemeStore, useAuthStore, useLoginStore } from "../../../../hooks";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
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
      };

      setAuth(user);
      showToast("Logged in successfully!", "success");
      navigate({ to: "/dashboard", replace: true });
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

  const fillCredentials = (targetEmail: string) => {
    fillCredentialsStore(targetEmail);
    loginForm.setFieldValue("email", targetEmail);
    loginForm.setFieldValue("password", "password123");
  };

  const handleLoginSubmit = () => {
    loginForm.handleSubmit();
  };

  return (
    <div
      className={styles.loginwrapper}
      style={{ background: colors.Background }}
    >
      {/* HEADER BAR */}
      <div
        className={styles.loginheader}
        style={{
          background: colors.Headerbackground,
          borderBottom: `1px solid ${colors.HeaderBottomBorder}`,
        }}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2transition-colors group cursor-pointer"
          >
            <LeftArrowIcon size={18} color={colors.AuthIconColor} />
          </button>
          <span
            onClick={() => navigate({ to: "/" })}
            className={styles.logoText}
            style={{
              color: colors.TextHeading,
            }}
          >
            SoftTech AI
          </span>
        </div>

        <div className="md:flex items-center gap-4">
          <button className="p-2">
            <HelpIcon size={20} color={colors.HeaderIconColor} />
          </button>
          <button
            onClick={toggleTheme}
            className={isDark ? styles.themeButton : styles.themeButtonLight}
            style={{ color: colors.HeaderIconColor }}
          >
            {isDark ? (
              <SunIcon size={20} color={colors.HeaderIconColor} />
            ) : (
              <MoonIcon size={20} color={colors.HeaderIconColor} />
            )}
          </button>
        </div>
      </div>

      {/* LOGIN CONTENT BODY */}
      <div className="mt-4 flex flex-col items-center justify-center pt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div
            className={styles.logincard}
            style={{
              background: colors.Headerbackground,
              border: `1px solid ${colors.CardBorder}`,
              borderRadius: "16px",
              boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
            }}
          >
            <div className="mb-8">
              <h2
                className="text-3xl font-headline font-bold mb-2"
                style={{ color: colors.TextHeading }}
              >
                Welcome back
              </h2>
              <p
                className="text-sm font-medium"
                style={{ color: colors.TextBody }}
              >
                Access your system architecture dashboard
              </p>
            </div>

            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLoginSubmit();
                }}
                className="space-y-6"
              >
                <div className={styles.formField}>
                  <label
                    className={`font-label text-xs uppercase tracking-widest font-semibold`}
                    style={{ color: colors.TextBody }}
                  >
                    Email address
                  </label>
                  <loginForm.Field
                    name="email"
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
                        <span className="absolute left-4 top-3.5 flex items-center">
                          <EmailIcon color={colors.IconColor} size={18} />
                        </span>
                        <input
                          type="email"
                          placeholder="you@company.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            setEmail(e.target.value);
                          }}
                          className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label `}
                          style={{
                            background: colors.Background,
                            borderColor:
                              field.state.meta.errors?.length > 0
                                ? colors.WarningBorder
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

                <div className={styles.formField}>
                  <div className="flex justify-between items-center">
                    <label
                      className={`font-label text-xs uppercase tracking-widest font-semibold`}
                      style={{ color: colors.TextBody }}
                    >
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-xs font-semibold"
                      style={{ color: colors.TextHighlightedHeading }}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate({ to: "/forgot-password" });
                      }}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <loginForm.Field
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
                        <span className="absolute left-4 top-3.5 flex items-center">
                          <LockIcon color={colors.IconColor} size={18} />
                        </span>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            setPassword(e.target.value);
                          }}
                          className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                          style={{
                            background: colors.Background,
                            borderColor:
                              field.state.meta.errors?.length > 0
                                ? colors.WarningBorder
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

                {loginError && (
                  <div
                    className="mb-3 p-3 rounded-lg text-xs font-semibold text-center"
                    style={{
                      color: colors.WarningText,
                      backgroundColor: colors.WarningBackground,
                      borderColor: colors.WarningBorder,
                    }}
                  >
                    {(loginError as any).message ||
                      "Invalid credentials. Please verify your details."}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-opacity ${styles.btn}`}
                  style={{
                    background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
                    opacity: isPending ? 0.7 : 1,
                    color: "#fff",
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    "Authenticating..."
                  ) : (
                    <>
                      Sign In{" "}
                      <RightArrowIcon color={colors.AuthIconColor} size={16} />
                    </>
                  )}
                </button>
              </form>
              <div className="mt-3 ">
                <p
                  className="text-center font-label text-xs"
                  style={{ color: colors.TextBody }}
                >
                  New to SoftTechAI?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-sm"
                    style={{ color: colors.TextHighlightedHeading }}
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
