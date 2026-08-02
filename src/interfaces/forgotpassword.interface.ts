export interface ForgotPasswordStore {
  email: string;
  otp: string;
  isOtpVerified: boolean;
  setEmail: (email: string) => void;
  setOtp: (otp: string) => void;
  setOtpVerified: (verified: boolean) => void;
  clearForgotPassword: () => void;
}
