import express from "express";
import { getSystemHealthController } from "../../controllers/admin/systemHealthController";
import { requireAdmin } from "../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const SystemHealthRoutes = express.Router();

// Enforce JWT authentication and admin role authorization
SystemHealthRoutes.use(requireAdmin);

SystemHealthRoutes.get("/system-health", getSystemHealthController);
SystemHealthRoutes.get("/health", getSystemHealthController);

export default SystemHealthRoutes;
