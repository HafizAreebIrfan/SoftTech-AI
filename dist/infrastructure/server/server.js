"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const http_1 = __importDefault(require("http"));
const env_1 = require("../config/env");
const expressApp_1 = require("../web/expressApp");
const db_1 = require("../database/db");
const socket_1 = require("../socket/socket");
const startServer = async () => {
    await (0, db_1.connectDB)();
    const app = (0, expressApp_1.buildApp)();
    const server = http_1.default.createServer(app);
    (0, socket_1.SocketServer)(server);
    server.listen(env_1.env.PORT, () => {
        console.log("Server running on PORT:", env_1.env.PORT);
    });
    return server;
};
exports.startServer = startServer;
(0, exports.startServer)().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to start server:", message);
    process.exit(1);
});
