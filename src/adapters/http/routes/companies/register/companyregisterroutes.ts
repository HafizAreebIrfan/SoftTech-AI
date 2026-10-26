import express from "express";
import {
  registerCompanyInfoController,
  saveCompanyApiDetailsController,
  updateCompanyApiUiSettingsController,
  updateCompanyApisController,
  saveCompanyUiSelectionController,
  getGeminiLogsController,
  analyzeSingleApiController,
  getCompanyController,
  updateCompanyOnboardingStepController,
  completeSignupOnboardingController,
} from "../../../controllers/companies/register/companyregistercontroller";
import {
  authenticateToken,
  requireAdmin,
  requireCompanyOrAdmin,
} from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

export const CompanyRoutes = express.Router();

// Public route: Initial company registration step
CompanyRoutes.post("/registerstep", registerCompanyInfoController);
CompanyRoutes.post("/register", registerCompanyInfoController);

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

CompanyRoutes.put(
  "/:companyId/apis",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApisController,
);
CompanyRoutes.put(
  "/:companyId/apidetails",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApisController,
);
CompanyRoutes.put(
  "/:companyId/apidetailsstep",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApisController,
);
CompanyRoutes.post(
  "/:companyId/update-apis",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApisController,
);
CompanyRoutes.post(
  "/:companyId/apidetails",
  authenticateToken,
  requireCompanyOrAdmin,
  saveCompanyApiDetailsController,
);

CompanyRoutes.post(
  "/:companyId/onboarding-step",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyOnboardingStepController,
);
CompanyRoutes.post(
  "/:companyId/complete-signup-onboarding",
  authenticateToken,
  requireCompanyOrAdmin,
  completeSignupOnboardingController,
);

CompanyRoutes.post(
  "/:companyId/api-ui-settings",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApiUiSettingsController,
);
CompanyRoutes.put(
  "/:companyId/api-ui-settings",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApiUiSettingsController,
);
CompanyRoutes.patch(
  "/:companyId/api-ui-settings",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApiUiSettingsController,
);
CompanyRoutes.put(
  "/:companyId/apis/:apiIndex",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApiUiSettingsController,
);
CompanyRoutes.patch(
  "/:companyId/apis/:apiIndex",
  authenticateToken,
  requireCompanyOrAdmin,
  updateCompanyApiUiSettingsController,
);
CompanyRoutes.post(
  "/:companyId/apis/:apiIndex",
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
CompanyRoutes.post(
  "/:companyId/uiselection",
  authenticateToken,
  requireCompanyOrAdmin,
  saveCompanyUiSelectionController,
);

// Admin-only route: Telemetry and debug logs
CompanyRoutes.get("/debug-logs", requireAdmin, getGeminiLogsController);
