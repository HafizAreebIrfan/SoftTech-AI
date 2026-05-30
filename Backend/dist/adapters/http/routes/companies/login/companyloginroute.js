"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyLoginRoutes = void 0;
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware");
exports.CompanyLoginRoutes = express_1.default.Router();
exports.CompanyLoginRoutes.post("/login", authmiddleware_1.PostrequireAuth);
