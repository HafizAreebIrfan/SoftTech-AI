import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  updateCompanyApiUiSettingsController,
  saveCompanyUiSelectionController,
  getGeminiLogsController,
  analyzeSingleApiController,
  getCompanyController,
} from "../../../controllers/companies/register/companyregistercontroller";
import {
  authenticateToken,
  requireAdmin,
  requireCompanyOrAdmin,
} from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const CompanyRoutes = express.Router();

// Public route: Initial company registration step
CompanyRoutes.post("/registerstep", registerCompanyInfoController);

// Protected routes: Require valid JWT token (Bearer or cookie) + ownership/admin authorization
CompanyRoutes.get(
  "/:companyId",
  authenticateToken,
  requireCompanyOrAdmin,
  getCompanyController,
);

CompanyRoutes.post(
  "/:companyId/apidetailsstep",
  authenticateToken,
  requireCompanyOrAdmin,
  saveCompanyApiDetailsController,
);

CompanyRoutes.post(
  "/:companyId/api-ui-settings",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApiUiSettingsController,
);

CompanyRoutes.post(
  "/:companyId/apis/:apiIndex/analyze",
  authenticateToken,
  requireCompanyOrAdmin,
  analyzeSingleApiController,
);

CompanyRoutes.post(
  "/:companyId/uiselectionstep",
  authenticateToken,
  requireCompanyOrAdmin,
  saveCompanyUiSelectionController,
);

// Admin-only route: Telemetry and debug logs
CompanyRoutes.get("/debug-logs", requireAdmin, getGeminiLogsController);
