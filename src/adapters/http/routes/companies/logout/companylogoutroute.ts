import express from "express";
import {
  LogoutUser,
  authenticateToken,
} from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const CompanyLogoutRoutes = express.Router();

CompanyLogoutRoutes.post("/logout", authenticateToken, LogoutUser);
