import express from "express";
import { getSystemHealthController } from "../../../controllers/admin/systemHealthController";

export const SystemHealthRoutes = express.Router();

SystemHealthRoutes.get("/system-health", getSystemHealthController);

export default SystemHealthRoutes;
