import { Request, Response, NextFunction } from "express";

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error(err.message);

  res.status(400).json({
    success: false,
    message: err.message || "Something went wrong",
  });
}
