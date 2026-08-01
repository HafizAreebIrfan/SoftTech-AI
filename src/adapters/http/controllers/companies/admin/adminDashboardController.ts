import { Request, Response, NextFunction } from "express";
import { createCompanyRepository } from "../../../../persistence/mongo/companies/register/companyregisterrepository";
import { getTopCompaniesForAdmin } from "../../../../../application/useCases/company/admin/getTopCompanies";
import { getCompanyDashboardDetail } from "../../../../../application/useCases/company/admin/getAdminCompanyDetail";
import { getAllCompaniesForAdmin } from "../../../../../application/useCases/company/admin/getAllCompanies";
import { getDashboardStats } from "../../../../../application/useCases/company/admin/getDashboardStats";

const companyRepository = createCompanyRepository();

export async function getTopCompaniesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 5;
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
    if (req.params.companyId === "all-companies") {
      await getAllCompaniesController(req, res, next);
      return;
    }

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

export async function getAllCompaniesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAllCompaniesForAdmin(companyRepository);

    res.status(200).json({
      success: true,
      message: "All companies fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStatsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getDashboardStats(companyRepository);

    res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
