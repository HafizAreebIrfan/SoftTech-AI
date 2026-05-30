"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmetMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const helmetMiddleware = (app) => {
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'trusted-cdn.com'"],
                styleSrc: ["'self'", "'trusted-cdn.com'"],
                imgSrc: ["'self'", "data:", "https:"]
            },
        },
        frameguard: { action: "deny" },
        hsts: { maxAge: 31536000, includeSubDomains: true },
        noSniff: true,
        referrerPolicy: { policy: 'no-referrer' },
    }));
};
exports.helmetMiddleware = helmetMiddleware;
