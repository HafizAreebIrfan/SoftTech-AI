import mongoose from "mongoose";

export const ApiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mcpToolName: { type: String },
    mcpDescription: { type: String },
    baseUrl: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, default: "GET" },
    authType: { type: String, default: "NONE" },
    headers: [{ type: String }],
    params: [{ type: String }],
    apiKey: { type: String },
    AuthHeader: { type: String },
    oauthTokenUrl: { type: String },
    oauthClientId: { type: String },
    oauthClientSecret: { type: String },
    bearerToken: { type: String },
    inputFieldMap: { type: mongoose.Schema.Types.Mixed },
    outputFieldMap: { type: mongoose.Schema.Types.Mixed },
    sampleResponse: { type: mongoose.Schema.Types.Mixed },
    fallbackWidget: { type: mongoose.Schema.Types.Mixed },
    mcpResourceUri: { type: String },
    testedonregister: { type: Boolean, default: false },
  },
  { _id: false },
);
