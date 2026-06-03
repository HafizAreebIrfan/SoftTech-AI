import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../../domain/entities/CompanyLogin";
import {
  CompanyApiInformation,
  CompanyInformation,
  CompanyUIInformation,
} from "../../domain/entities/CompanyRegister";

export interface ApiConnection {
  id: string;
  apiName: string;
  apiMethod: "GET" | "POST" | "PUT" | "DELETE";
  apiEndpoint: string;
  apiAuthType: string;
  apiCredentials?: string;
  apiQueryParams?: string;
  apiCheckoutTemplate?: string;
  apiAuthHeader?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
  apiHeaders?: string;
}

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  companyId: string | null;
  companyregisterinfo: CompanyInformation | null;
  companyapisinfo: CompanyApiInformation | null;
  companyuiinfo: CompanyUIInformation | null;
  apisList: ApiConnection[];
  selectedLayout: "grid" | "list" | "cards" | "table";
  setAuth: (user: User) => void;
  setAuthReady: (ready: boolean) => void;
  setCompanyId: (id: string | null) => void;
  setCompanyRegisterInfo: (companyregisterinfo: CompanyInformation) => void;
  setCompanyApisInfo: (companyapisinfo: CompanyApiInformation) => void;
  setCompanyUIInfo: (companyuiinfo: CompanyUIInformation) => void;
  setApisList: (
    apis: ApiConnection[] | ((prev: ApiConnection[]) => ApiConnection[]),
  ) => void;
  setSelectedLayout: (layout: "grid" | "list" | "cards" | "table") => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authReady: false,
      companyId: null,
      companyregisterinfo: null,
      companyapisinfo: null,
      companyuiinfo: null,
      apisList: [
        {
          id: "api-1",
          apiName: "",
          apiMethod: "GET",
          apiEndpoint: "",
          apiAuthType: "No Auth",
          apiCredentials: "",
          apiQueryParams: "",
          apiCheckoutTemplate: "",
          apiAuthHeader: "",
          oauthTokenUrl: "",
          oauthClientId: "",
          apiHeaders: "",
        },
      ],
      selectedLayout: "grid",
      setAuth: (user: User) => set({ user, isAuthenticated: true }),
      setAuthReady: (authReady: boolean) => set({ authReady }),
      setCompanyId: (id: string | null) => set({ companyId: id }),
      setCompanyRegisterInfo: (companyregisterinfo: CompanyInformation) =>
        set({ companyregisterinfo }),
      setCompanyApisInfo: (companyapisinfo: CompanyApiInformation) =>
        set({ companyapisinfo }),
      setCompanyUIInfo: (companyuiinfo: CompanyUIInformation) =>
        set({ companyuiinfo }),
      setApisList: (apis) =>
        set((state) => ({
          apisList: typeof apis === "function" ? apis(state.apisList) : apis,
        })),
      setSelectedLayout: (layout) => set({ selectedLayout: layout }),
      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
          companyId: null,
          selectedLayout: "grid",
          apisList: [
            {
              id: "api-1",
              apiName: "",
              apiMethod: "GET",
              apiEndpoint: "",
              apiAuthType: "No Auth",
              apiCredentials: "",
              apiQueryParams: "",
              apiCheckoutTemplate: "",
              apiAuthHeader: "",
              oauthTokenUrl: "",
              oauthClientId: "",
              apiHeaders: "",
            },
          ],
        }),
    }),
    {
      name: "softtech-auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        companyId: state.companyId,
        companyregisterinfo: state.companyregisterinfo,
        companyapisinfo: state.companyapisinfo,
        companyuiinfo: state.companyuiinfo,
        apisList: state.apisList,
        selectedLayout: state.selectedLayout,
      }),
    },
  ),
);
