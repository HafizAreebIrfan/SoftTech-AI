import express from "express";
import {
  PostrequireAuth,
  GetrequireAuth,
  authenticateToken,
} from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";
import { validateRequest } from "../../../../../infrastructure/middlewares/ValidationMiddleware/validation";
import { loginSchema } from "../../../../../infrastructure/middlewares/ValidationMiddleware/schemas";

export const CompanyLoginRoutes = express.Router();

CompanyLoginRoutes.post("/login", validateRequest(loginSchema), PostrequireAuth);
CompanyLoginRoutes.get("/login", authenticateToken, GetrequireAuth);
CompanyLoginRoutes.get("/verify-session", authenticateToken, GetrequireAuth);
