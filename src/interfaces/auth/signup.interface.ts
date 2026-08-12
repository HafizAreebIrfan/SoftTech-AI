import {
  PlatformType,
  WidgetAudience,
} from "../../domain/entities/GenericWidget";

export interface ApiConnection {
  id: string;
  apiName: string;
  apiMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  apiEndpoint: string;
  apiAuthType: string;
  apiCredentials?: string;
  apiQueryParams?: string;
  apiRequestBody?: string;
  platformType?: PlatformType;
  audience?: WidgetAudience;
  webCheckoutUrl?: string;
  mobileDeepLink?: string;
  isCheckoutApi?: boolean;
  isTested?: boolean;
  isAnalyzed?: boolean;
  apiCheckoutTemplate?: string;
  sampleresponse?: string;
  apiSchema?: any;
  schema?: any;
  apiAuthHeader?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
  apiHeaders?: string;
}

export interface StepOneData {
  companyName: string;
  adminEmail: string;
  password?: string;
  subdomain: string;
  primaryIndustry: string;
  targetPlatform: "web" | "mobile" | "both";
}

export interface SignupStore {
  companyId: string | null;
  stepOneData: StepOneData;
  lastSavedStepOneData?: StepOneData | null;
  apisList: ApiConnection[];
  selectedLayout:
    | "dashboard"
    | "catalog"
    | "table"
    | "timeline"
    | "grid"
    | "list"
    | "cards";
  apiTestStates: Record<
    string,
    {
      status: "idle" | "loading" | "success" | "error";
      logs: string;
      sampleResponse?: string;
      failCount?: number;
      apiSchema?: any;
    }
  >;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isStepTwoPending: boolean;

  setCompanyId: (id: string | null) => void;
  setStepOneData: (data: Partial<StepOneData>) => void;
  setLastSavedStepOneData: (data: StepOneData | null) => void;
  setApisList: (
    apis: ApiConnection[] | ((prev: ApiConnection[]) => ApiConnection[]),
  ) => void;
  updateApiField: (id: string, field: keyof ApiConnection, value: any) => void;
  handleAddApi: () => void;
  handleDeleteApi: (id: string) => void;
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
  clearSignupProgress: () => void;
  handleTestApi: (api: ApiConnection) => Promise<void>;
  handleSaveSampleResponse: (apiId: string, sampleJson: string) => void;
  triggerAutoSave: () => void;
  handleStepTwoSubmit: (
    navigate: (opts: { to: string }) => void,
  ) => Promise<void>;
  handleEndpointUrlChange: (apiId: string, inputUrl: string) => void;
  applyTemplateSuggestions: (
    apiId: string,
    field: "apiQueryParams" | "apiHeaders" | "apiRequestBody",
    industry: string,
    apiName: string,
    method: string,
  ) => void;
}

export interface ParamRow {
  id: string;
  key: string;
  value: string;
  isDynamic: boolean;
}

export interface PostmanTableEditorProps {
  api: ApiConnection;
  field: "apiQueryParams" | "apiHeaders" | "apiRequestBody";
  title: string;
  description: string;
  showDynamicToggle?: boolean;
  colors: Record<string, string>;
  updateApiField: (
    id: string,
    field: keyof ApiConnection,
    value: string,
  ) => void;
  stepOneData?: StepOneData;
}
