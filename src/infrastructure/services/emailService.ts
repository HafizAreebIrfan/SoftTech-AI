import nodemailer from "nodemailer";
import { env } from "../config/env";

const isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export async function sendPasswordResetOtpEmail(email: string, otp: string): Promise<void> {
  const subject = "Your SoftTech AI password reset code";
  const text = `Your password reset code is ${otp}. It expires in 5 minutes.`;
  const html = `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`;

  if (!transporter) {
    console.warn("SMTP configuration missing. OTP will not be sent by email.");
    console.info(`Password reset OTP for ${email}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject,
    text,
    html,
  });
}
