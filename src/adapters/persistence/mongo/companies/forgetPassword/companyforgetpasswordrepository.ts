import { CompanyModel } from "../../../models/companies/register/companyinfo";
import { ICompanyForgotPasswordRepository } from "../../../../../application/ports/companies/forgetPassword/companyforgetpasswordrepository";
import { ICompany } from "../../../../../domain/types/company.types";

export function createCompanyForgotPasswordRepository(): ICompanyForgotPasswordRepository {
  return {
    async findByEmail(email: string): Promise<any> {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const escaped = normalizedEmail.replace(/[-\[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      return await CompanyModel.findOne({ email: { $regex: new RegExp("^" + escaped + "$", "i") } }).lean();
    },

    async update(companyId: string, updates: Partial<ICompany>): Promise<any> {
      return await CompanyModel.findByIdAndUpdate(companyId, updates, {
        returnDocument: "after",
      }).lean();
    },

    async resetPassword(companyId: string, newPassword: string): Promise<any> {
      const company = await CompanyModel.findById(companyId);
      if (!company) return null;
      company.password = newPassword;
      company.passwordResetOTP = undefined;
      company.passwordResetOTPExpires = undefined;
      return await company.save();
    },
  };
}
