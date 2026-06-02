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
      
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
      
      return next();
    } catch (error: any) {
      console.error("Zod Validation catch block caught error:", error);
      
      const isZodError = error instanceof ZodError || (error && error.name === "ZodError");
      if (isZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((err: any) => ({
            field: err.path.slice(1).join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  };
};
