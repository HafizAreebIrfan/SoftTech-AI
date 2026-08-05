import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SignupStore, ParamRow } from "../../interfaces/signup.interface";
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

export const parseJsonToRows = (
  jsonStr: string | undefined,
  defaultDynamic: boolean = true,
): ParamRow[] => {
  if (!jsonStr || !jsonStr.trim()) {
    return [{ id: `row-${Date.now()}-0`, key: "", value: "", isDynamic: defaultDynamic }];
  }
  try {
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return [{ id: `row-${Date.now()}-0`, key: "", value: "", isDynamic: defaultDynamic }];
      }
      return parsed.map((item, idx) => ({
        id: `row-${Date.now()}-${idx}`,
        key: String(item.key ?? item.name ?? ""),
        value: String(item.value ?? ""),
        isDynamic: item.isDynamic !== undefined ? Boolean(item.isDynamic) : defaultDynamic,
      }));
    }

    if (typeof parsed === "object" && parsed !== null) {
      const entries = Object.entries(parsed);
      if (entries.length === 0) {
        return [{ id: `row-${Date.now()}-0`, key: "", value: "", isDynamic: defaultDynamic }];
      }
      return entries.map(([k, v], idx) => {
        const valStr = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
        return {
          id: `row-${Date.now()}-${idx}`,
          key: k,
          value: valStr,
          isDynamic: defaultDynamic,
        };
      });
    }
  } catch (e) {
    // Ignore invalid JSON while user is typing
  }
  return [{ id: `row-${Date.now()}-0`, key: "", value: "", isDynamic: defaultDynamic }];
};

export const rowsToJsonStr = (rows: ParamRow[]): string => {
  const obj: Record<string, any> = {};
  rows.forEach((row) => {
    const trimmedKey = row.key.trim();
    if (trimmedKey) {
      obj[trimmedKey] = row.value.trim();
    }
  });
  return JSON.stringify(obj, null, 2);
};

export const truncateSampleResponse = (
  jsonStr: string | undefined,
  maxChars: number = 8000,
): string => {
  if (!jsonStr || !jsonStr.trim()) return "";
  if (jsonStr.length <= maxChars) return jsonStr;

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      const sample = parsed.slice(0, 3);
      return JSON.stringify(sample, null, 2);
    } else if (typeof parsed === "object" && parsed !== null) {
      const sampleObj: Record<string, any> = {};
      Object.entries(parsed).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          sampleObj[k] = v.slice(0, 3);
        } else {
          sampleObj[k] = v;
        }
      });
      const str = JSON.stringify(sampleObj, null, 2);
      return str.length > maxChars ? str.substring(0, maxChars) : str;
    }
  } catch {
    // Ignore non-json
  }
  return jsonStr.substring(0, maxChars);
};

