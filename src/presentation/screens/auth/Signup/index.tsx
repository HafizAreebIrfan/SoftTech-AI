import React, { FC } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { CheckIcon, LeftArrowIcon, SunIcon, MoonIcon, HelpIcon } from "../../../../assets/icons";
import styles from "../../../../styles/signup.module.css";

const Signup: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, isDark, toggleTheme } = useThemeStore();

  const signupStep = location.pathname.endsWith('/step2') ? 2 : location.pathname.endsWith('/step3') ? 3 : 1;

  const handleLogoClick = () => {
    navigate({ to: '/' });
  };

  return (
    <div className={styles.signupwrapper} style={{ background: colors.Background }}>
      <header className={`${styles.signupheader}`} style={{ background: colors.Headerbackground, borderBottom: `1px solid ${colors.HeaderBottomBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
        <div className="flex items-center justify-between md:block flex-grow md:flex-grow-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (signupStep === 1) {
                  navigate({ to: '/login' });
                } else if (signupStep === 2) {
                  navigate({ to: '/signup/step1' });
                } else {
                  navigate({ to: '/signup/step2' });
                }
              }}
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

        <nav className="flex items-center gap-4 text-left">
          {/* Step 1 badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm`}
              style={signupStep === 1 ? { background: `linear-gradient(90deg, ${colors.BackgroundGradientOne}, ${colors.BackgroundGradientTwo})`, color: colors.TextOverlay } : signupStep > 1 ? { background: colors.UISelectionCardBackground, color: colors.TextHeading } : { background: colors.Background, color: colors.TextHeading }}
            >
              {signupStep > 1 ? <CheckIcon size={16} color={colors.IconColor} /> : "1"}
            </div>
            <div className="hidden lg:block">
              <p className={`font-label text-[10px] mb-0 uppercase tracking-wider`} style={{ color: colors.TextHighlightedHeading }}>
                {signupStep === 1 ? 'Current' : 'Step 1'}
              </p>
              <p className={`font-body text-xs font-normal`} style={{ color: colors.TextHeading }}>Company Info</p>
            </div>
          </div>

          <div className="w-8 h-[2px]" style={{ background: colors.Background, filter: 'invert(1)' }}></div>

          {/* Step 2 badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm`}
              style={signupStep === 2 ? { background: `linear-gradient(90deg, ${colors.BackgroundGradientOne}, ${colors.BackgroundGradientTwo})`, color: colors.TextOverlay } : signupStep > 2 ? { background: colors.UISelectionCardBackground, color: colors.TextHeading } : { background: colors.Background, color: colors.TextHeading }}>
              {signupStep > 2 ? <CheckIcon size={16} color={colors.IconColor} /> : "2"}
            </div>
            <div className="hidden lg:block">
              <p className={`font-label text-[10px] mb-0 uppercase tracking-wider ${signupStep === 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
                {signupStep === 2 ? 'Current' : 'Step 2'}
              </p>
              <p className={`font-body text-xs font-normal`} style={{ color: colors.TextHeading }}>API Config</p>
            </div>
          </div>

          <div className="w-8 h-[2px]" style={{ background: colors.Background, filter: 'invert(1)' }}></div>

          {/* Step 3 badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm`}
              style={signupStep === 3 ? { background: `linear-gradient(90deg, ${colors.BackgroundGradientOne}, ${colors.BackgroundGradientTwo})`, color: colors.TextOverlay } : signupStep > 3 ? { background: colors.UISelectionCardBackground, color: colors.TextHeading } : { background: colors.Background, color: colors.TextHeading }}>
              {signupStep > 3 ? <CheckIcon size={16} color={colors.IconColor} /> : "3"}
            </div>
            <div className="hidden lg:block">
              <p className={`font-label text-[10px] mb-0 uppercase tracking-wider ${signupStep === 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
                {signupStep === 3 ? 'Current' : 'Step 3'}
              </p>
              <p className={`font-body text-xs font-normal`} style={{ color: colors.TextHeading }}>UI Preferences</p>
            </div>
          </div>
        </nav>

        <div className="md:flex items-center gap-4">
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
      <main className="w-full flex-grow flex items-center justify-center p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Signup;
