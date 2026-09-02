import mongoose from "mongoose";

export const ApiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    mcpToolName: { type: String },
    mcpDescription: { type: String },

    baseUrl: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, default: "GET" },

    authType: { type: String },

    headers: { type: [mongoose.Schema.Types.Mixed], default: [] },

    params: { type: [mongoose.Schema.Types.Mixed], default: [] },

    body: { type: [mongoose.Schema.Types.Mixed], default: [] },

    apiKey: { type: String },
    authHeader: { type: String },
    bearerToken: { type: String },

    oauth: {
      tokenUrl: { type: String },
      clientId: { type: String },
      clientSecret: { type: String },
    },

    platformType: { type: String, default: "web" },
    audience: { type: String, default: "" },

    isCheckout: { type: Boolean, default: false },
    webCheckoutUrl: { type: String },
    mobileDeepLinkUrl: { type: String },
    // Legacy field name kept so previously-saved APIs still resolve.
    mobileDeepLink: { type: String },

    // Real-Time Live Data Stream (WebSocket / SSE)
    isRealtimeApi: { type: Boolean, default: false },
    streamUrl: { type: String },

    apiSchema: { type: mongoose.Schema.Types.Mixed },

    inputFieldMap: { type: [mongoose.Schema.Types.Mixed], default: [] },

    outputFieldMap: { type: [mongoose.Schema.Types.Mixed], default: [] },

    fallbackWidget: { type: String },

    mcpResourceUri: { type: String },

    testedonregister: { type: Boolean, default: false },
  },
  { _id: false, strict: false },
);
