import express from "express";
import { PostrequireAuth } from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const CompanyLoginRoutes = express.Router();

CompanyLoginRoutes.post("/login", PostrequireAuth);
