"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRoutes = void 0;
const express_1 = __importDefault(require("express"));
const mcptransportlayer_1 = require("../../controllers/mcp/mcptransportlayer");
exports.mcpRoutes = express_1.default.Router();
exports.mcpRoutes.get("/:mcpSlug", mcptransportlayer_1.McpTransportLayer);
exports.mcpRoutes.post("/:mcpSlug", mcptransportlayer_1.McpTransportLayer);
exports.mcpRoutes.delete("/:mcpSlug", mcptransportlayer_1.McpTransportLayer);
