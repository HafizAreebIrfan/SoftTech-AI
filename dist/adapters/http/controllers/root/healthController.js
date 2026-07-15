"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthController = void 0;
const env_1 = require("../../../../infrastructure/config/env");
const getHealthController = async (req, res) => {
    try {
        res.json({
            message: "System is healthy",
            port: env_1.env.PORT,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getHealthController = getHealthController;
