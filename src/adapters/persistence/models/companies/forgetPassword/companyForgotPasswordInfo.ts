export interface ICompanyForgotPassword {
  passwordResetOTP?: string;
  passwordResetOTPExpires?: Date;
}

export const CompanyForgotPasswordFields = {
  passwordResetOTP: { type: String },
  passwordResetOTPExpires: { type: Date },
};
