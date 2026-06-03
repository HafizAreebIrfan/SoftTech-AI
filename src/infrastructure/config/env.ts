import dotenv from "dotenv";
dotenv.config();

export interface IEnv {
  PORT: string | number;
  MONGO_URI: string;
  CORS_ORIGINS: string[];
  JWT_SECRET: string;
}

export const env: IEnv = {
  PORT: process.env.PORT || 4100,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  CORS_ORIGINS: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(",") 
    : ["http://localhost:5173", "https://softtech-ai.vercel.app"],
  JWT_SECRET: process.env.JWT_SECRET || "",
};
