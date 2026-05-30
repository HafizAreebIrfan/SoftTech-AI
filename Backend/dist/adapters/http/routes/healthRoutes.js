"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const healthController_1 = require("../controllers/healthController");
exports.healthRoutes = express_1.default.Router();
exports.healthRoutes.get("/", healthController_1.getHealthController);
