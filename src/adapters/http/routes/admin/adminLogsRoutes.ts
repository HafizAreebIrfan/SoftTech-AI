import express from "express";
import {
  createActivityLogController,
  getActivityLogsController,
} from "../../controllers/admin/activityLogController";
import { requireAdmin } from "../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const AdminLogsRoutes = express.Router();

// Enforce JWT authentication and admin role authorization
AdminLogsRoutes.use(requireAdmin);

AdminLogsRoutes.post("/logs", createActivityLogController);
AdminLogsRoutes.get("/logs", getActivityLogsController);

export default AdminLogsRoutes;
