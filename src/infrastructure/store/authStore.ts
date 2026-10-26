import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AuthStore,
  DEFAULT_TOOL_UI_CONFIG,
} from "../../interfaces/auth/auth.interface";
import { updateCompanyOnboardingStepApi } from "../../adapters/api/authApi";

const normalizeLayout = (layout: string): any => {
  if (layout === "grid") return "dashboard";
  if (layout === "list") return "catalog";
  if (layout === "cards") return "timeline";
  return layout || "dashboard";
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authReady: false,
      apisList: [],
      MapsApiKey: "",
      selectedLayout: "dashboard",
      setAuth: (user: any) => {
        const mappedApis = user?.apis?.map((api: any, index: number) => {
          const isWidgetEnabled =
            api.isWidgetEnabled !== undefined
              ? Boolean(api.isWidgetEnabled)
              : api.uiConfig?.uiEnabled !== undefined
                ? Boolean(api.uiConfig.uiEnabled)
                : true;
          const isMapViewEnabled =
            api.isMapViewEnabled !== undefined
              ? Boolean(api.isMapViewEnabled)
              : api.uiConfig?.mapEnabled !== undefined
                ? Boolean(api.uiConfig.mapEnabled)
                : false;

          let endpointStr = "";
          if (api.baseUrl && api.endpoint) {
            endpointStr = `${api.baseUrl}${api.endpoint}`;
          } else if (api.endpoint) {
            endpointStr = api.endpoint;
          }

          return {
            id: api.id || api._id || `api-${index + 1}`,
            rawIndex: index,
            apiName: api.name || "",
            apiMethod: api.method || "GET",
            apiEndpoint: endpointStr,
            apiAuthType: api.authType || "No Auth",
            apiCredentials:
              api.bearerToken || api.apiKey || api.oauthClientSecret || "",
            apiAuthHeader: api.authHeader || "",
            oauthTokenUrl: api.oauthTokenUrl || "",
            oauthClientId: api.oauthClientId || "",
            apiHeaders:
              api.headers && api.headers.length > 0 ? api.headers[0] : "",
            apiQueryParams:
              api.params && api.params.length > 0 ? api.params[0] : "",
            isWidgetEnabled,
            isMapViewEnabled,
            uiConfig: api.uiConfig || {
              uiEnabled: isWidgetEnabled,
              uiType: api.uiType || "auto",
              mapEnabled: isMapViewEnabled,
            },
            mcpDescription: api.mcpDescription || "",
            mcpToolName: api.mcpToolName || "",
            headers: api.headers || [],
            params: api.params || [],
            body: api.body || [],
            apiSchema: api.apiSchema,
            sampleResponse:
              api.sampleResponse || api.sampleresponse || undefined,
            isTested:
              api.isTested !== undefined
                ? Boolean(api.isTested)
                : Boolean(api.sampleResponse || api.sampleresponse),
            isAnalyzed:
              api.isAnalyzed !== undefined
                ? Boolean(api.isAnalyzed)
                : Boolean(api.apiSchema),
          };
        });

        set((state) => ({
          user: {
            id: user._id || user.id || "",
            name: user.companyName || user.name || "",
            email: user.email || "",
            role: user.role || "company",
            isSignupOnboardingDone: Boolean(user?.isSignupOnboardingDone),
            signupOnboardingStep:
              typeof user?.signupOnboardingStep === "number"
                ? user.signupOnboardingStep
                : 1,
            onboardingStep:
              typeof user?.onboardingStep === "number"
                ? user.onboardingStep
                : 1,
            dashboardOnboardingStep:
              typeof user?.dashboardOnboardingStep === "number"
                ? Math.min(user.dashboardOnboardingStep, 3)
                : 1,
            isDashboardOnboardingDone: Boolean(user?.isDashboardOnboardingDone),
            status: user?.status || "",
            mcpSlug:
              user?.mcpSlug ||
              user?.companyName?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              "",
          },
          isAuthenticated: true,
          apisList: mappedApis && mappedApis.length > 0 ? mappedApis : [],
          selectedLayout: normalizeLayout(user?.uiPreference?.layout),
          MapsApiKey:
            user?.MapsApiKey ||
            user?.uiPreference?.MapsApiKey ||
            state.MapsApiKey ||
            "",
        }));
      },
      setAuthReady: (authReady: boolean) => set({ authReady }),
      setApisList: (apis) =>
        set((state) => ({
          apisList: typeof apis === "function" ? apis(state.apisList) : apis,
        })),
      setSelectedLayout: (layout) =>
        set({ selectedLayout: normalizeLayout(layout) }),
      setSignupOnboardingDone: (done: boolean) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, isSignupOnboardingDone: done }
            : null,
        })),
      setSignupOnboardingStep: (step: number) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, signupOnboardingStep: step }
            : null,
        })),
      setOnboardingStep: (step: number) => {
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "softtech_onboarding_step",
              String(step),
            );
          }
        } catch (e) {
          console.warn("Could not save onboarding step to localStorage:", e);
        }
        set((state) => {
          if (state.user?.id) {
            updateCompanyOnboardingStepApi(state.user.id, step).catch((err) =>
              console.warn("Could not persist onboarding step to server:", err),
            );
          }
          // Canonical shape: steps never exceed 3; completion lives in the
          // boolean. Legacy `onboardingStep` stays in sync for old clients.
          const isDashDone = step >= 4;
          return {
            user: state.user
              ? {
                  ...state.user,
                  onboardingStep: step,
                  dashboardOnboardingStep: isDashDone ? 3 : step,
                  isDashboardOnboardingDone: isDashDone,
                }
              : null,
          };
        });
      },
      updateApiUiConfig: (apiId, config) =>
        set((state) => ({
          apisList: state.apisList.map((api) => {
            if (api.id !== apiId) return api;
            const updatedUiConfig = {
              ...(api.uiConfig || { ...DEFAULT_TOOL_UI_CONFIG }),
              ...config,
            };
            return {
              ...api,
              uiConfig: updatedUiConfig,
              isWidgetEnabled: updatedUiConfig.uiEnabled,
              isMapViewEnabled: updatedUiConfig.mapEnabled,
            };
          }),
        })),
      updateApiDescription: (apiId, description) =>
        set((state) => ({
          apisList: state.apisList.map((api) =>
            api.id === apiId
              ? {
                  ...api,
                  mcpDescription: description,
                  apiSchema: api.apiSchema
                    ? { ...api.apiSchema, toolDescription: description }
                    : api.apiSchema,
                }
              : api,
          ),
        })),
      setMapsApiKey: (key) => set({ MapsApiKey: key }),
      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
          apisList: [],
          selectedLayout: "dashboard",
        }),
    }),
    {
      name: "softtech-auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        apisList: state.apisList,
        MapsApiKey: state.MapsApiKey,
        selectedLayout: state.selectedLayout,
      }),
    },
  ),
);
