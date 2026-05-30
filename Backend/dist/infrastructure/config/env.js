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
    MONGO_URI: process.env.MONGO_URI || "",
    CORS_ORIGINS: ["http://localhost:5173", "http://localhost:5174"],
    JWT_SECRET: process.env.JWT_SECRET || "",
};
