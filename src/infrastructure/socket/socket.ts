import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { env } from "../config/env";

export const SocketServer = (server: http.Server): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["https://softtech-ai.vercel.app", "http://localhost:5173"],
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
