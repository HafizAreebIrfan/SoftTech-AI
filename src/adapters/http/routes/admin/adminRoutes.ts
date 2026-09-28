import express, { Response } from "express";
import { requireAdmin, AuthenticatedRequest } from "../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";
import { CompanyModel } from "../../../persistence/models/companies/register/companyinfo";

export const adminRoutes = express.Router();

// Apply requireAdmin to all routes in this router
adminRoutes.use(requireAdmin);

// GET /api/admin/me - Verify current admin session
adminRoutes.get("/me", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// GET /api/admin/companies - List all registered companies with metadata and roles
adminRoutes.get("/companies", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const companies = await CompanyModel.find({}, {
      companyName: 1,
      email: 1,
      industry: 1,
      role: 1,
      status: 1,
      onboardingStep: 1,
      createdAt: 1,
      "apis.name": 1,
      "apis.method": 1,
    }).lean();

    return res.status(200).json({
      success: true,
      total: companies.length,
      companies,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/companies/:id/role - Promote/demote account role
adminRoutes.patch("/companies/:id/role", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { role } = req.body;
  if (!["admin", "company", "user"].includes(role)) {
    return res.status(400).json({
      success: false,
      error: "Invalid role. Must be admin, company, or user.",
    });
  }

  try {
    const updated = await CompanyModel.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: "after", select: "companyName email role status" }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      company: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
