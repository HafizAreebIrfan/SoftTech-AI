import path from "path";
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "../config/env";
import { healthRoutes } from "../../adapters/http/routes/root/healthRoutes";
import { CompanyRoutes } from "../../adapters/http/routes/companies/register/companyregisterroutes";
import { CompanyForgetPasswordRoutes } from "../../adapters/http/routes/companies/forget_password/companyforgetpasswordroute";
import { errorMiddleware } from "../middlewares/ErrorMiddleware/error";
import { helmetMiddleware } from "../middlewares/SecurityMiddleware/helmet";
import { CompanyLoginRoutes } from "../../adapters/http/routes/companies/login/companyloginroute";
import { CompanyLogoutRoutes } from "../../adapters/http/routes/companies/logout/companylogoutroute";
import { mcpRoutes } from "../../adapters/http/routes/mcp/mcpRoutes";
import { ImageRoutes } from "../../adapters/http/routes/mcp/imageproxyroutes";
import { adminRoutes } from "../../adapters/http/routes/admin/adminRoutes";
import { AdminDashboardRoutes } from "../../adapters/http/routes/admin/adminDashboardRoutes";
import AdminLogsRoutes from "../../adapters/http/routes/admin/adminLogsRoutes";
import SystemHealthRoutes from "../../adapters/http/routes/admin/systemHealthRoutes";
import adminAuditMiddleware from "../middlewares/AdminMiddleware/adminAudit";
import { incrementRequestCount } from "../../adapters/http/controllers/admin/systemHealthController";
import {
  apiLimiter,
  authLimiter,
  mcpLimiter,
} from "../middlewares/RateLimitMiddleware/rateLimiter";
import oauthRoutes from "../routes/oauthRoutes";

export const buildApp = (): Express => {
  const app = express();
  helmetMiddleware(app);

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      exposedHeaders: ["x-new-token", "x-new-refresh-token"],
    }),
  );

  app.use(
    express.json({
      limit: "50mb",
    }),
  );
  app.use(cookieParser());
  app.use(
    "/assets",
    express.static(path.join(process.cwd(), "todo-widget/dist/assets")),
  );

  app.use((req, res, next) => {
    console.log(req.path, req.method);
    incrementRequestCount();
    next();
  });

  // Rate Limiting Middlewares
  app.use("/api/company/login", authLimiter);
  app.use("/api/company/forgot-password", authLimiter);
  app.use("/api", apiLimiter);
  app.use("/mcp", mcpLimiter);

  // Application Routes
  app.use("/", healthRoutes);

  // OpenAPI & Swagger JSON endpoints for ChatGPT Actions & MCP tools
  const openApiPath = path.join(process.cwd(), "openapi.json");
  app.get("/openapi.json", (req, res) => {
    res.sendFile(openApiPath);
  });
  app.get("/swagger.json", (req, res) => {
    res.sendFile(openApiPath);
  });
  app.use("/api/companies", CompanyRoutes);
  app.use("/api/company", CompanyLoginRoutes);
  app.use("/api/company", CompanyLogoutRoutes);
  app.use("/api/company", CompanyForgetPasswordRoutes);

  // Admin Routes & Audit
  app.use("/api/admin", adminAuditMiddleware);
  app.use("/api/admin", SystemHealthRoutes);
  app.use("/api/admin", AdminLogsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", AdminDashboardRoutes);

  // MCP & Ecosystem Routes
  app.use("/mcp", mcpRoutes);
  app.use("/api/images", ImageRoutes);
  app.use("/api/oauth", oauthRoutes);

  app.use(errorMiddleware);

  return app;
};
