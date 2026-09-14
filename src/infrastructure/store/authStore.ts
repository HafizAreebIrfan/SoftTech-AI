import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AuthStore,
  ApiConnection,
  ToolUiConfig,
  DEFAULT_TOOL_UI_CONFIG,
} from "../../interfaces/auth/auth.interface";

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
      googleMapsApiKey: "",
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

          return {
            id: api.id || `api-${index + 1}`,
            apiName: api.name || "",
            apiMethod: api.method || "GET",
            apiEndpoint:
              api.baseUrl && api.endpoint ? `${api.baseUrl}${api.endpoint}` : "",
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
          };
        });

        set((state) => ({
          user: {
            id: user._id || user.id || "",
            name: user.companyName || user.name || "",
            email: user.email || "",
          },
          isAuthenticated: true,
          apisList: mappedApis && mappedApis.length > 0 ? mappedApis : [],
          selectedLayout: normalizeLayout(user?.uiPreference?.layout),
          googleMapsApiKey:
            user?.googleMapsApiKey ||
            user?.uiPreference?.googleMapsApiKey ||
            state.googleMapsApiKey ||
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
            api.id === apiId ? { ...api, mcpDescription: description } : api,
          ),
        })),
      setGoogleMapsApiKey: (key) => set({ googleMapsApiKey: key }),
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
        googleMapsApiKey: state.googleMapsApiKey,
        selectedLayout: state.selectedLayout,
      }),
    },
  ),
);
