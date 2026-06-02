import express from "express";
import { LogoutUser } from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const CompanyLogoutRoutes = express.Router();

CompanyLogoutRoutes.post("/logout", LogoutUser);
