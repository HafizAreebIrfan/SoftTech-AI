import { Request, Response, NextFunction } from "express";
import { createCompanyRepository } from "../../../persistence/mongo/companies/register/companyregisterrepository";

const companyRepository = createCompanyRepository();

export async function getAllCompaniesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companies = await companyRepository.findAllCompanies();

    if (!companies || companies.length === 0) {
      res.status(200).json({
        success: true,
        message: "No companies found",
        data: [],
        total: 0,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Companies fetched successfully",
      data: companies,
      total: companies.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCompanyByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;

    // Validation
    if (!companyId) {
      res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
      return;
    }

    const company = await companyRepository.findById(companyId as string);

    if (!company) {
      res.status(404).json({
        success: false,
        message: "Company not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company fetched successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
}
