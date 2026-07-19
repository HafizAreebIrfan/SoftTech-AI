import { Request, Response, NextFunction } from "express";
import { createCompanyRepository } from "../../../../persistence/mongo/companies/register/companyregisterrepository";
import { getTopCompaniesForAdmin } from "../../../../../application/useCases/company/admin/getTopCompanies";
import { getCompanyDashboardDetail } from "../../../../../application/useCases/company/admin/getAdminCompanyDetail";

const companyRepository = createCompanyRepository();

export async function getTopCompaniesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
    const result = await getTopCompaniesForAdmin(companyRepository, limit);

    res.status(200).json({
      success: true,
      message: "Top companies fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCompanyDetailController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getCompanyDashboardDetail(companyRepository, req.params.companyId as string);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Company not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company dashboard detail fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
