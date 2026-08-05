import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  saveCompanyUiSelectionController,
  getGeminiLogsController,
  analyzeSingleApiController,
} from "../../../controllers/companies/register/companyregistercontroller";

export const CompanyRoutes = express.Router();

CompanyRoutes.get("/debug-logs", getGeminiLogsController);
CompanyRoutes.post("/registerstep", registerCompanyInfoController);
CompanyRoutes.post(
  "/:companyId/apidetailsstep",
  saveCompanyApiDetailsController,
);
CompanyRoutes.post(
  "/:companyId/apis/:apiIndex/analyze",
  analyzeSingleApiController,
);
CompanyRoutes.post(
  "/:companyId/uiselectionstep",
  saveCompanyUiSelectionController
);

