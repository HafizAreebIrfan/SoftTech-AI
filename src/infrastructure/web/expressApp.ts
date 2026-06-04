import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "../config/env";
import { healthRoutes } from "../../adapters/http/routes/root/healthRoutes";
import { CompanyRoutes } from "../../adapters/http/routes/companies/register/companyregisterroutes";
import { errorMiddleware } from "../middlewares/ErrorMiddleware/error";
import { helmetMiddleware } from "../middlewares/SecurityMiddleware/helmet";
import { CompanyLoginRoutes } from "../../adapters/http/routes/companies/login/companyloginroute";
import { CompanyLogoutRoutes } from "../../adapters/http/routes/companies/logout/companylogoutroute";

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

  app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
  });

  app.use("/", healthRoutes);
  app.use("/api/companies", CompanyRoutes);
  app.use("/api/company", CompanyLoginRoutes);
  app.use("/api/company", CompanyLogoutRoutes);

  app.use(errorMiddleware);

  return app;
};
