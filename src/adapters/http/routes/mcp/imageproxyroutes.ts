import express from "express";
import { imageProxyController } from "../../controllers/mcp/imageproxycontroller";

export const ImageRoutes = express.Router();

ImageRoutes.get("/image-proxy", imageProxyController);
