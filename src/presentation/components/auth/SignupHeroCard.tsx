import React, { FC } from "react";
import { SparklesIcon, CheckIcon, DatabaseIcon } from "../../../assets/icons";
import { useThemeStore } from "../../../hooks";

export const SignupHeroCard: FC = () => {
  const { colors } = useThemeStore();
  return (
    <aside className="hidden lg:flex w-[440px] xl:w-[500px] 2xl:w-[540px] shrink-0 h-screen p-4 xl:p-6 flex-col items-center justify-center sticky top-0 right-0">
      <div className="w-full h-full bg-blue-600 rounded-[2.5rem] flex flex-col justify-between p-7 xl:p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-600/30 select-none">
        {/* Ambient Background Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-900/50 blur-3xl pointer-events-none" />

        {/* Top Header Section */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-white mb-3.5 shadow-sm">
            <SparklesIcon size={13} color={colors.OverlayIconColor} />
            <span>Next-Gen MCP Integration</span>
          </div>

          <h3 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-tight text-white mb-2.5">
            The simplest way to connect your APIs with ChatGPT.
          </h3>

          <p className="text-xs xl:text-sm text-blue-100/90 leading-relaxed font-normal max-w-md">
            Automate OpenAPI schema generation, configure dedicated MCP
            streaming containers, and launch self-hosted adaptive widgets.
          </p>
        </div>

        {/* Center Section: SaaS Dashboard UI Preview Card (inspired by Screenshot 4 and Screenshot 3/5) */}
        <div className="relative z-10 w-full my-auto py-3">
          <div
            className="w-full rounded-2xl p-4 sm:p-5 shadow-2xl shadow-blue-950/40 text-slate-800 border border-white/90 relative"
            style={{ background: colors.Background }}
          >
            {/* Mockup Window Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                  <div className="w-2.5 h-2.5 border-2 border-white rounded-[1px] transform rotate-45" />
                </div>
                <span
                  className="text-xs font-bold text-slate-900 tracking-tight"
                  style={{ color: colors.TextHeading }}
                >
                  SoftTech AI Engine
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live MCP SSE</span>
              </div>
            </div>

            {/* 3 Metric KPI Cards */}
            <div className="grid grid-cols-3 gap-2 mb-2 text-left">
              <div
                className="p-2 rounded-xl border border-slate-100"
                style={{ background: colors.Background }}
              >
                <div
                  className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
                  style={{ color: colors.TextHeading }}
                >
                  APIs
                </div>
                <div
                  className="text-sm font-extrabold text-slate-900 flex items-center gap-1"
                  style={{ color: colors.TextBody }}
                >
                  24{" "}
                  <span className="text-[10px] font-bold text-emerald-600">
                    +100%
                  </span>
                </div>
              </div>

              <div
                className="p-2 rounded-xl border border-slate-100"
                style={{ background: colors.Background }}
              >
                <div
                  className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
                  style={{ color: colors.TextBody }}
                >
                  Accuracy
                </div>
                <div className="text-sm font-extrabold text-blue-600 flex items-center gap-1">
                  99.8%
                </div>
              </div>

              <div
                className="p-2 rounded-xl border border-slate-100"
                style={{ background: colors.Background }}
              >
                <div
                  className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
                  style={{ color: colors.TextBody }}
                >
                  Latency
                </div>
                <div
                  className="text-sm font-extrabold text-slate-900"
                  style={{ color: colors.TextHeading }}
                >
                  18ms
                </div>
              </div>
            </div>

            {/* Interactive Wave Curve Stream Visualization */}
            <div className="relative pt-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 px-0.5">
                <span>Real-time SSE Event Stream</span>
                <span className="text-blue-600 font-mono">1,420 events/s</span>
              </div>

              <svg
                viewBox="0 0 340 70"
                className="w-full h-14 overflow-visible my-1"
              >
                <defs>
                  <linearGradient id="heroWaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 Q45,15 90,32 T180,18 T260,32 T340,12 L340,70 L0,70 Z"
                  fill="url(#heroWaveGrad)"
                />
                <path
                  d="M0,45 Q45,15 90,32 T180,18 T260,32 T340,12"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
                <circle cx="260" cy="32" r="3.5" fill="#2563eb" />
                <circle
                  cx="260"
                  cy="32"
                  r="8"
                  fill="#2563eb"
                  fillOpacity="0.2"
                  className="animate-ping"
                />
              </svg>
            </div>

            {/* Floating Overlapping Popup Card (inspired by Screenshot 4 "Add Member") */}
            <div
              className="w-[88%] ml-auto -mb-2 mt-1 rounded-xl p-2.5 backdrop-blur-md border border-slate-200/90 shadow-xl text-left transform translate-y-1"
              style={{ background: colors.Background }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <DatabaseIcon size={13} color="#2563eb" />
                  <span
                    className="text-[11px] font-bold text-slate-900"
                    style={{ color: colors.TextHeading }}
                  >
                    ChatGPT Action Ready
                  </span>
                </div>
                <span
                  className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200"
                  style={{ color: colors.TextBody }}
                >
                  AI Verified ✓
                </span>
              </div>

              <div
                className="flex items-center justify-between rounded-lg p-1.5 border border-slate-100 text-[10px]"
                style={{ background: colors.Background }}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="px-1 py-0.5 bg-blue-600 text-white rounded font-mono font-bold text-[9px]">
                    POST
                  </span>
                  <span
                    className="font-mono text-slate-600 truncate"
                    style={{ color: colors.TextBody }}
                  >
                    /api/v1/checkout
                  </span>
                </div>
                <span className="text-slate-400 font-medium shrink-0">
                  RFC-9728
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Tech Stack Badges (inspired by Screenshot 4 logos) */}
        <div className="relative z-10 pt-2 border-t border-white/15">
          <div className="text-[10px] uppercase font-bold tracking-widest text-blue-200/80 mb-2">
            Integrated With Modern Protocols
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-white/90">
            <span className="hover:text-white transition-colors">
              OpenAI MCP
            </span>
            <span>•</span>
            <span className="hover:text-white transition-colors">
              OpenAPI 3.1
            </span>
            <span>•</span>
            <span className="hover:text-white transition-colors">Postman</span>
            <span>•</span>
            <span className="hover:text-white transition-colors">FastAPI</span>
            <span>•</span>
            <span className="hover:text-white transition-colors">
              REST & SSE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SignupHeroCard;
