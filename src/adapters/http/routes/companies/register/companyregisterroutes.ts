import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  saveCompanyUiSelectionController,
} from "../../../controllers/companies/register/companyregistercontroller";
import {
  getAllCompaniesController,
  getCompanyByIdController,
} from "../../../controllers/companies/companyListController";

export const CompanyRoutes = express.Router();

// GET endpoints - list all companies and get by ID
CompanyRoutes.get("/", getAllCompaniesController);
CompanyRoutes.get("/:companyId", getCompanyByIdController);

// POST endpoints - register and update company
CompanyRoutes.post("/register", registerCompanyInfoController);
CompanyRoutes.post(
  "/:companyId/apidetails",
  saveCompanyApiDetailsController,
);
CompanyRoutes.post(
  "/:companyId/uiselection",
  saveCompanyUiSelectionController
);
