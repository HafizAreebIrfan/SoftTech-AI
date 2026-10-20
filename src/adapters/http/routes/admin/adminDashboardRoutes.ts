import express from "express";
import {
  getTopCompaniesController,
  getAdminCompanyDetailController,
  getAllCompaniesController,
  getDashboardStatsController,
  getSummaryController,
  getNewCompaniesController,
  getChartsController,
} from "../../controllers/admin/adminDashboardController";
import { requireAdmin } from "../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const AdminDashboardRoutes = express.Router();

// Enforce JWT authentication and admin role authorization
AdminDashboardRoutes.use(requireAdmin);

// Standard routes with /dashboard prefix
AdminDashboardRoutes.get("/dashboard/top-companies", getTopCompaniesController);
AdminDashboardRoutes.get("/dashboard/all-companies", getAllCompaniesController);
AdminDashboardRoutes.get("/dashboard/stats", getDashboardStatsController);
AdminDashboardRoutes.get("/dashboard/summary", getSummaryController);
AdminDashboardRoutes.get("/dashboard/new-companies", getNewCompaniesController);
AdminDashboardRoutes.get("/dashboard/charts", getChartsController);
AdminDashboardRoutes.get("/dashboard/:companyId", getAdminCompanyDetailController);

// Direct alias routes
AdminDashboardRoutes.get("/top-companies", getTopCompaniesController);
AdminDashboardRoutes.get("/all-companies", getAllCompaniesController);
AdminDashboardRoutes.get("/stats", getDashboardStatsController);
AdminDashboardRoutes.get("/summary", getSummaryController);
AdminDashboardRoutes.get("/new-companies", getNewCompaniesController);
AdminDashboardRoutes.get("/charts", getChartsController);
AdminDashboardRoutes.get("/company/:companyId", getAdminCompanyDetailController);
AdminDashboardRoutes.get("/:companyId", getAdminCompanyDetailController);
