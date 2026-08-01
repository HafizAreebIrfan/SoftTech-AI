import express from "express";
import {
  getTopCompaniesController,
  getAdminCompanyDetailController,
  getAllCompaniesController,
  getDashboardStatsController,
} from "../../../controllers/companies/admin/adminDashboardController";

export const AdminDashboardRoutes = express.Router();

AdminDashboardRoutes.get("/dashboard/top-companies", getTopCompaniesController);
AdminDashboardRoutes.get("/dashboard/all-companies", getAllCompaniesController);
AdminDashboardRoutes.get("/dashboard/stats", getDashboardStatsController);
AdminDashboardRoutes.get("/dashboard/:companyId", getAdminCompanyDetailController);
