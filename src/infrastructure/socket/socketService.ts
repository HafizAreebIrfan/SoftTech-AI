import { io, Socket } from "socket.io-client";
import { env } from "../config/env";

export const socket: Socket = io(env.socketUrl, {
  autoConnect: false,
  withCredentials: true,
});
