"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetOtpEmail = sendPasswordResetOtpEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const isSmtpConfigured = Boolean(env_1.env.SMTP_HOST && env_1.env.SMTP_USER && env_1.env.SMTP_PASS && env_1.env.MAIL_FROM);
const transporter = isSmtpConfigured
    ? nodemailer_1.default.createTransport({
        host: env_1.env.SMTP_HOST,
        port: env_1.env.SMTP_PORT || 587,
        secure: env_1.env.SMTP_PORT === 465,
        auth: {
            user: env_1.env.SMTP_USER,
            pass: env_1.env.SMTP_PASS,
        },
    })
    : null;
async function sendPasswordResetOtpEmail(email, otp) {
    const subject = "Your SoftTech AI password reset code";
    const text = `Your password reset code is ${otp}. It expires in 5 minutes.`;
    const html = `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`;
    if (!transporter) {
        console.warn("SMTP configuration missing. OTP will not be sent by email.");
        console.info(`Password reset OTP for ${email}: ${otp}`);
        return;
    }
    await transporter.sendMail({
        from: env_1.env.MAIL_FROM,
        to: email,
        subject,
        text,
        html,
    });
}
