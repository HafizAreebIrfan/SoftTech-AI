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
import { AdminDashboardRoutes } from "../../adapters/http/routes/companies/admin/adminDashboardRoutes";
import AdminLogsRoutes from "../../adapters/http/routes/companies/admin/adminLogsRoutes";
import SystemHealthRoutes from "../../adapters/http/routes/companies/admin/systemHealthRoutes";
import adminAuditMiddleware from "../middlewares/AdminMiddleware/adminAudit";
import { incrementRequestCount } from "../../adapters/http/controllers/admin/systemHealthController";

export const buildApp = (): Express => {
  const app = express();
  helmetMiddleware(app);

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use("/assets", express.static(path.join(process.cwd(), "todo-widget/dist/assets")));

  app.use((req, res, next) => {
    console.log(req.path, req.method);
    incrementRequestCount();
    next();
  });

  app.use("/", healthRoutes);
  app.use("/api/companies", CompanyRoutes);
  app.use("/api/company", CompanyLoginRoutes);
  app.use("/api/company", CompanyLogoutRoutes);
  app.use("/api/company", CompanyForgetPasswordRoutes);
  // audit admin requests (non-blocking)
  app.use("/api/admin", adminAuditMiddleware);
  app.use("/api/admin", AdminDashboardRoutes);
  app.use("/api/admin", AdminLogsRoutes);
  app.use("/api/admin", SystemHealthRoutes);
  app.use("/mcp", mcpRoutes);

  app.use(errorMiddleware);

  return app;
};
