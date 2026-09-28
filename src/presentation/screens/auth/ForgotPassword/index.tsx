import React, { FC } from "react";
import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useThemeStore } from "../../../../hooks";
import { SunIcon, MoonIcon } from "../../../../assets/icons";
import { AnimatePresence, motion } from "motion/react";
import dashboardLight from "../../../../assets/images/dashboard-light.png";
import dashboardDark from "../../../../assets/images/dashboard-dark.png";

const ForgotPassword: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme, colors } = useThemeStore();

  const forgotStep = location.pathname.endsWith("/step2")
    ? 2
    : location.pathname.endsWith("/step3")
      ? 3
      : 1;

  const visualIndex = forgotStep - 1;

  return (
    <div
      className={`min-h-screen w-full flex overflow-hidden font-sans transition-colors duration-300`}
      style={{
        background: isDark ? "#0b0f19" : "#fff",
      }}
    >
      {/* LEFT COLUMN: Form Area */}
      <div
        className={`w-full lg:w-1/2 flex flex-col min-h-screen lg:h-screen overflow-y-auto relative z-10 transition-colors duration-300`}
      >
        {/* Header */}
        <header className="flex justify-between items-center w-full p-6 sm:p-8">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-xs transform rotate-45" />
            </div>
            <span
              className={`text-xl font-bold tracking-tight transition-transform group-hover:scale-105 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              SoftTech AI
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${
              isDark
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <SunIcon size={18} color={colors.IconColor} />
            ) : (
              <MoonIcon size={18} color={colors.IconColor} />
            )}
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8">
          <div className="w-full max-w-[380px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={visualIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Pagination Dots */}
        <div className="pb-10 pt-4 flex justify-center gap-2">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                visualIndex === dot
                  ? "w-8 bg-blue-600"
                  : isDark
                    ? "w-4 bg-slate-800"
                    : "w-4 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Dashboard Mockup Area */}
      <div
        className="hidden lg:flex w-3/4 relative transition-colors duration-300"
        style={{
          padding: "52px",
          borderTopLeftRadius: "72px",
          borderBottomLeftRadius: "72px",
          background: isDark ? "#020304ff" : "#eff5fcff",
        }}
      >
        <div
          className={`w-full h-full rounded-[36px] relative overflow-hidden flex flex-col border shadow-2xl transition-colors duration-300 ${
            isDark
              ? "bg-[#0b0e17] border-slate-800/90 shadow-black/80"
              : "bg-white border-slate-200 shadow-slate-300/60"
          }`}
        >
          {/* Top Browser Bar Mockup */}
          <div
            className={`h-12 w-full flex-shrink-0 flex items-center px-6 gap-4 border-b transition-colors duration-300 ${
              isDark
                ? "border-slate-800/80 bg-[#0e1320]"
                : "border-slate-100 bg-slate-50/80"
            }`}
          >
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            </div>
            <div
              className={`flex-1 max-w-sm h-7 rounded-lg border mx-auto flex items-center justify-center px-3 text-[11px] font-mono tracking-wide transition-colors duration-300 ${
                isDark
                  ? "bg-slate-900/60 border-slate-800 text-slate-400"
                  : "bg-white border-slate-200 text-slate-500 shadow-2xs"
              }`}
            >
              softtechai.com/dashboard
            </div>
            <div className="w-12" />
          </div>

          {/* Full Height / Covering Dashboard Image */}
          <div className="flex-1 w-full h-full overflow-hidden relative">
            <img
              src={isDark ? dashboardDark : dashboardLight}
              alt="SoftTech AI Dashboard Preview"
              className="w-full h-full object-cover object-left-top select-none pointer-events-none transition-opacity duration-300"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
