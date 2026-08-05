import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  saveCompanyUiSelectionController,
  getGeminiLogsController,
} from "../../../controllers/companies/register/companyregistercontroller";

export const CompanyRoutes = express.Router();

CompanyRoutes.get("/debug-logs", getGeminiLogsController);
CompanyRoutes.post("/registerstep", registerCompanyInfoController);
CompanyRoutes.post(
  "/:companyId/apidetailsstep",
  saveCompanyApiDetailsController,
);
CompanyRoutes.post(
  "/:companyId/uiselectionstep",
  saveCompanyUiSelectionController
);

