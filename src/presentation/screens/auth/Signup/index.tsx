import React, { FC, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import styles from "../../../../styles/signup.module.css";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore } from "../../../../hooks";
import { CheckIcon, DatabaseIcon, EmailIcon, HelpIcon, KeyIcon, LayoutGridIcon, LeftArrowIcon, LockIcon, MoonIcon, Plus, RightArrowIcon, RocketIcon, ServerIcon, SlidersIcon, SunIcon, TerminalIcon, TrashIcon } from "../../../../assets/icons";
import { motion, AnimatePresence } from 'motion/react';

interface ApiConnection {
  id: string;
  apiName: string;
  apiMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiEndpoint: string;
  apiAuthType: string;
  apiCredentials: string;
  apiQueryParams: string;
  apiCheckoutTemplate: string;
}

const Signup: FC = () => {
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [selectedLayout, setSelectedLayout] = useState<'grid' | 'list' | 'cards' | 'table'>('grid');
  const [apisList, setApisList] = useState<ApiConnection[]>([
    {
      id: 'api-1',
      apiName: 'Primary Intelligence Feed',
      apiMethod: 'POST',
      apiEndpoint: 'https://core.interstellar.io/v2/stream/realtime',
      apiAuthType: 'OAuth 2.0',
      apiCredentials: 'pk_live_galaxy_9921_beta',
      apiQueryParams: '{"sync": true, "depth": "high", "format": "nebula-json"}',
      apiCheckoutTemplate: 'https://pay.interstellar.io/session/{id}?ref=softtech'
    }
  ]);

  const signupForm = useForm({
    defaultValues: {
      companyName: '',
      adminEmail: '',
      password: '',
      subdomain: '',
      primaryIndustry: 'saas',

      // Step 2 values
      apiName: 'Primary Intelligence Feed',
      apiMethod: 'POST' as 'GET' | 'POST' | 'PUT' | 'DELETE',
      apiEndpoint: 'https://core.interstellar.io/v2/stream/realtime',
      apiAuthType: 'OAuth 2.0',
      apiCredentials: 'pk_live_galaxy_9921_beta',
      apiQueryParams: '{"sync": true, "depth": "high", "format": "nebula-json"}',
      apiCheckoutTemplate: 'https://pay.interstellar.io/session/{id}?ref=softtech'
    },
    onSubmit: async () => {
      alert("Data saved, check db.. user authenticated. check login");
      navigate({ to: '/' });
    }
  });

  const handleLogoClick = () => {
    navigate({ to: '/' });
  };

  const handleAddApi = () => {
    const newId = `api-${Date.now()}`;
    setApisList(prev => [
      ...prev,
      {
        id: newId,
        apiName: `Auxiliary Stream Endpoint ${prev.length + 1}`,
        apiMethod: 'GET',
        apiEndpoint: 'https://api.interstellar.io/v1/data',
        apiAuthType: 'No Auth',
        apiCredentials: '',
        apiQueryParams: '{"limit": 50}',
        apiCheckoutTemplate: ''
      }
    ]);
  };

  const handleDeleteApi = (id: string) => {
    if (apisList.length > 1) {
      setApisList(prev => prev.filter(api => api.id !== id));
    }
  };

  const updateApiField = (id: string, field: keyof ApiConnection, value: string) => {
    setApisList(prev => prev.map(api => api.id === id ? { ...api, [field]: value } : api));
  };

  return (
    <>
      <div className={styles.signupwrapper} style={{ background: colors.Background }}>
        <header className={`${styles.signupheader}`} style={{ background: colors.Headerbackground, borderBottom: `1px solid ${colors.HeaderBottomBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
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
        {signupStep === 1 && (
          <motion.div
            key="signup-step-1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-4 mt-4 w-full max-w-4xl text-left space-y-8 mx-auto"
          >
            <div className={styles.signupcard} style={{ background: colors.BackgroundSecondary, border: `1px solid ${colors.CardBorder}`, borderLeft: `4px solid ${colors.CardActiveBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-2" style={{ color: colors.TextHeading }}>Company Information</h2>
                <p className="font-medium text-lg leading-relaxed max-w-2xl" style={{ color: colors.TextBody }}>
                  Initialize your interstellar workspace identity. Connect your brand to the protocol.
                </p>
              </div>

              <div className={`relative p-8 md:p-12 backdrop-blur-xl`}>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={styles.formField}>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="font-label text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.TextBody }}>Legal Company Name</label>
                      <signupForm.Field
                        name="companyName"
                        children={(field) => (
                          <div className="relative">
                            <span className="absolute left-4 top-4.5 flex items-center">
                              <EmailIcon color={colors.IconColor} size={18} />
                            </span>
                            <input
                              type="text"
                              placeholder="e.g. Nexus Corp"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                              style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <div className="flex flex-col gap-2">
                      <label className="font-label text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.TextBody }}>Admin Email Address</label>
                      <signupForm.Field
                        name="adminEmail"
                        children={(field) => (
                          <div className="relative">
                            <span className="absolute left-4 top-4.5 flex items-center">
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
                  </div>

                  <div className={styles.formField}>
                    <div className="flex flex-col gap-2">
                      <label className="font-label text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.TextBody }}>System Password</label>
                      <signupForm.Field
                        name="password"
                        children={(field) => (
                          <div className="relative">
                            <span className="absolute left-4 top-4.5"><LockIcon size={18} color={colors.IconColor} /></span>
                            <input
                              type="password"
                              placeholder="••••••••••••"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                              style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>


                  <div className={styles.formField}>
                    <div className="flex flex-col gap-2">
                      <label className="font-label text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.TextBody }}>Workspace Subdomain</label>
                      <signupForm.Field
                        name="subdomain"
                        children={(field) => (
                          <div className="flex">
                            <div className="relative">
                              <span className="absolute left-4 top-4.5"><LockIcon size={18} color={colors.IconColor} /></span>
                              <input
                                type="text"
                                placeholder="nexus"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label `}
                                style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                              />
                            </div>
                            <div className={`px-4 flex items-center rounded-r-xl border-l border-white/5 text-slate-400 font-label text-xs tracking-wider`} style={{ background: colors.Background, opacity: 0.7, border: `1px solid ${colors.CardBorder}`, color: colors.TextBody }}>
                              .softtechai.com
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>


                  <div className={styles.formField}>
                    <div className="flex flex-col gap-2">
                      <label className="font-label text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.TextBody }}>Primary Industry</label>
                      <signupForm.Field
                        name="primaryIndustry"
                        children={(field) => (
                          <div className="relative">
                            <span className="absolute left-4 top-4"><LockIcon size={18} color={colors.IconColor} /></span>
                            <select
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className={`block w-full py-3 text-sm font-label`}
                              style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                            >
                              <option value="ecommerce">E-Commerce</option>
                              <option value="saas">SaaS Development</option>
                              <option value="fintech">FinTech</option>
                              <option value="ai">AI Research</option>
                              <option value="logistics">Deep Space Logistics</option>
                            </select>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* FOOTER ACTION BAR FOR STEP 1 */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 pt-3" style={{ borderTop: `1px solid ${colors.Border}` }}>
                <button
                  onClick={() => navigate({ to: '/login' })}
                  className="w-full sm:w-auto px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ color: colors.TextBody }}
                >
                  <LeftArrowIcon size={16} color={colors.IconColor} /> Back to Sign In
                </button>

                <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-center">
                  <span className={`text-xs font-semibold uppercase tracking-wider`} style={{ color: colors.TextBody }}>Step 1 of 3</span>
                  <button
                    onClick={() => setSignupStep(2)}
                    className={`${styles.btn}`}
                    style={{ background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})` }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {signupStep === 2 && (
          <motion.div
            key="signup-step-2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-4 w-full mx-auto max-w-5xl text-left space-y-12"
          >
            <div className={`${styles.signupcard} mt-4`} style={{ background: colors.BackgroundSecondary, border: `1px solid ${colors.CardBorder}`, borderLeft: `4px solid ${colors.CardActiveBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight mb-2" style={{ color: colors.TextHeading }}>API Configuration</h2>
                <p className="font-medium text-lg leading-relaxed max-w-2xl" style={{ color: colors.TextBody }}>
                  Connect your interstellar data streams. Define endpoints, authentication protocols, and response mapping to fuel your AI curator.
                </p>
              </div>

              {apisList.map((api, index) => (
                <div
                  key={api.id}
                  className={styles.apiBlock}
                  style={{ background: colors.Background, border: `1px solid ${colors.CardBorder}`, boxShadow: `0 4 12px ${colors.OverlayShadow}` }}
                >
                  <div className={styles.apiBlockHeader}
                    style={{ borderBottom: `1px solid ${colors.HeaderBottomBorder}` }}
                  >
                    <div className="flex items-center gap-2">
                      <DatabaseIcon size={16} color={colors.IconColor} />
                      <span className={styles.apiBlockTitle} style={{ color: colors.TextHighlightedHeading }}>
                        API Connection #{index + 1} {index === 0 && "(Primary)"}
                      </span>
                    </div>
                    {apisList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteApi(api.id)}
                        className={styles.deleteBtn}
                      >
                        <TrashIcon size={14} color={colors.IconColor} /> Delete
                      </button>
                    )}
                  </div>
                  <div className={`relative p-8 md:p-12`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left segment forms */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className={styles.formField}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <label className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: colors.TextBody }}>API Name</label>
                              <signupForm.Field
                                name="apiName"
                                children={(field) => (
                                  <div className="relative">
                                    <span className="absolute left-4 top-4.5"><SlidersIcon size={18} color={colors.IconColor} /></span>
                                    <input
                                      type="text"
                                      value={field.state.value}
                                      onChange={(e) => field.handleChange(e.target.value)}
                                      className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                      style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                                    />
                                  </div>
                                )}
                              />
                            </div>
                            <div>
                              <label className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block font-medium" style={{ color: colors.TextBody }}>HTTP Method</label>
                              <signupForm.Field
                                name="apiMethod"
                                children={(field) => (
                                  <div className="relative">
                                    <span className="absolute left-4 top-4.5"><TerminalIcon size={18} color={colors.IconColor} /></span>
                                    <select
                                      value={field.state.value}
                                      onChange={(e) => field.handleChange(e.target.value as any)}
                                      className={`block w-full py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                      style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                                    >
                                      <option value="GET">GET</option>
                                      <option value="POST">POST</option>
                                      <option value="PUT">PUT</option>
                                      <option value="DELETE">DELETE</option>
                                    </select>
                                  </div>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className={styles.formField}>
                          <label className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: colors.TextBody }}>Endpoint URL</label>
                          <signupForm.Field
                            name="apiEndpoint"
                            children={(field) => (
                              <div className="relative">
                                <span className="absolute left-4 top-4">
                                  <ServerIcon size={18} color={colors.IconColor} />
                                </span>
                                <input
                                  type="url"
                                  value={field.state.value}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                  className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                  style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                                />
                              </div>
                            )}
                          />
                        </div>

                        <div className={styles.formField}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: colors.TextBody }}>Auth Type</label>
                              <signupForm.Field
                                name="apiAuthType"
                                children={(field) => (
                                  <div className="relative">
                                    <span className="absolute left-4 top-3">
                                      <KeyIcon size={18} color={colors.IconColor} />
                                    </span>
                                    <select
                                      value={field.state.value}
                                      onChange={(e) => field.handleChange(e.target.value)}
                                      className={`block w-full text-sm font-label`}
                                      style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                                    >
                                      <option>API Key</option>
                                      <option>OAuth 2.0</option>
                                      <option>Bearer Token</option>
                                      <option>No Auth</option>
                                    </select>
                                  </div>
                                )}
                              />
                            </div>
                            <div>
                              <label className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: colors.TextBody }}>Credentials / Token</label>
                              <signupForm.Field
                                name="apiCredentials"
                                children={(field) => (
                                  <div className="relative">
                                    <span className="absolute left-4 top-3">
                                      <LockIcon size={18} color={colors.IconColor} />
                                    </span>
                                    <input
                                      type="password"
                                      value={field.state.value}
                                      onChange={(e) => field.handleChange(e.target.value)}
                                      className={`block w-full rounded-xl outline-none transition-all text-sm font-label`}
                                      style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                                    />
                                  </div>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className={styles.formField}>
                          <label className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: colors.TextBody }}>Query Parameters (JSON string)</label>
                          <signupForm.Field
                            name="apiQueryParams"
                            children={(field) => (
                              <div className="relative">
                                <span className="absolute left-4 top-4.5">
                                  <SlidersIcon size={18} color={colors.IconColor} />
                                </span>
                                <textarea
                                  rows={3}
                                  value={field.state.value}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                  className={`block w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm font-label`}
                                  style={{ background: colors.Background, borderColor: colors.CardBorder, color: colors.TextBody }}
                                />
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      {/* Right segment: JSON highlighted visualizer preview */}
                      <div className="lg:col-span-4 space-y-6">
                        <div>
                          <span className="font-label text-[10px] uppercase tracking-widest font-bold mb-2 block" style={{ color: colors.TextBody }}>Sample JSON Response</span>
                          <div className="text-[11px] p-4 font-mono leading-relaxed max-h-[220px] overflow-y-auto" style={{ border: `1px solid ${colors.CardBorder}`, borderRadius: "12px", backgroundColor: colors.Background }}>
                            <pre className="text-left" style={{ color: colors.TextBody }}>
                              <span style={{ color: colors.TextHighlightedHeading }}>"status"</span>: <span style={{ color: colors.TextBody }}>"active"</span>,{"\n"}
                              <span style={{ color: colors.TextHighlightedHeading }}>"data"</span>: &#123;{"\n"}
                              &nbsp;&nbsp;<span style={{ color: colors.TextHighlightedHeading }}>"coordinates"</span>: [<span style={{ color: colors.TextBody }}>"X-89"</span>, <span style={{ color: colors.TextBody }}>"Y-22"</span>],{"\n"}
                              &nbsp;&nbsp;<span style={{ color: colors.TextHighlightedHeading }}>"telemetry"</span>: <span style={{ color: colors.TextBody }}>true</span>,{"\n"}
                              &nbsp;&nbsp;<span style={{ color: colors.TextHighlightedHeading }}>"nodes"</span>: <span style={{ color: colors.TextBody }}>"1,244"</span>{"\n"}
                              &#125;,{"\n"}
                              <span style={{ color: colors.TextHighlightedHeading }}>"timestamp"</span>: <span style={{ color: colors.TextBody }}>"2026-05-30T17:12Z"</span>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}


              {/* Add subsidiary stream connection */}
              <button
                type="button"
                onClick={handleAddApi}
                className="mt-4 w-full p-4 py-12 rounded-3xl border-2 border-dashed border-[#484751]/40 text-[#76747f] hover:border-indigo-500/50 hover:text-[#9fa7ff] transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer"
              >
                <div className="p-3 bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform">
                  <Plus size={20} color={colors.IconColor} />
                </div>
                <span className="font-headline font-bold text-sm tracking-tight">+ Add Another API Connection</span>
              </button>

              {/* FOOTER ACTION BAR FOR STEP 2 */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 pt-3" style={{ borderTop: `1px solid ${colors.Border}` }}>
                <button
                  onClick={() => setSignupStep(1)}
                  className="w-full sm:w-auto px-6 py-3 font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LeftArrowIcon size={16} color={colors.IconColor} /> Back
                </button>

                <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-center">
                  <span className={`text-xs font-semibold uppercase`} style={{ color: colors.TextBody }}>Step 2 of 3</span>
                  <button
                    onClick={() => setSignupStep(3)}
                    className={`${styles.btn}`}
                    style={{ background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})` }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {signupStep === 3 && (
          <motion.div
            key="signup-step-3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-4 w-full mx-auto max-w-7xl text-left"
          >
            <div className={styles.signupcard} style={{ background: colors.BackgroundSecondary, border: `1px solid ${colors.CardBorder}`, borderLeft: `4px solid ${colors.CardActiveBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* Left pane: selector choices */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="mb-4 text-left">
                    <h2 className="font-headline text-3xl font-extrabold mb-2" style={{ color: colors.TextHeading }}>UI Preferences</h2>
                    <p className="text-base leading-relaxed max-w-xl" style={{ color: colors.TextBody }}>
                      Define how your Digital Curator protocol visualizes data streams. This can be updated at any time from your platform settings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Bento Grid layout */}
                    <div
                      onClick={() => setSelectedLayout('grid')}
                      className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                      style={selectedLayout === 'grid' ? { background: colors.UISelectionCardBackground, border: `1px solid ${colors.CardActiveBorder}` } : { background: colors.Background, border: `1px solid ${colors.CardBorder}` }}>
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                          style={selectedLayout === 'grid' ? { background: colors.UISelectionCardBackground } : { background: colors.BackgroundSecondary }}
                        >
                          <LayoutGridIcon size={20} color={colors.IconColor} />
                        </div>
                        {selectedLayout === 'grid' && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: colors.BackgroundGradientTwo, color: colors.TextHeading }}
                          >
                            <CheckIcon size={12} color={colors.IconColor} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-sm mb-1" style={{ color: colors.TextHeading }}>Grid</h3>
                        <p className="text-xs leading-relaxed" style={{ color: colors.TextBody }}>Modular bento-style layout optimized for data-rich dashboards and visual assets.</p>
                      </div>
                    </div>

                    {/* Traditional List layout */}
                    <div
                      onClick={() => setSelectedLayout('list')}
                      className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                      style={selectedLayout === 'list' ? { background: colors.UISelectionCardBackground, border: `1px solid ${colors.CardActiveBorder}` } : { background: colors.Background, border: `1px solid ${colors.CardBorder}` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                          style={selectedLayout === 'list' ? { background: colors.UISelectionCardBackground } : { background: colors.BackgroundSecondary }}
                        >
                          <TerminalIcon size={20} color={colors.IconColor} />
                        </div>
                        {selectedLayout === 'list' && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: colors.BackgroundGradientTwo, color: colors.TextHeading }}
                          >
                            <CheckIcon size={12} color={colors.IconColor} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-sm mb-1" style={{ color: colors.TextHeading }}>List</h3>
                        <p className="text-xs leading-relaxed" style={{ color: colors.TextBody }}>Traditional linear flow for rapid scanning of documentation and sequential logs.</p>
                      </div>
                    </div>

                    {/* Expandable Cards layout */}
                    <div
                      onClick={() => setSelectedLayout('cards')}
                      className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                      style={selectedLayout === 'cards' ? { background: colors.UISelectionCardBackground, border: `1px solid ${colors.CardActiveBorder}` } : { background: colors.Background, border: `1px solid ${colors.CardBorder}` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                          style={selectedLayout === 'cards' ? { background: colors.UISelectionCardBackground } : { background: colors.BackgroundSecondary }}
                        >
                          <SlidersIcon size={20} color={colors.IconColor} />
                        </div>
                        {selectedLayout === 'cards' && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ background: colors.BackgroundGradientTwo }}
                          >
                            <CheckIcon size={12} color={colors.IconColor} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-sm mb-1" style={{ color: colors.TextHeading }}>Cards</h3>
                        <p className="text-xs leading-relaxed" style={{ color: colors.TextBody }}>Expanded view highlighting metadata and high-level summaries for each entry.</p>
                      </div>
                    </div>

                    {/* Condensed Spreadsheet Table layout */}
                    <div
                      onClick={() => setSelectedLayout('table')}
                      className={`${styles.uiselectioncard} rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between`}
                      style={selectedLayout === 'table' ? { background: colors.UISelectionCardBackground, border: `1px solid ${colors.CardActiveBorder}` } : { background: colors.Background, border: `1px solid ${colors.CardBorder}` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                          style={selectedLayout === 'table' ? { background: colors.UISelectionCardBackground } : { background: colors.BackgroundSecondary }}
                        >
                          <DatabaseIcon size={20} color={colors.IconColor} />
                        </div>
                        {selectedLayout === 'table' && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ background: colors.BackgroundGradientTwo }}
                          >
                            <CheckIcon size={12} color={colors.IconColor} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-sm mb-1" style={{ color: colors.TextHeading }}>Table</h3>
                        <p className="text-xs leading-relaxed" style={{ color: colors.TextBody }}>Condensed spreadsheet-style view for power users handling massive data sets.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right pane: visual preview stream alignment */}
                <div className="lg:col-span-5 sticky top-12">
                  <div className={`backdrop-blur-xl ${styles.rightpaneview}`}
                    style={{ background: colors.Background, borderColor: colors.Border }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="font-label text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: colors.TextBody }}>ChatGPT Widget Preview</h4>
                      <div className="flex gap-1.5 font-bold">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#8a95ff]/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#9699ff]/40"></div>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {/* Interactive previews based on style configurations */}
                      <div className="mt-4 space-y-6">

                        {/* Grid representation */}
                        {selectedLayout === 'grid' && (
                          <motion.div
                            key="pref-grid"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -15 }}
                            transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            className="space-y-4">
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            />
                            <div className="h-10 w-full rounded-xl flex items-center px-4" style={{ background: colors.BackgroundSecondary }}>
                              <div className="w-4 h-4 rounded-full me-3 animate-pulse" style={{ background: colors.UISelectionCardBackground }}></div>
                              <div className="h-2 w-32 rounded" style={{ background: colors.UISelectionCardBackground }}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {[
                                { delay: 0.05, h: "aspect-square", gradient: "from-indigo-500/20 to-purple-500/5" },
                                { delay: 0.1, h: "aspect-square", gradient: "from-purple-500/20 to-violet-500/5" },
                                { delay: 0.15, h: "aspect-square", gradient: "from-violet-500/20 to-pink-500/5" },
                                { delay: 0.2, h: "aspect-square", gradient: "from-indigo-500/20 to-indigo-600/5" }
                              ].map((item, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ delay: item.delay, type: "spring", stiffness: 100 }}
                                  whileHover={{ scale: 1.04 }}
                                  className={`p-3 bg-[#1c1c28] rounded-xl flex flex-col justify-end gap-2 bg-gradient-to-br ${item.gradient} ${item.h}`}
                                >
                                  <motion.div
                                    animate={{ width: ["40%", "70%", "40%"] }}
                                    transition={{ repeat: Infinity, duration: 2.5, delay: idx * 0.2 }}
                                    className="h-2 w-3/4 bg-indigo-400/50 rounded"
                                  />
                                  <div className="h-1.5 w-1/2 bg-slate-600/40 rounded"></div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* List representation */}
                        {selectedLayout === 'list' && (
                          <motion.div
                            key="pref-list"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, type: "spring" }}
                                whileHover={{ x: 6, backgroundColor: "rgba(99, 102, 241, 0.06)" }} className="mb-3 p-3 rounded-xl flex justify-between items-center" style={{ background: colors.BackgroundSecondary }}>
                                <div className="flex items-center gap-3">
                                  <motion.span
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.25 }}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: colors.BackgroundGradientOne }}
                                  />
                                  <div className="h-2 w-28 rounded" style={{ background: colors.UISelectionCardBackground }}></div>
                                </div>
                                <div className="h-2 w-10 rounded" style={{ background: colors.OverlayShadow }}></div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}

                        {/* Cards representation */}
                        {selectedLayout === 'cards' && (
                          <motion.div
                            key="pref-cards"
                            initial={{ opacity: 0, scale: 0.98, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -15 }}
                            transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            className="space-y-4">
                            <motion.div
                              initial={{ x: 30, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="p-4 rounded-xl text-left space-y-3 shadow-lg shadow-indigo-500/5"
                              style={{ background: colors.BackgroundSecondary }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="h-3 w-32 rounded animate-pulse" style={{ background: colors.UISelectionCardBackground }}></div>
                                <div className="h-2 w-12 rounded" style={{ background: colors.OverlayShadow }}></div>
                              </div>
                              <div className="h-2 w-full rounded my-2" style={{ background: colors.UISelectionCardBackground }}></div>
                              <div className="h-2 w-5/6 rounded" style={{ background: colors.UISelectionCardBackground }}></div>
                            </motion.div>

                            <motion.div
                              initial={{ x: -30, opacity: 0 }}
                              animate={{ x: 0, opacity: 0.55 }}
                              transition={{ duration: 0.3, delay: 0.05 }}
                              className="mt-4 p-4 rounded-xl text-left space-y-3 opacity-60"
                              style={{ background: colors.BackgroundSecondary }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="h-3 w-28 rounded animate-pulse" style={{ background: colors.UISelectionCardBackground }}></div>
                                <div className="h-2 w-12 rounded" style={{ background: colors.OverlayShadow }}></div>
                              </div>
                              <div className="h-2 w-full my-2 rounded" style={{ background: colors.UISelectionCardBackground }}></div>
                              <div className="h-2 w-full my-2 rounded" style={{ background: colors.UISelectionCardBackground }}></div>
                            </motion.div>
                          </motion.div>
                        )}

                        {/* Table representation */}
                        {selectedLayout === 'table' && (
                          <motion.div
                            key="pref-table"
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            className="p-3 space-y-3" style={{ background: colors.BackgroundSecondary }}>
                            <div className="flex justify-between items-center pb-2 text-[10px] text-slate-500 uppercase font-mono">
                              <span style={{ color: colors.TextHeading }}>ID</span>
                              <span style={{ color: colors.TextHeading }}>Endpoint</span>
                              <span style={{ color: colors.TextHeading }}>Payload</span>
                            </div>
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex justify-between items-center text-xs pb-1 border-b border-white/5">
                                <div className="h-1.5 w-16 rounded my-2" style={{ background: colors.OverlayShadow }}></div>
                                <div className="h-1.5 w-16 rounded" style={{ background: colors.OverlayShadow }}></div>
                                <div className="h-1.5 w-26 rounded" style={{ background: colors.UISelectionCardBackground }}></div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </AnimatePresence>
                  </div>
                </div>

              </div>

              {/* FOOTER ACTION BAR FOR STEP 3 */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 pt-3" style={{ borderTop: `1px solid ${colors.Border}` }}>
                <button
                  onClick={() => setSignupStep(2)}
                  className="w-full sm:w-auto px-6 py-3 font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LeftArrowIcon size={16} color={colors.IconColor} /> Back
                </button>

                <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-center">
                  <span className="text-xs text-slate-500 font-semibold uppercase" style={{ color: colors.TextBody }}>Step 3 of 3</span>
                  <button
                    onClick={() => {
                      signupForm.handleSubmit();
                    }}
                    className={`w-full sm:w-auto items-center justify-center gap-2 group cursor-pointer ${styles.btn}`}
                    style={{ background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})` }}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default Signup;
