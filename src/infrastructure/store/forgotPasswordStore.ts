import { create } from "zustand";
import { ForgotPasswordStore } from "../../interfaces/forgotpassword.interface";

export const useForgotPasswordStore = create<ForgotPasswordStore>((set) => ({
  email: "",
  otp: "",
  isOtpVerified: false,
  setEmail: (email) => set({ email }),
  setOtp: (otp) => set({ otp }),
  setOtpVerified: (isOtpVerified) => set({ isOtpVerified }),
  clearForgotPassword: () =>
    set({ email: "", otp: "", isOtpVerified: false }),
}));
