"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const SocketServer = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.CORS_ORIGINS,
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("Socket connected from backend", socket.id);
        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected from backend", socket.id, reason);
        });
    });
    return io;
};
exports.SocketServer = SocketServer;
