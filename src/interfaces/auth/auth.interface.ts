import { User } from "../../domain/entities/CompanyLogin";

export type ToolUiType = "auto" | "catalog" | "mapcatalog" | "table" | "dashboard" | "profile" | "hidden";

export interface ToolUiConfig {
  uiEnabled: boolean;
  uiType: ToolUiType;
  mapEnabled: boolean;
}

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
  uiConfig?: ToolUiConfig;
  mcpDescription?: string;
}

export const DEFAULT_TOOL_UI_CONFIG: ToolUiConfig = {
  uiEnabled: false,
  uiType: "auto",
  mapEnabled: false,
};

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  apisList: ApiConnection[];
  googleMapsApiKey: string;
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
  updateApiUiConfig: (apiId: string, config: Partial<ToolUiConfig>) => void;
  updateApiDescription: (apiId: string, description: string) => void;
  setGoogleMapsApiKey: (key: string) => void;
  clearAuth: () => void;
}
