import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SignupStore } from "../../interfaces/signup.interface";
import { saveCompanyApiDetails } from "../../adapters/api/authApi";
import { showToast } from "../../utils/toasts";

const getBaseUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return urlStr;
  }
};

const getEndpointPath = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return url.pathname + url.search;
  } catch (e) {
    return "/";
  }
};

let autoSaveTimer: any = null;

export const useSignupStore = create<SignupStore>()(
  persist(
    (set, get) => ({
      companyId: null,
      stepOneData: {
        companyName: "",
        adminEmail: "",
        password: "",
        subdomain: "",
        primaryIndustry: "saas",
      },
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
      selectedLayout: "dashboard",
      apiTestStates: {},
      saveStatus: "idle",
      isStepTwoPending: false,

      setCompanyId: (companyId) => set({ companyId }),
      setStepOneData: (data) =>
        set((state) => ({
          stepOneData: { ...state.stepOneData, ...data },
        })),
      setApisList: (apis) =>
        set((state) => ({
          apisList: typeof apis === "function" ? apis(state.apisList) : apis,
        })),
      updateApiField: (id, field, value) => {
        set((state) => ({
          apisList: state.apisList.map((api) =>
            api.id === id ? { ...api, [field]: value } : api,
          ),
        }));
        // Trigger auto save whenever a field is updated
        get().triggerAutoSave();
      },
      handleAddApi: () =>
        set((state) => ({
          apisList: [
            ...state.apisList,
            {
              id: `api-${Date.now()}`,
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
        })),
      handleDeleteApi: (id) =>
        set((state) => ({
          apisList:
            state.apisList.length > 1
              ? state.apisList.filter((api) => api.id !== id)
              : state.apisList,
        })),
      setSelectedLayout: (selectedLayout) => set({ selectedLayout }),
      clearSignupProgress: () =>
        set({
          companyId: null,
          stepOneData: {
            companyName: "",
            adminEmail: "",
            password: "",
            subdomain: "",
            primaryIndustry: "saas",
          },
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
          selectedLayout: "dashboard",
          apiTestStates: {},
          saveStatus: "idle",
          isStepTwoPending: false,
        }),

      handleTestApi: async (api) => {
        const apiId = api.id;
        if (!api.apiEndpoint || api.apiEndpoint === "https://") {
          showToast("Please enter a valid API URL first.", "error");
          return;
        }

        set((state) => ({
          apiTestStates: {
            ...state.apiTestStates,
            [apiId]: {
              status: "loading",
              logs: `[${new Date().toLocaleTimeString()}] Testing connection to ${api.apiEndpoint}...\nMethod: ${api.apiMethod}\nAuth Type: ${api.apiAuthType}\n`,
            },
          },
        }));

        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (api.apiAuthType === "Bearer Token" && api.apiCredentials) {
            headers["Authorization"] = `Bearer ${api.apiCredentials}`;
          } else if (api.apiAuthType === "API Key" && api.apiCredentials) {
            headers[api.apiAuthHeader || "X-API-Key"] = api.apiCredentials;
          }

          if (api.apiHeaders) {
            try {
              const customHeaders = JSON.parse(api.apiHeaders);
              Object.assign(headers, customHeaders);
            } catch {
              const lines = api.apiHeaders.split("\n");
              lines.forEach((line) => {
                const parts = line.split(":");
                if (parts.length >= 2) {
                  headers[parts[0].trim()] = parts.slice(1).join(":").trim();
                }
              });
            }
          }

          const options: RequestInit = {
            method: api.apiMethod,
            headers,
          };

          if (api.apiMethod !== "GET" && api.apiMethod !== "DELETE") {
            options.body = JSON.stringify({});
          }

          const start = performance.now();
          const response = await fetch(api.apiEndpoint, options);
          const duration = (performance.now() - start).toFixed(0);

          const responseText = await response.text();
          let parsedJson: any = null;
          try {
            parsedJson = JSON.parse(responseText);
          } catch {
            parsedJson = responseText;
          }

          const formattedJson =
            typeof parsedJson === "object"
              ? JSON.stringify(parsedJson, null, 2)
              : parsedJson;

          set((state) => ({
            apiTestStates: {
              ...state.apiTestStates,
              [apiId]: {
                status: response.ok ? "success" : "error",
                logs:
                  (state.apiTestStates[apiId]?.logs || "") +
                  `[${new Date().toLocaleTimeString()}] Response Status: ${response.status} ${response.statusText}\n` +
                  `[${new Date().toLocaleTimeString()}] Latency: ${duration}ms\n` +
                  `[${new Date().toLocaleTimeString()}] Response Body:\n${formattedJson}`,
              },
            },
          }));
        } catch (err: any) {
          set((state) => ({
            apiTestStates: {
              ...state.apiTestStates,
              [apiId]: {
                status: "error",
                logs:
                  (state.apiTestStates[apiId]?.logs || "") +
                  `[${new Date().toLocaleTimeString()}] Error: ${err.message || err}\n` +
                  `[${new Date().toLocaleTimeString()}] Suggestion: This might be due to CORS restrictions on the target API. If the API doesn't support CORS from local browser origins, the test request will fail locally, but the configuration is still valid for the server-side MCP bridge.`,
              },
            },
          }));
        }
      },

      triggerAutoSave: () => {
        const { companyId, apisList } = get();
        if (!companyId) return;
        if (apisList.length === 0) return;

        const allValid = apisList.every((api) => {
          const hasName = api.apiName.trim().length > 0;
          let hasValidUrl = false;
          try {
            const url = new URL(api.apiEndpoint);
            hasValidUrl = url.protocol === "https:" && url.hostname.length > 0;
          } catch (e) {
            hasValidUrl = false;
          }
          return hasName && hasValidUrl;
        });

        if (!allValid) {
          return;
        }

        if (autoSaveTimer) clearTimeout(autoSaveTimer);

        autoSaveTimer = setTimeout(async () => {
          set({ saveStatus: "saving" });
          try {
            const apisPayload = apisList.map((api) => {
              const isbearertoken =
                api.apiAuthType === "Bearer Token"
                  ? { bearerToken: api.apiCredentials }
                  : {};
              const isapikey =
                api.apiAuthType === "API Key"
                  ? {
                      apiKey: api.apiCredentials,
                      authHeader: api.apiAuthHeader,
                    }
                  : {};
              const isoauth =
                api.apiAuthType === "OAuth 2.0"
                  ? {
                      oauthTokenUrl: api.oauthTokenUrl,
                      oauthClientId: api.oauthClientId,
                      oauthClientSecret: api.apiCredentials,
                    }
                  : {};
              return {
                name: api.apiName,
                method: api.apiMethod,
                baseUrl: getBaseUrl(api.apiEndpoint),
                endpoint: getEndpointPath(api.apiEndpoint),
                authtype: api.apiAuthType,
                samplequery: api.apiQueryParams,
                authType: api.apiAuthType,
                headers: api.apiHeaders ? [api.apiHeaders] : [],
                params: api.apiQueryParams ? [api.apiQueryParams] : [],
                ...isbearertoken,
                ...isapikey,
                ...isoauth,
              };
            });

            const res = await saveCompanyApiDetails(companyId, apisPayload);
            if (res && res.success) {
              set({ saveStatus: "saved" });
              showToast("Auto saved successfully!", "success");
            } else {
              set({ saveStatus: "error" });
              showToast(res?.message || "Failed to save API details.", "error");
            }
          } catch (err: any) {
            set({ saveStatus: "error" });
            showToast("An error occurred during API details save.", "error");
          }
        }, 3000);
      },

      handleStepTwoSubmit: async (navigate) => {
        const { companyId, apisList } = get();
        if (!companyId) {
          showToast("Company ID is missing. Please restart signup.", "error");
          navigate({ to: "/signup/step1" });
          return;
        }

        set({ isStepTwoPending: true });

        try {
          const apisPayload = apisList.map((api) => {
            const isbearertoken =
              api.apiAuthType === "Bearer Token"
                ? { bearerToken: api.apiCredentials }
                : {};
            const isapikey =
              api.apiAuthType === "API Key"
                ? { apiKey: api.apiCredentials, authHeader: api.apiAuthHeader }
                : {};
            const isoauth =
              api.apiAuthType === "OAuth 2.0"
                ? {
                    oauthTokenUrl: api.oauthTokenUrl,
                    oauthClientId: api.oauthClientId,
                    oauthClientSecret: api.apiCredentials,
                  }
                : {};
            return {
              name: api.apiName,
              method: api.apiMethod,
              baseUrl: getBaseUrl(api.apiEndpoint),
              endpoint: getEndpointPath(api.apiEndpoint),
              authtype: api.apiAuthType,
              samplequery: api.apiQueryParams,
              authType: api.apiAuthType,
              headers: api.apiHeaders ? [api.apiHeaders] : [],
              params: api.apiQueryParams ? [api.apiQueryParams] : [],
              ...isbearertoken,
              ...isapikey,
              ...isoauth,
            };
          });

          const res = await saveCompanyApiDetails(companyId, apisPayload);
          set({ isStepTwoPending: false });
          if (res && res.success) {
            showToast("API configurations saved successfully!", "success");
            navigate({ to: "/signup/step3" });
          } else {
            showToast(res?.message || "Failed to save API details.", "error");
          }
        } catch (err: any) {
          set({ isStepTwoPending: false });
          showToast(err.message || "An error occurred during Step 2.", "error");
        }
      },
    }),
    {
      name: "softtech-signup-store",
      partialize: (state) => ({
        companyId: state.companyId,
        stepOneData: state.stepOneData,
        apisList: state.apisList,
        selectedLayout: state.selectedLayout,
      }),
    },
  ),
);
