import dotenv from "dotenv";
dotenv.config();

export interface IEnv {
  PORT: string | number;
  MONGO_URI: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string[];
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
};
