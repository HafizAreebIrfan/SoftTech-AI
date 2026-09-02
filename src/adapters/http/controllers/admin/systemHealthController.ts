import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { env } from "../../../../infrastructure/config/env";

let startTime = Date.now();
let requestCount = 0;

export function incrementRequestCount(): void {
  requestCount++;
}

export async function getSystemHealthController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    const dbConnected = mongoose.connection.readyState === 1;

    const healthStatus = {
      success: true,
      message: "System health check",
      data: {
        status: dbConnected ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: uptime,
          formatted: formatUptime(uptime),
        },
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external),
        },
        database: {
          connected: dbConnected,
          status: getConnectionStatus(mongoose.connection.readyState),
        },
        requests: {
          total: requestCount,
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        environment: process.env.NODE_ENV || "development",
        port: env.PORT,
      },
    };

    res.status(dbConnected ? 200 : 503).json(healthStatus);
  } catch (error) {
    next(error);
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(" ") : "0s";
}

function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;

  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;

  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function getConnectionStatus(readyState: number): string {
  const states: { [key: number]: string } = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[readyState] || "unknown";
}
