import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  saveCompanyUiSelectionController,
} from "../../../controllers/companies/register/companyregistercontroller";

export const CompanyRoutes = express.Router();

CompanyRoutes.post("/register", registerCompanyInfoController);
CompanyRoutes.post(
  "/:companyId/apidetails",
  saveCompanyApiDetailsController,
);
CompanyRoutes.post(
  "/:companyId/uiselection",
  saveCompanyUiSelectionController
);
