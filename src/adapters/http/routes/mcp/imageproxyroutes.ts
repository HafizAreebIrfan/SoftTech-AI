import express from "express";
import { imageProxyController } from "../../controllers/mcp/imageproxycontroller";

export const ImageRoutes = express.Router();

ImageRoutes.options("/image-proxy", imageProxyController);
ImageRoutes.get("/image-proxy", imageProxyController);
