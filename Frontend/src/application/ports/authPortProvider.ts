import { localhostAuthApiAdapter } from "../../adapters/api/authLocalhostAdapter";
import { realAuthApiAdapter } from "../../adapters/api/authApiAdapter";
import { env } from "../../infrastructure/config/env";

export const authPort = env.authApiMode === "localhost"
  ? localhostAuthApiAdapter
  : realAuthApiAdapter;
