import React, { FC } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import {
  CheckIcon,
  LeftArrowIcon,
  SunIcon,
  MoonIcon,
  HelpIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/signup.module.css";

const Signup: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, isDark, toggleTheme } = useThemeStore();

  const signupStep = location.pathname.endsWith("/step2")
    ? 2
    : location.pathname.endsWith("/step3")
      ? 3
      : 1;

  const handleLogoClick = () => {
    navigate({ to: "/" });
  };

  return (
    <div
      className={styles.signupwrapper}
      style={{ background: colors.Background }}
    >
      <header
        className={`${styles.signupheader}`}
        style={{
          background: colors.Headerbackground,
          borderBottom: `1px solid ${colors.HeaderBottomBorder}`,
          boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}`,
        }}
      >
        <div className="flex items-center justify-between md:block flex-grow md:flex-grow-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (signupStep === 1) {
                  navigate({ to: "/login" });
                } else if (signupStep === 2) {
                  navigate({ to: "/signup/step1" });
                } else {
                  navigate({ to: "/signup/step2" });
                }
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
            >
              <LeftArrowIcon size={18} color={colors.AuthIconColor} />
            </button>
            <div className="flex flex-col text-left">
              <span
                className={styles.logoText}
                style={{
                  color: colors.TextHeading,
                }}
                onClick={handleLogoClick}
              >
                SoftTech AI
              </span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-left">
          {/* Step 1 badge */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={
                signupStep === 1
                  ? {
                      background: colors.BrandEmerald,
                      color: "#FFFFFF",
                      boxShadow: `0 4px 12px ${colors.OverlayShadow}`,
                    }
                  : signupStep > 1
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                        color: colors.BrandEmerald,
                      }
                    : {
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        color: colors.TextBody,
                      }
              }
            >
              {signupStep > 1 ? (
                <CheckIcon size={16} color={colors.BrandEmerald} />
              ) : (
                "1"
              )}
            </div>
            <div className="hidden lg:block">
              <p
                style={{
                  color:
                    signupStep === 1 ? colors.BrandEmerald : colors.TextBody,
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                {signupStep === 1 ? "Current" : "Step 1"}
              </p>
              <p
                style={{
                  color:
                    signupStep === 1 ? colors.TextHeading : colors.TextBody,
                  fontSize: "14px",
                  fontWeight: signupStep === 1 ? 600 : 400,
                  margin: 0,
                }}
              >
                Company Info
              </p>
            </div>
          </div>

          <div
            className="w-8 h-[2px]"
            style={{ background: colors.CardBorder }}
          ></div>

          {/* Step 2 badge */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={
                signupStep === 2
                  ? {
                      background: colors.BrandEmerald,
                      color: "#FFFFFF",
                      boxShadow: `0 4px 12px ${colors.OverlayShadow}`,
                    }
                  : signupStep > 2
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                        color: colors.BrandEmerald,
                      }
                    : {
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        color: colors.TextBody,
                      }
              }
            >
              {signupStep > 2 ? (
                <CheckIcon size={16} color={colors.BrandEmerald} />
              ) : (
                "2"
              )}
            </div>
            <div className="hidden lg:block">
              <p
                style={{
                  color:
                    signupStep === 2 ? colors.BrandEmerald : colors.TextBody,
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                {signupStep === 2 ? "Current" : "Step 2"}
              </p>
              <p
                style={{
                  color:
                    signupStep === 2 ? colors.TextHeading : colors.TextBody,
                  fontSize: "14px",
                  fontWeight: signupStep === 2 ? 600 : 400,
                  margin: 0,
                }}
              >
                API Config
              </p>
            </div>
          </div>

          <div
            className="w-8 h-[2px]"
            style={{ background: colors.CardBorder }}
          ></div>

          {/* Step 3 badge */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={
                signupStep === 3
                  ? {
                      background: colors.BrandEmerald,
                      color: "#FFFFFF",
                      boxShadow: `0 4px 12px ${colors.OverlayShadow}`,
                    }
                  : signupStep > 3
                    ? {
                        background: colors.UISelectionCardBackground,
                        border: `1px solid ${colors.CardActiveBorder}`,
                        color: colors.BrandEmerald,
                      }
                    : {
                        background: colors.BackgroundSecondary,
                        border: `1px solid ${colors.CardBorder}`,
                        color: colors.TextBody,
                      }
              }
            >
              {signupStep > 3 ? (
                <CheckIcon size={16} color={colors.BrandEmerald} />
              ) : (
                "3"
              )}
            </div>
            <div className="hidden lg:block">
              <p
                style={{
                  color:
                    signupStep === 3 ? colors.BrandEmerald : colors.TextBody,
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                {signupStep === 3 ? "Current" : "Step 3"}
              </p>
              <p
                style={{
                  color:
                    signupStep === 3 ? colors.TextHeading : colors.TextBody,
                  fontSize: "14px",
                  fontWeight: signupStep === 3 ? 600 : 400,
                  margin: 0,
                }}
              >
                UI Preferences
              </p>
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
            {isDark ? (
              <SunIcon size={20} color={colors.HeaderIconColor} />
            ) : (
              <MoonIcon size={20} color={colors.HeaderIconColor} />
            )}
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
