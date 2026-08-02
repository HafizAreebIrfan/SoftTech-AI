import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const otpSchema = z
  .string()
  .length(5, "Enter the full 5-digit code")
  .regex(/^\d+$/, "Code must contain digits only");

export const passwordRequirements = {
  minLength: (value: string) => value.length >= 8,
  uppercase: (value: string) => /[A-Z]/.test(value),
  number: (value: string) => /[0-9]/.test(value),
  specialChar: (value: string) => /[^A-Za-z0-9]/.test(value),
};

export const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number")
      .regex(/[^A-Za-z0-9]/, "Include at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
