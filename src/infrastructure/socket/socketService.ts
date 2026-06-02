import { io, Socket } from "socket.io-client";
import { env } from "../config/env";

const SOCKET_URL = window.location.hostname === "localhost"
  ? env.devServer
  : env.devServer;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});
