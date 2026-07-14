"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const envPath = path_1.default.resolve(process.cwd(), ".env");
dotenv_1.default.config({ path: envPath, override: true });
exports.env = {
    PORT: process.env.PORT || 4100,
    MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    CORS_ORIGINS: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
        : [
            "https://softtech-ai-app.onrender.com",
            "https://softtech-ai.onrender.com",
            "http://localhost:5173",
            "http://localhost:4000",
        ],
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM: process.env.MAIL_FROM,
    WEATHERAPIKEY: process.env.WEATHERAPIKEY || "",
    AIRQUALITYAPIKEY: process.env.AIRQUALITYAPIKEY || "",
    WEATHERWAY_MCP_URL: process.env.WEATHERWAY_MCP_URL || "",
};
