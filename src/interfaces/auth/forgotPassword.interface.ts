export type ForgotPasswordStep = 1 | 2 | 3;

export interface ForgotPasswordStore {
  email: string;
  otp: string;
  isOtpVerified: boolean;
  setEmail: (email: string) => void;
  setOtp: (otp: string) => void;
  setOtpVerified: (isOtpVerified: boolean) => void;
  clearForgotPassword: () => void;
}
