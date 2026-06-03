"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyLoginRoutes = void 0;
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware");
const validation_1 = require("../../../../../infrastructure/middlewares/ValidationMiddleware/validation");
const schemas_1 = require("../../../../../infrastructure/middlewares/ValidationMiddleware/schemas");
exports.CompanyLoginRoutes = express_1.default.Router();
exports.CompanyLoginRoutes.post("/login", (0, validation_1.validateRequest)(schemas_1.loginSchema), authmiddleware_1.PostrequireAuth);
exports.CompanyLoginRoutes.get("/login", authmiddleware_1.GetrequireAuth);
