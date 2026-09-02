import express from "express";
import { createActivityLogController, getActivityLogsController } from "../../../controllers/admin/activityLogController";

export const AdminLogsRoutes = express.Router();

AdminLogsRoutes.post("/logs", createActivityLogController);
AdminLogsRoutes.get("/logs", getActivityLogsController);

export default AdminLogsRoutes;
