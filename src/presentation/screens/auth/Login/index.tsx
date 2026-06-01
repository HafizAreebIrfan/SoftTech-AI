import React, { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import styles from "../../../../styles/login.module.css";
import { login } from "../../../../adapters/api/authApi";
import { EmailIcon, HelpIcon, LeftArrowIcon, LockIcon, MoonIcon, RightArrowIcon, SunIcon } from "../../../../assets/icons";
import { useThemeStore, useAuthStore } from "../../../../hooks";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from "@tanstack/react-form";

const Login: FC = () => {
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { mutate: loginMutate, isPending, error: loginError } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data && data.token) {
        // Fallback user if backend didn't return one in the mock response
        const user = data.user || { id: "", name: "", email: "" };
        setAuth(data.token, user);
      }
      alert('login success..');
      navigate({ to: '/' });
    }
  });

  const loginForm = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    onSubmit: async ({ value }) => {
      loginMutate({
        email: value.email,
        password: value.password
      });
    }
  });

  const fillCredentials = (email: string) => {
    loginForm.setFieldValue('email', email);
    loginForm.setFieldValue('password', 'password123');
  };

  const handleLogoClick = () => {
    navigate({ to: '/' });
  };

  return (
    <>
      <div className={styles.loginwrapper} style={{ background: colors.Background }}>
        <header className={`${styles.loginheader}`} style={{ background: colors.Headerbackground, borderBottom: `1px solid ${colors.HeaderBottomBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
          <div className="flex items-center justify-between md:block flex-grow md:flex-grow-0">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate({ to: '/' })}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
              >
                <LeftArrowIcon size={18} color={colors.AuthIconColor} />
              </button>
              <div className="flex flex-col text-left">
                <span className={styles.logoText} style={{ background: `linear-gradient(135deg, ${colors.TextGradientOne}, ${colors.TextGradientTwo}, ${colors.TextGradientThree})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={handleLogoClick}>
                  SoftTech AI
                </span>
              </div>
            </div>
          </div>

          <div className="md:flex items-center gap-4">
            <button className="p-2 hover:text-white">
              <HelpIcon size={20} color={colors.HeaderIconColor} />
            </button>
            <button
              onClick={toggleTheme}
              className={isDark ? styles.themeButton : styles.themeButtonLight}
              aria-label="Toggle theme"
              id="theme-toggle"
            >
              {isDark ? <SunIcon size={20} color={colors.HeaderIconColor} /> : <MoonIcon size={20} color={colors.HeaderIconColor} />}
            </button>
          </div>
        </header>

        <main className="mt-4 flex-grow flex items-center justify-center px-6 py-8 relative z-10 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-[480px] text-left"
            >
              <div className={styles.logincard} style={{ background: colors.BackgroundSecondary, border: `1px solid ${colors.CardBorder}`, borderLeft: `4px solid ${colors.CardActiveBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
                <div className="mb-8 md:text-left">
                  <h2 className={styles.loginheading} style={{ color: colors.TextHeading }}>Welcome back</h2>
                  <p className={styles.logintext} style={{ color: colors.TextBody }}>Sign in to your SoftTech AI account</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loginForm.handleSubmit();
                  }}
                  className="space-y-6"
                >
                  <div className={styles.formField}>
                    <label className={`font-label text-xs uppercase tracking-widest font-semibold`} style={{ color: colors.TextBody }}>Email address</label>
                    <loginForm.Field
                      name="email"
                      children={(field) => (
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 flex items-center">
                            <EmailIcon color={colors.IconColor} size={18} />
                          </span>
                          <input
                            type="email"
                            required
                            placeholder="you@company.com"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label `}
                            style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                          />
                        </div>
                      )}
                    />
                  </div>

                  <div className={styles.formField}>
                    <div className="flex justify-between items-center">
                      <label className={`font-label text-xs uppercase tracking-widest font-semibold`} style={{ color: colors.TextBody }}>Password</label>
                      <a href="#" className="text-xs font-semibold" style={{ color: colors.TextHighlightedHeading }} onClick={() => navigate({ to: "/" })}>Forgot password?</a>
                    </div>
                    <loginForm.Field
                      name="password"
                      children={(field) => (
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 flex items-center">
                            <LockIcon color={colors.IconColor} size={18} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                            style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                          />
                        </div>
                      )}
                    />
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-lg text-xs font-semibold text-center border" style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
                      {(loginError as any).message || "Invalid credentials. Please verify your details."}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`flex items-center justify-center gap-2 text-xs ${styles.btn}`}
                    style={{ background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`, opacity: isPending ? 0.7 : 1 }}
                    disabled={isPending}
                  >
                    {isPending ? "Authenticating..." : <>Sign In <RightArrowIcon color={colors.AuthIconColor} size={16} /></>}
                  </button>
                </form>

                <div className={`mt-4 p-4 rounded-xl border space-y-2.5 text-xs text-left`} style={{ background: colors.Background, border: `1px solid ${colors.CardBorderSecondary}` }}>
                  <span className="font-label text-[10px] font-bold  uppercase tracking-wider block" style={{ color: colors.TextHeading }}>Demo Credentials</span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.TextBody }}>Admin access:</span>
                      <button
                        onClick={() => fillCredentials('admin@acme.com')}
                        className="font-bold hover:underline"
                        style={{ color: colors.TextHighlightedHeading }}
                      >
                        admin@acme.com
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.TextBody }}>Standard testing:</span>
                      <button
                        onClick={() => fillCredentials('admin@admin.com')}
                        className="font-bold hover:underline"
                        style={{ color: colors.TextHighlightedHeading }}
                      >
                        admin@admin.com
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`mt-8 pt-4 text-center`}>
                  <p className="text-slate-400 text-xs text-center flex items-center justify-center gap-1.5">
                    New company?{" "}
                    <button
                      onClick={() => { navigate({ to: '/signup' }) }}
                      className={"font-bold hover:underline "}
                      style={{ color: colors.TextHighlightedHeading }}
                    >
                      Create account
                    </button>
                    <RightArrowIcon color={colors.TextHighlightedHeading} size={16} />
                  </p>
                </div>
              </div>
            </motion.div>

          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default Login;
