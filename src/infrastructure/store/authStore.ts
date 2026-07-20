import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthStore, ApiConnection } from "../../interfaces/auth.interface";

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
      selectedLayout: "dashboard",
      setAuth: (user: any) => {
        const mappedApis = user?.apis?.map((api: any, index: number) => ({
          id: api.id || `api-${index + 1}`,
          apiName: api.name || "",
          apiMethod: api.method || "GET",
          apiEndpoint: api.baseUrl && api.endpoint ? `${api.baseUrl}${api.endpoint}` : "",
          apiAuthType: api.authType || "No Auth",
          apiCredentials: api.bearerToken || api.apiKey || api.oauthClientSecret || "",
          apiAuthHeader: api.authHeader || "",
          oauthTokenUrl: api.oauthTokenUrl || "",
          oauthClientId: api.oauthClientId || "",
          apiHeaders: api.headers && api.headers.length > 0 ? api.headers[0] : "",
          apiQueryParams: api.params && api.params.length > 0 ? api.params[0] : "",
        }));

        set((state) => ({
          user: {
            id: user._id || user.id || "",
            name: user.companyName || user.name || "",
            email: user.email || "",
          },
          isAuthenticated: true,
          apisList: mappedApis && mappedApis.length > 0 ? mappedApis : [],
          selectedLayout: normalizeLayout(user?.uiPreference?.layout),
        }));
      },
      setAuthReady: (authReady: boolean) => set({ authReady }),
      setApisList: (apis) =>
        set((state) => ({
          apisList: typeof apis === "function" ? apis(state.apisList) : apis,
        })),
      setSelectedLayout: (layout) => set({ selectedLayout: normalizeLayout(layout) }),
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
        selectedLayout: state.selectedLayout,
      }),
    },
  ),
);
