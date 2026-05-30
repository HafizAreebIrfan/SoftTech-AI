import mongoose from "mongoose";

export const ApiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    baseUrl: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, default: "GET" },
    authType: { type: String, default: "NONE" },
    headers: [{ type: String }],
    params: [{ type: String }]
  },
  { _id: false },
);
