"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
};
