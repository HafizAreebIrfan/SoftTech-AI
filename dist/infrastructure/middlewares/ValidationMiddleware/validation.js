"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (parsed.body !== undefined)
                req.body = parsed.body;
            if (parsed.query !== undefined)
                req.query = parsed.query;
            if (parsed.params !== undefined)
                req.params = parsed.params;
            return next();
        }
        catch (error) {
            console.error("Zod Validation catch block caught error:", error);
            const isZodError = error instanceof zod_1.ZodError || (error && error.name === "ZodError");
            if (isZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.issues.map((err) => ({
                        field: err.path.slice(1).join('.'),
                        message: err.message
                    }))
                });
            }
            return res.status(500).json({ success: false, error: "Internal server error" });
        }
    };
};
exports.validateRequest = validateRequest;
