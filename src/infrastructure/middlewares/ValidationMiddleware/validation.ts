import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateRequest = (schema: z.ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map(err => ({
            field: err.path.slice(1).join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  };
};
