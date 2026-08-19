import { create } from "zustand";
import {
  ForgotPasswordStore,
  ForgotPasswordStep,
} from "../../interfaces/auth/forgotPassword.interface";
import {
  sendForgotPasswordOtpApi,
  resetPasswordApi,
  logout,
} from "../../adapters/api/authApi";
import { showToast } from "../../utils/toasts";

const INITIAL_OTP_TIMER_SECONDS = 300; // 5 minutes
let timerInterval: any = null;

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const useForgotPasswordStore = create<ForgotPasswordStore>((set, get) => ({
  step: 1,
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",

  isPending: false,
  otpTimer: INITIAL_OTP_TIMER_SECONDS,
  showResetModal: false,

  setStep: (step: ForgotPasswordStep) => set({ step }),
  setEmail: (email: string) => set({ email }),
  setOtp: (otp: string) => set({ otp }),
  setNewPassword: (newPassword: string) => set({ newPassword }),
  setConfirmPassword: (confirmPassword: string) => set({ confirmPassword }),
  setShowResetModal: (showResetModal: boolean) => set({ showResetModal }),

  startOtpTimer: () => {
    if (timerInterval) clearInterval(timerInterval);
    set({ otpTimer: INITIAL_OTP_TIMER_SECONDS });

    timerInterval = setInterval(() => {
      const { otpTimer } = get();
      if (otpTimer <= 1) {
        clearInterval(timerInterval);
        timerInterval = null;
        set({ otpTimer: 0 });
      } else {
        set({ otpTimer: otpTimer - 1 });
      }
    }, 1000);
  },

  stopOtpTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  },

  handleRequestOtp: async (): Promise<boolean> => {
    const { email } = get();
    if (!email || !isValidEmail(email)) {
      showToast("Please enter a valid email address.", "warning");
      return false;
    }

    set({ isPending: true });

    try {
      const res = await sendForgotPasswordOtpApi(email.trim());
      set({ isPending: false });

      if (res && res.success) {
        showToast(
          res.message || "OTP code sent to your email successfully.",
          "success",
        );
        set({ step: 2 });
        get().startOtpTimer();
        return true;
      } else {
        const errMsg = res?.message || "Failed to send OTP code.";
        showToast(errMsg, "error");
        return false;
      }
    } catch (err: any) {
      set({ isPending: false });
      const errMsg = err?.message || "Network error. Unable to send OTP.";
      showToast(errMsg, "error");
      return false;
    }
  },

  handleVerifyOtpStep: (): boolean => {
    const { otp } = get();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      showToast("Please enter the 6-digit OTP code.", "warning");
      return false;
    }

    if (cleanOtp.length < 4 || cleanOtp.length > 8) {
      showToast("Please enter a valid OTP code.", "warning");
      return false;
    }

    set({ step: 3 });
    return true;
  },

  handleResendOtp: async (): Promise<void> => {
    const { email, otpTimer } = get();
    if (otpTimer > 0) {
      showToast(
        `Please wait ${Math.ceil(otpTimer / 60)} minutes before requesting a new OTP.`,
        "info",
      );
      return;
    }

    if (!email || !isValidEmail(email)) {
      showToast("Invalid email address.", "error");
      return;
    }

    set({ isPending: true });

    try {
      const res = await sendForgotPasswordOtpApi(email.trim());
      set({ isPending: false });

      if (res && res.success) {
        showToast("A new OTP code has been sent to your email.", "success");
        get().startOtpTimer();
      } else {
        showToast(res?.message || "Failed to resend OTP.", "error");
      }
    } catch (err: any) {
      set({ isPending: false });
      showToast(err?.message || "Failed to resend OTP.", "error");
    }
  },

  handleResetPasswordSubmit: async (
    navigate?: (opts: { to: string }) => void,
  ): Promise<boolean> => {
    const { email, otp, newPassword, confirmPassword } = get();

    if (!newPassword || newPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", "warning");
      return false;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return false;
    }

    set({ isPending: true });

    try {
      const res = await resetPasswordApi({
        email: email.trim(),
        otp: otp.trim(),
        password: newPassword,
      });

      set({ isPending: false });

      if (res && res.success) {
        showToast(
          "Password updated successfully! Logging out from active sessions...",
          "success",
        );

        // Invalidate active sessions everywhere
        try {
          await logout();
        } catch {
          // Ignore logout error if session was not active
        }

        get().resetStore();

        if (navigate) {
          navigate({ to: "/login" });
        }

        return true;
      } else {
        showToast(res?.message || "Password reset failed.", "error");
        return false;
      }
    } catch (err: any) {
      set({ isPending: false });
      showToast(
        err?.message || "Failed to reset password. Please check your OTP.",
        "error",
      );
      return false;
    }
  },

  attemptGoBack: () => {
    const { step } = get();
    if (step > 1) {
      set({ showResetModal: true });
    } else {
      get().resetStore();
    }
  },

  confirmResetFlow: () => {
    get().stopOtpTimer();
    set({
      step: 1,
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
      isPending: false,
      otpTimer: INITIAL_OTP_TIMER_SECONDS,
      showResetModal: false,
    });
  },

  cancelResetModal: () => {
    set({ showResetModal: false });
  },

  resetStore: () => {
    get().stopOtpTimer();
    set({
      step: 1,
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
      isPending: false,
      otpTimer: INITIAL_OTP_TIMER_SECONDS,
      showResetModal: false,
    });
  },
}));
