"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.ApiSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
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
}, { _id: false });
