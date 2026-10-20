import { CompanyModel } from "../../../models/companies/register/companyinfo";
import { ICompanyRepository } from "../../../../../application/ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../../domain/types/company.types";

export function createCompanyRepository(): ICompanyRepository {
  return {
    async create(companyData: ICompany): Promise<any> {
      return await CompanyModel.create(companyData);
    },

    async findById(companyId: string): Promise<any> {
      return await CompanyModel.findById(companyId).lean();
    },

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

    async findTopCompanies(limit: number): Promise<any> {
      return await CompanyModel.find({})
        .sort({ totalSpent: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    },

    async findLatestCompanies(limit: number): Promise<any> {
      return await CompanyModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    },

    async findAllCompanies(): Promise<any> {
      return await CompanyModel.find({}).sort({ createdAt: -1 }).lean();
    },
  };
}
