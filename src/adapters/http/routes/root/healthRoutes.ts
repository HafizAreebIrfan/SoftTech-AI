import express from "express";
import { getHealthController } from "../../controllers/root/healthController";

export const healthRoutes = express.Router();

healthRoutes.get("/", getHealthController);
