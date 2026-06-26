"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutUser = exports.PostrequireAuth = exports.GetrequireAuth = exports.createToken = exports.authCookieOptions = exports.maxAge = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const companyinfo_1 = require("../../../adapters/persistence/models/companies/register/companyinfo");
exports.maxAge = 15 * 60; // 15 minutes in seconds
const isProduction = process.env.NODE_ENV === "production";
exports.authCookieOptions = {
    httpOnly: true,
    maxAge: exports.maxAge * 1000,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax"),
    path: "/",
};
const createToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, env_1.env.JWT_SECRET, {
        expiresIn: exports.maxAge,
    });
};
exports.createToken = createToken;
const GetrequireAuth = (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.status(401).json({ error: "Not Authenticated" });
    }
    jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            return res.status(401).json({ error: "Invalid Token" });
        }
        try {
            const user = await companyinfo_1.CompanyModel.findById(decodedToken.id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const secondsRemaining = decodedToken.exp - Math.floor(Date.now() / 1000);
            if (secondsRemaining < 5 * 60) {
                const newToken = (0, exports.createToken)(user._id);
                res.cookie("jwt", newToken, exports.authCookieOptions);
            }
            return res.status(200).json({ user });
        }
        catch (e) {
            return res.status(400).json({ error: e.message });
        }
    });
};
exports.GetrequireAuth = GetrequireAuth;
const PostrequireAuth = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await companyinfo_1.CompanyModel.login(email, password);
        const logintoken = (0, exports.createToken)(user._id);
        res.cookie("jwt", logintoken, exports.authCookieOptions);
        return res.status(200).json({
            _id: user._id,
            token: logintoken,
        });
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
};
exports.PostrequireAuth = PostrequireAuth;
const LogoutUser = (req, res) => {
    res.cookie("jwt", "", {
        ...exports.authCookieOptions,
        maxAge: 0,
    });
    return res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
};
exports.LogoutUser = LogoutUser;
