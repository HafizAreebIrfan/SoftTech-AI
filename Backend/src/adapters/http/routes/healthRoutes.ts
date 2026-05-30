import express from "express";
import { getHealthController } from "../controllers/healthController";

export const healthRoutes = express.Router();

healthRoutes.get("/", getHealthController);
