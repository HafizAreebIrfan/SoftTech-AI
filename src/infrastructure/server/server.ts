import http from "http";
import { env } from "../config/env";
import { buildApp } from "../web/expressApp";
import { connectDB } from "../database/db";

export const startServer = async (): Promise<http.Server> => {
  await connectDB();

  const app = buildApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log("Server running on PORT:", env.PORT);
  });

  return server;
};

startServer().catch((error: any) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
