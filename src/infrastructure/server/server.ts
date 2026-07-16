import http from "http";
import { env } from "../config/env";
import { buildApp } from "../web/expressApp";
import { connectDB } from "../database/db";
import { SocketServer } from "../socket/socket";

export const startServer = async (): Promise<http.Server> => {
  await connectDB();

  const app = buildApp();
  const server = http.createServer(app);

  SocketServer(server);

  server.listen(env.PORT, () => {
    console.log("Server running on PORT:", env.PORT);
  });

  return server;
};

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed to start server:", message);
  process.exit(1);
});
