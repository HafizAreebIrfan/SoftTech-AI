import { Request, Response } from "express";
import { env } from "../../../infrastructure/config/env";

export const getHealthController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: "System is healthy", port: env.PORT, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
