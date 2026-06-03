"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parseCorsOrigins = (raw) => {
    if (!raw) {
        return ["http://localhost:5173", "https://softtech-ai.vercel.app"];
    }
    return raw.split(",").map(origin => {
        let clean = origin.trim();
        // Remove wrapping quotes if entered literally (e.g. 'http://...' or "http://...")
        clean = clean.replace(/^['"]|['"]$/g, "");
        // Fix duplicate protocol (e.g. https://https://...)
        clean = clean.replace(/^https?:\/\/https?:\/\//i, "https://");
        // Remove trailing slash (e.g. http://localhost:5173/ -> http://localhost:5173)
        clean = clean.replace(/\/$/, "");
        return clean;
    });
};
exports.env = {
    PORT: process.env.PORT || 4100,
    MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "",
    CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
    JWT_SECRET: process.env.JWT_SECRET || "",
};