export const getSuggestionTemplate = (
  industry: string,
  apiName: string,
  method: string,
): Record<string, any> => {
  const ind = (industry || "").toLowerCase();
  const m = (method || "GET").toUpperCase();

  if (ind.includes("travel") || ind.includes("booking")) {
    if (m === "GET") {
      return { search: "", status: "active", category: "", sortBy: "title", limit: 10, page: 1 };
    }
    return { name: "", phone: "", email: "", packageName: "", bookingDate: "", notes: "" };
  } else if (ind.includes("ecommerce") || ind.includes("e-commerce")) {
    if (m === "GET") {
      return { search: "", category: "", status: "", sortBy: "price_asc", limit: 20, page: 1 };
    }
    return { customerName: "", email: "", productId: "", quantity: 1, totalAmount: 0.0, shippingAddress: "" };
  } else if (ind.includes("food") || ind.includes("hospitality")) {
    if (m === "GET") {
      return { search: "", category: "", available: true, limit: 20, page: 1 };
    }
    return { customerName: "", phoneNumber: "", address: "", items: [{ itemId: "", quantity: 1 }], notes: "" };
  } else if (ind.includes("logistics")) {
    if (m === "GET") {
      return { search: "", status: "in-transit", limit: 10, page: 1 };
    }
    return { sender: "", recipient: "", origin: "", destination: "", weight: "" };
  }

  if (m === "GET") {
    return { search: "", limit: 20, page: 1 };
  }
  return { title: "", description: "" };
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

          let paramsObj: Record<string, any> = {};
          if (api.apiQueryParams) {
            try {
              const trimmed = api.apiQueryParams.trim();
              if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                  parsed.forEach((item: any) => {
                    if (item && item.key) {
                      paramsObj[item.key] = item.value;
                    }
                  });
                } else if (typeof parsed === "object" && parsed !== null) {
                  paramsObj = parsed;
                }
              } else {
                const pairs = trimmed.split(/[\n&]/);
                pairs.forEach((pair) => {
                  const idx = pair.indexOf(":");
                  if (idx !== -1) {
                    const k = pair.substring(0, idx).trim();
                    const v = pair.substring(idx + 1).trim();
                    if (k) paramsObj[k] = v;
                  } else {
                    const eqIdx = pair.indexOf("=");
                    if (eqIdx !== -1) {
                      const k = pair.substring(0, eqIdx).trim();
                      const v = pair.substring(eqIdx + 1).trim();
                      if (k) paramsObj[k] = v;
                    }
                  }
                });
              }
            } catch (e) {
              // Ignore
            }
          }

          if (api.apiMethod !== "GET" && api.apiMethod !== "DELETE") {
            options.body = JSON.stringify(paramsObj);
          }

          let testUrl = api.apiEndpoint;
          
          // Replace path parameters (e.g. :id or :packageId)
          Object.entries(paramsObj).forEach(([k, v]) => {
            if (testUrl.includes(`:${k}`)) {
              testUrl = testUrl.replace(`:${k}`, String(v));
            }
          });

          if ((api.apiMethod === "GET" || api.apiMethod === "DELETE") && api.apiQueryParams) {
            try {
              let rawUrl = testUrl;
              const hasProtocol = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
              if (!hasProtocol) {
                rawUrl = "https://" + rawUrl;
              }
              const urlObj = new URL(rawUrl);

              Object.entries(paramsObj).forEach(([k, v]) => {
                if (v !== undefined && v !== null && !api.apiEndpoint.includes(`:${k}`)) {
                  urlObj.searchParams.set(k, String(v));
                }
              });

              testUrl = hasProtocol ? urlObj.toString() : urlObj.toString().replace("https://", "");
            } catch (e) {
              // Fallback
            }
          }

          const start = performance.now();
          const fetchUrl = testUrl.startsWith("http://") || testUrl.startsWith("https://")
            ? testUrl
            : `https://${testUrl}`;
          const response = await fetch(fetchUrl, options);
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

          let recommendationLogs = "";
          try {
            const urlObj = new URL(api.apiEndpoint);
            const urlParams = Array.from(urlObj.searchParams.keys());
            if (urlParams.length > 0) {
              recommendationLogs += `\n💡 RECOMMENDATION: We detected these query parameters in your URL: [${urlParams.join(", ")}].\nYou can specify them in the 'Query Parameters' field so our AI can dynamically control them.\n`;
            }
          } catch {
            // Ignore if endpoint is not a fully valid URL string
          }

          if (response.status === 401 || response.status === 403) {
            recommendationLogs += `\n⚠️ WARNING: Status ${response.status} (Unauthorized/Forbidden).\nIt appears this API requires authentication (e.g. Bearer Token, API Key, Client Credentials or Custom Headers).\nPlease select an 'Auth Type' or add the required headers to authenticate successfully.\n`;
          } else if (response.status === 405) {
            recommendationLogs += `\n⚠️ WARNING: Status 405 (Method Not Allowed).\nVerify if you should use another HTTP method (e.g. GET vs POST).\n`;
          } else if (response.ok && Array.isArray(parsedJson) && parsedJson.length === 0) {
            recommendationLogs += `\n💡 TIP: The API returned an empty list. If this API requires filter parameters (like status or search query) to return data, make sure they are set.\n`;
          }

          set((state) => ({
            apisList: state.apisList.map((a) =>
              a.id === apiId ? { ...a, sampleresponse: formattedJson } : a,
            ),
            apiTestStates: {
              ...state.apiTestStates,
              [apiId]: {
                status: response.ok ? "success" : "error",
                sampleResponse: formattedJson,
                logs:
                  (state.apiTestStates[apiId]?.logs || "") +
                  `[${new Date().toLocaleTimeString()}] Response Status: ${response.status} ${response.statusText}\n` +
                  `[${new Date().toLocaleTimeString()}] Latency: ${duration}ms\n` +
                  recommendationLogs +
                  `[${new Date().toLocaleTimeString()}] Response Body:\n${formattedJson}`,
              },
            },
          }));
        } catch (err: any) {
          let suggestion = "";
          if (err.name === "TypeError" && err.message?.toLowerCase().includes("failed to fetch")) {
            suggestion = `\n⚠️ SUGGESTION: Connection failed or was blocked by CORS.\n` +
              `1. Make sure your local/remote server is running and the URL is correct.\n` +
              `2. Ensure your server permits Cross-Origin Requests (CORS) from 'softtechai.com' or localhost.\n` +
              `3. Verify if your API requires specific query parameters, headers, or a Bearer token.`;
          } else {
            suggestion = `\n⚠️ SUGGESTION: This might be due to CORS restrictions or wrong network configurations. If the API doesn't support CORS from local browser origins, the test request will fail locally, but the configuration is still valid for the server-side MCP bridge.`;
          }

          set((state) => ({
            apiTestStates: {
              ...state.apiTestStates,
              [apiId]: {
                status: "error",
                logs:
                  (state.apiTestStates[apiId]?.logs || "") +
                  `[${new Date().toLocaleTimeString()}] Error: ${err.message || err}\n` +
                  `[${new Date().toLocaleTimeString()}] ${suggestion}`,
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

              const paramRows = parseJsonToRows(api.apiQueryParams, true).filter((r) => r.key.trim() !== "");
              const paramsArray = paramRows.map((r) => ({
                key: r.key.trim(),
                value: r.value.trim(),
                isDynamic: Boolean(r.isDynamic),
              }));

              const headerRows = parseJsonToRows(api.apiHeaders, false).filter((r) => r.key.trim() !== "");
              const headersArray = headerRows.map((r) => ({
                key: r.key.trim(),
                value: r.value.trim(),
              }));

              const sampleResp = get().apiTestStates[api.id]?.sampleResponse || api.sampleresponse || "";

              const isBodyMethod = api.apiMethod === "POST" || api.apiMethod === "PUT" || api.apiMethod === "PATCH";

              return {
                name: api.apiName,
                method: api.apiMethod,
                baseUrl: getBaseUrl(api.apiEndpoint),
                endpoint: getEndpointPath(api.apiEndpoint),
                authType: api.apiAuthType,
                authtype: api.apiAuthType,
                headers: headersArray,
                params: isBodyMethod ? [] : paramsArray,
                body: isBodyMethod ? paramsArray : [],
                sampleresponse: sampleResp,
                sampleResponse: sampleResp,
                testedonregister: get().apiTestStates[api.id]?.status === "success",
                platformType: api.platformType || "web",
                webCheckoutUrl: api.webCheckoutUrl || api.apiCheckoutTemplate || undefined,
                mobileDeepLink: api.mobileDeepLink || undefined,
                apiSchema: api.apiSchema || api.schema || undefined,
                schema: api.apiSchema || api.schema || undefined,
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

            const paramRows = parseJsonToRows(api.apiQueryParams, true).filter((r) => r.key.trim() !== "");
            const paramsArray = paramRows.map((r) => ({
              key: r.key.trim(),
              value: r.value.trim(),
              isDynamic: Boolean(r.isDynamic),
            }));

            const headerRows = parseJsonToRows(api.apiHeaders, false).filter((r) => r.key.trim() !== "");
            const headersArray = headerRows.map((r) => ({
              key: r.key.trim(),
              value: r.value.trim(),
            }));

            const sampleResp = get().apiTestStates[api.id]?.sampleResponse || api.sampleresponse || "";

            const isBodyMethod = api.apiMethod === "POST" || api.apiMethod === "PUT" || api.apiMethod === "PATCH";

            return {
              name: api.apiName,
              method: api.apiMethod,
              baseUrl: getBaseUrl(api.apiEndpoint),
              endpoint: getEndpointPath(api.apiEndpoint),
              authType: api.apiAuthType,
              authtype: api.apiAuthType,
              headers: headersArray,
              params: isBodyMethod ? [] : paramsArray,
              body: isBodyMethod ? paramsArray : [],
              sampleresponse: sampleResp,
              sampleResponse: sampleResp,
              testedonregister: get().apiTestStates[api.id]?.status === "success",
              platformType: api.platformType || "web",
              webCheckoutUrl: api.webCheckoutUrl || api.apiCheckoutTemplate || undefined,
              mobileDeepLink: api.mobileDeepLink || undefined,
              apiSchema: api.apiSchema || api.schema || undefined,
              schema: api.apiSchema || api.schema || undefined,
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
      handleEndpointUrlChange: (apiId: string, inputUrl: string) => {
        const { apisList, updateApiField } = get();
        const api = apisList.find((a) => a.id === apiId);
        if (!api) return;

        if (inputUrl.includes("?")) {
          const [baseUrl, queryString] = inputUrl.split("?");
          const params = new URLSearchParams(queryString);
          const existingRows = parseJsonToRows(api.apiQueryParams, true).filter(
            (r) => r.key.trim() !== "",
          );
          let addedCount = 0;

          params.forEach((val, key) => {
            const existingIndex = existingRows.findIndex((r) => r.key === key);
            if (existingIndex >= 0) {
              existingRows[existingIndex].value = val;
            } else {
              existingRows.push({
                id: `row-${Date.now()}-${addedCount}`,
                key: key,
                value: val,
                isDynamic: true,
              });
            }
            addedCount++;
          });

          const cleanedBaseUrl = baseUrl.replace(/^https?:\/\//, "");
          updateApiField(apiId, "apiEndpoint", "https://" + cleanedBaseUrl);
          updateApiField(apiId, "apiQueryParams", rowsToJsonStr(existingRows));

          if (addedCount > 0) {
            showToast(
              `Auto-extracted ${addedCount} query parameter(s) from URL into Params tab!`,
              "success",
            );
          }
        } else {
          updateApiField(
            apiId,
            "apiEndpoint",
            "https://" + inputUrl.replace(/^https?:\/\//, ""),
          );
        }
      },
      applyTemplateSuggestions: (apiId, field, industry, apiName, method) => {
        const { updateApiField } = get();
        const template = getSuggestionTemplate(industry, apiName, method);
        const rows: ParamRow[] = Object.entries(template).map(([k, v], idx) => ({
          id: `row-${Date.now()}-${idx}`,
          key: k,
          value: String(v ?? ""),
          isDynamic: true,
        }));
        updateApiField(apiId, field, rowsToJsonStr(rows));
        showToast("Applied industry template suggestions!", "success");
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
