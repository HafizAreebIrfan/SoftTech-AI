import nodemailer from "nodemailer";
import { env } from "../../../infrastructure/config/env";

const isSmtpConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM,
);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 465,
      secure: env.SMTP_PORT === 465 || !env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export async function sendPasswordResetOtpEmail(
  email: string,
  otp: string,
): Promise<void> {
  const subject = "Your SoftTech AI password reset code";
  const text = `Your password reset code is ${otp}. It expires in 5 minutes.`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 8px;">
    <h2 style="color: #4F46E5;">SoftTech AI</h2>
    <p>We received a request to reset your password.</p>
    <p>Your 6-digit verification code is:</p>
    <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827; padding: 16px 24px; background: #F3F4F6; border-radius: 6px; display: inline-block; margin: 12px 0;">${otp}</div>
    <p style="color: #6B7280; font-size: 14px;">This code will expire in 5 minutes. If you did not request this, you can safely ignore this email.</p>
  </div>`;

  if (!transporter) {
    console.warn("[Email] SMTP configuration missing. OTP will not be sent by email.");
    console.info(`[Email] Password reset OTP for ${email}: ${otp}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to: email,
      subject,
      text,
      html,
    });
    console.log(`[Email] Password reset code successfully delivered to ${email} (${info.messageId})`);
  } catch (err: any) {
    console.error(`[Email] Failed to deliver email to ${email}:`, err.message);
    if (err.message && err.message.includes("You can only send testing emails to your own email address")) {
      throw new Error(
        `Resend Sandbox restriction: Testing emails can only be sent to the registered Resend account (hafizareebirfan@gmail.com). To send to ${email}, please verify your domain at resend.com/domains.`
      );
    }
    throw new Error(`Failed to send email: ${err.message}`);
  }
}
