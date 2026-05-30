"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(err, req, res, next) {
    console.error(err.message);
    res.status(400).json({
        success: false,
        message: err.message || "Something went wrong",
    });
}
