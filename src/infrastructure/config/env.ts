import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

export interface IEnv {
  PORT: string | number;
  MONGO_URI: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string[];
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  MAIL_FROM?: string;
  GEMINI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  GROQ_API_KEY: string;
  OAUTH_CALLBACK_URL: string;
}

export const env: IEnv = {
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
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OAUTH_CALLBACK_URL:
    process.env.OAUTH_CALLBACK_URL ||
    "https://softtech-ai.onrender.com/api/oauth/callback",
};
