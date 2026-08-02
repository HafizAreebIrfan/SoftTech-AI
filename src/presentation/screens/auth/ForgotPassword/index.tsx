import React, { FC } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useThemeStore } from "../../../../hooks";
import { CheckIcon, LeftArrowIcon, SunIcon, MoonIcon, HelpIcon } from "../../../../assets/icons";
import styles from "../../../../styles/forgotpassword.module.css";
import signupStyles from "../../../../styles/signup.module.css";

const ForgotPassword: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, isDark, toggleTheme } = useThemeStore();

  const forgotStep = location.pathname.endsWith('/step2') ? 2 : location.pathname.endsWith('/step3') ? 3 : 1;

  const handleLogoClick = () => {
    navigate({ to: '/' });
  };

  return (
    <div className={signupStyles.signupwrapper} style={{ background: colors.Background, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Ambient nebula glow — fixed behind all content */}
      <div className={styles.nebulaGlow} />

      {/* Universal stardust texture overlay */}
      <div className={styles.stardustOverlay} />

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header className={`${signupStyles.signupheader}`} style={{ background: colors.Headerbackground, borderBottom: `1px solid ${colors.HeaderBottomBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`, paddingTop: "1.25rem", paddingBottom: "1.25rem" }}>
        <div className="flex items-center justify-between md:block flex-grow md:flex-grow-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (forgotStep === 1) {
                  navigate({ to: '/login' });
                } else if (forgotStep === 2) {
                  navigate({ to: '/forgot-password/step1' });
                } else {
                  navigate({ to: '/forgot-password/step2' });
                }
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
            >
              <LeftArrowIcon size={18} color={colors.AuthIconColor} />
            </button>
            <div className="flex flex-col text-left">
              <span className={signupStyles.logoText} style={{ backgroundImage: `linear-gradient(135deg, ${colors.TextGradientOne}, ${colors.TextGradientTwo}, ${colors.TextGradientThree})`, cursor: 'pointer' }} onClick={handleLogoClick}>
                SoftTech AI
              </span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-left">
          {/* Step 1 badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm`}
              style={forgotStep === 1 ? { background: `linear-gradient(90deg, ${colors.BackgroundGradientOne}, ${colors.BackgroundGradientTwo})`, color: colors.TextOverlay } : forgotStep > 1 ? { background: colors.UISelectionCardBackground, color: colors.TextHeading } : { background: colors.Background, color: colors.TextHeading }}
            >
              {forgotStep > 1 ? <CheckIcon size={16} color={colors.IconColor} /> : "1"}
            </div>
            <div className="hidden lg:block">
              <p className={`font-label text-[10px] mb-0 uppercase tracking-wider`} style={{ color: colors.TextHighlightedHeading }}>
                {forgotStep === 1 ? 'Current' : 'Step 1'}
              </p>
              <p className={`font-body text-xs font-normal`} style={{ color: colors.TextHeading }}>Verify Email</p>
            </div>
          </div>

          <div className="w-8 h-[2px]" style={{ background: colors.Background, filter: 'invert(1)' }}></div>

          {/* Step 2 badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm`}
              style={forgotStep === 2 ? { background: `linear-gradient(90deg, ${colors.BackgroundGradientOne}, ${colors.BackgroundGradientTwo})`, color: colors.TextOverlay } : forgotStep > 2 ? { background: colors.UISelectionCardBackground, color: colors.TextHeading } : { background: colors.Background, color: colors.TextHeading }}>
              {forgotStep > 2 ? <CheckIcon size={16} color={colors.IconColor} /> : "2"}
            </div>
            <div className="hidden lg:block">
              <p className={`font-label text-[10px] mb-0 uppercase tracking-wider ${forgotStep === 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
                {forgotStep === 2 ? 'Current' : 'Step 2'}
              </p>
              <p className={`font-body text-xs font-normal`} style={{ color: colors.TextHeading }}>Enter OTP</p>
            </div>
          </div>

          <div className="w-8 h-[2px]" style={{ background: colors.Background, filter: 'invert(1)' }}></div>

          {/* Step 3 badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm`}
              style={forgotStep === 3 ? { background: `linear-gradient(90deg, ${colors.BackgroundGradientOne}, ${colors.BackgroundGradientTwo})`, color: colors.TextOverlay } : forgotStep > 3 ? { background: colors.UISelectionCardBackground, color: colors.TextHeading } : { background: colors.Background, color: colors.TextHeading }}>
              {forgotStep > 3 ? <CheckIcon size={16} color={colors.IconColor} /> : "3"}
            </div>
            <div className="hidden lg:block">
              <p className={`font-label text-[10px] mb-0 uppercase tracking-wider ${forgotStep === 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
                {forgotStep === 3 ? 'Current' : 'Step 3'}
              </p>
              <p className={`font-body text-xs font-normal`} style={{ color: colors.TextHeading }}>New Password</p>
            </div>
          </div>
        </nav>

        <div className="md:flex items-center gap-4">
          <button className="p-2 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <HelpIcon size={20} color={colors.HeaderIconColor} />
          </button>
          <button
            onClick={toggleTheme}
            className={isDark ? signupStyles.themeButton : signupStyles.themeButtonLight}
            aria-label="Toggle theme"
            id="theme-toggle"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {isDark ? <SunIcon size={20} color={colors.HeaderIconColor} /> : <MoonIcon size={20} color={colors.HeaderIconColor} />}
          </button>
        </div>
      </header>

      {/* ── STEP CONTENT (injected via Outlet) ─────────────── */}
      <Outlet />
    </div>
  );
};

export default ForgotPassword;
