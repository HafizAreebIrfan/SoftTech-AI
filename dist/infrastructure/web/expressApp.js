"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("../config/env");
const healthRoutes_1 = require("../../adapters/http/routes/root/healthRoutes");
const companyregisterroutes_1 = require("../../adapters/http/routes/companies/register/companyregisterroutes");
const companyforgetpasswordroute_1 = require("../../adapters/http/routes/companies/forget_password/companyforgetpasswordroute");
const error_1 = require("../middlewares/ErrorMiddleware/error");
const helmet_1 = require("../middlewares/SecurityMiddleware/helmet");
const companyloginroute_1 = require("../../adapters/http/routes/companies/login/companyloginroute");
const companylogoutroute_1 = require("../../adapters/http/routes/companies/logout/companylogoutroute");
const mcpRoutes_1 = require("../../adapters/http/routes/mcp/mcpRoutes");
const buildApp = () => {
    const app = (0, express_1.default)();
    (0, helmet_1.helmetMiddleware)(app);
    app.set("trust proxy", 1);
    app.use((0, cors_1.default)({
        origin: env_1.env.CORS_ORIGINS,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use((req, res, next) => {
        console.log(req.path, req.method);
        next();
    });
    app.use("/", healthRoutes_1.healthRoutes);
    app.use("/api/companies", companyregisterroutes_1.CompanyRoutes);
    app.use("/api/company", companyloginroute_1.CompanyLoginRoutes);
    app.use("/api/company", companylogoutroute_1.CompanyLogoutRoutes);
    app.use("/api/company", companyforgetpasswordroute_1.CompanyForgetPasswordRoutes);
    app.use("/mcp", mcpRoutes_1.mcpRoutes);
    app.use(error_1.errorMiddleware);
    return app;
};
exports.buildApp = buildApp;
