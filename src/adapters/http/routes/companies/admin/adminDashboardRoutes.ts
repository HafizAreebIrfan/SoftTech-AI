import express from "express";
import {
  getTopCompaniesController,
  getAdminCompanyDetailController,
} from "../../../controllers/companies/admin/adminDashboardController";

export const AdminDashboardRoutes = express.Router();

AdminDashboardRoutes.get("/dashboard/top-companies", getTopCompaniesController);
AdminDashboardRoutes.get("/dashboard/:companyId", getAdminCompanyDetailController);
