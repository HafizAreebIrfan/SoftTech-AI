import { User } from "../../domain/entities/CompanyLogin";

export interface ApiConnection {
  id: string;
  apiName: string;
  apiMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  apisList: ApiConnection[];
  selectedLayout:
    | "dashboard"
    | "catalog"
    | "table"
    | "timeline"
    | "grid"
    | "list"
    | "cards";
  setAuth: (user: any) => void;
  setAuthReady: (ready: boolean) => void;
  setApisList: (
    apis: ApiConnection[] | ((prev: ApiConnection[]) => ApiConnection[]),
  ) => void;
  setSelectedLayout: (
    layout:
      | "dashboard"
      | "catalog"
      | "table"
      | "timeline"
      | "grid"
      | "list"
      | "cards",
  ) => void;
  clearAuth: () => void;
}
