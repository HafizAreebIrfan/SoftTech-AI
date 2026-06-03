import dotenv from "dotenv";
dotenv.config();

export interface IEnv {
  PORT: string | number;
  MONGO_URI: string;
  CORS_ORIGINS: string[];
  JWT_SECRET: string;
}

const parseCorsOrigins = (raw?: string): string[] => {
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

export const env: IEnv = {
  PORT: process.env.PORT || 4100,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
  JWT_SECRET: process.env.JWT_SECRET || "",
};
