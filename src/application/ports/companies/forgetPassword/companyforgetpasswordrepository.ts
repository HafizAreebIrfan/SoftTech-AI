import { ICompany } from "../../../../domain/types/company.types";

export interface ICompanyForgotPasswordRepository {
  findByEmail(email: string): Promise<ICompany | null>;
  update(companyId: string, updates: Partial<ICompany>): Promise<ICompany | null>;
  resetPassword(companyId: string, newPassword: string): Promise<ICompany | null>;
}

export function createCompanyForgotPasswordRepositoryPort(
  repository: ICompanyForgotPasswordRepository,
): ICompanyForgotPasswordRepository {
  if (!repository.findByEmail) throw new Error("findByEmail function is required");
  if (!repository.update) throw new Error("update function is required");
  if (!repository.resetPassword) throw new Error("resetPassword function is required");

  return repository;
}
