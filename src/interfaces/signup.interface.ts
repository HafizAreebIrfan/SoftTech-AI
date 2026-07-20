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

export interface StepOneData {
  companyName: string;
  adminEmail: string;
  password?: string;
  subdomain: string;
  primaryIndustry: string;
}

export interface SignupStore {
  companyId: string | null;
  stepOneData: StepOneData;
  apisList: ApiConnection[];
  selectedLayout: "dashboard" | "catalog" | "table" | "timeline" | "grid" | "list" | "cards";
  apiTestStates: Record<string, { status: "idle" | "loading" | "success" | "error"; logs: string }>;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isStepTwoPending: boolean;

  setCompanyId: (id: string | null) => void;
  setStepOneData: (data: Partial<StepOneData>) => void;
  setApisList: (apis: ApiConnection[] | ((prev: ApiConnection[]) => ApiConnection[])) => void;
  updateApiField: (id: string, field: keyof ApiConnection, value: string) => void;
  handleAddApi: () => void;
  handleDeleteApi: (id: string) => void;
  setSelectedLayout: (layout: "dashboard" | "catalog" | "table" | "timeline" | "grid" | "list" | "cards") => void;
  clearSignupProgress: () => void;
  handleTestApi: (api: ApiConnection) => Promise<void>;
  triggerAutoSave: () => void;
  handleStepTwoSubmit: (navigate: (opts: { to: string }) => void) => Promise<void>;
}
