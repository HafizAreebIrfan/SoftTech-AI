import { ICompany } from "../../../../domain/types/company.types";

export interface ICompanyRepository {
  create(companyData: ICompany): Promise<ICompany>;
  findById(companyId: string): Promise<ICompany | null>;
  findByEmail(email: string): Promise<ICompany | null>;
  update(companyId: string, updates: Partial<ICompany>): Promise<ICompany | null>;
  findLatestCompanies(limit: number): Promise<ICompany[] | null>;
}

export function createCompanyRepositoryPort(repository: ICompanyRepository): ICompanyRepository {
  if (!repository.create) throw new Error("create function is required");
  if (!repository.findById) throw new Error("findById function is required");
  if (!repository.findByEmail) throw new Error("findByEmail function is required");
  if (!repository.update) throw new Error("update function is required");
  if (!repository.findLatestCompanies) throw new Error("findLatestCompanies function is required");

  return repository;
}
