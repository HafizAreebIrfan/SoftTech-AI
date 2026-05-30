import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  saveCompanyUiSelectionController,
} from "../../../controllers/companies/register/companyregistercontroller";

export const CompanyRoutes = express.Router();

CompanyRoutes.post("/registerstep", registerCompanyInfoController);
CompanyRoutes.post(
  "/:companyId/apidetailsstep",
  saveCompanyApiDetailsController,
);
CompanyRoutes.post(
  "/:companyId/uiselectionstep",
  saveCompanyUiSelectionController
);
