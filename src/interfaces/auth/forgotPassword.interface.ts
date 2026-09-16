export type ForgotPasswordStep = 1 | 2 | 3;

export interface ForgotPasswordStore {
  // Step & Flow State
  step: ForgotPasswordStep;
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;

  // Status & Timers
  isPending: boolean;
  otpTimer: number;
  showResetModal: boolean;

  // State Setters
  setStep: (step: ForgotPasswordStep) => void;
  setEmail: (email: string) => void;
  setOtp: (otp: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setShowResetModal: (show: boolean) => void;

  // Step Action Handlers
  handleRequestOtp: () => Promise<boolean>;
  handleVerifyOtpStep: () => boolean;
  handleResendOtp: () => Promise<void>;
  handleResetPasswordSubmit: (
    navigate?: (opts: { to: string }) => void,
  ) => Promise<boolean>;

  // Navigation & Safety Confirmation Handlers
  attemptGoBack: () => void;
  confirmResetFlow: () => void;
  cancelResetModal: () => void;
  resetStore: () => void;

  // Timer Helpers
  startOtpTimer: () => void;
  stopOtpTimer: () => void;
}
