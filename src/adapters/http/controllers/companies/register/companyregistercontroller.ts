import { Request, Response, NextFunction } from "express";
import { createCompanyRepository } from "../../../../persistence/mongo/companies/register/companyregisterrepository";
import { registerCompanyInfo } from "../../../../../application/useCases/company/register/registercompanyinfo";
import { saveCompanyApiDetails } from "../../../../../application/useCases/company/register/companyapidetails";
import { saveCompanyUiSelection } from "../../../../../application/useCases/company/register/companyuiselection";
import { authCookieOptions, createToken } from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

const companyRepository = createCompanyRepository();

export async function registerCompanyInfoController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await registerCompanyInfo(companyRepository, req.body);

    res.status(200).json({
      success: true,
      message: "Company info saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveCompanyApiDetailsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;
    const { apis } = req.body;

    // Validation
    if (!companyId) {
      res.status(400).json({
        success: false,
        message: "Company ID is missing. Please provide a valid company ID.",
      });
      return;
    }

    if (!apis || !Array.isArray(apis) || apis.length === 0) {
      res.status(422).json({
        success: false,
        message: "Please provide at least one API configuration.",
      });
      return;
    }

    // Check if API details are already saved
    const existingCompany = await companyRepository.findById(companyId as string);
    if (existingCompany && existingCompany.apis && existingCompany.apis.length > 0) {
      res.status(409).json({
        success: false,
        message: "API details have already been configured for this company. To modify, please contact support.",
      });
      return;
    }

    const result = await saveCompanyApiDetails(
      companyRepository,
      companyId as string,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "API details saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveCompanyUiSelectionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;
    const { uiPreference } = req.body;

    // Validation
    if (!companyId) {
      res.status(400).json({
        success: false,
        message: "Company ID is missing. Please provide a valid company ID.",
      });
      return;
    }

    if (!uiPreference) {
      res.status(422).json({
        success: false,
        message: "Please select a UI preference to continue.",
      });
      return;
    }

    // Check if UI preference is already saved
    const existingCompany = await companyRepository.findById(companyId as string);
    if (existingCompany && existingCompany.uiPreference) {
      res.status(409).json({
        success: false,
        message: "UI preference has already been configured for this company. To modify, please contact support.",
      });
      return;
    }

    const result = await saveCompanyUiSelection(
      companyRepository,
      companyId as string,
      req.body,
    );

    const logintoken = result ? createToken((result as any)._id) : undefined;
    if (result && logintoken) {
      res.cookie("jwt", logintoken, authCookieOptions);
    }

    res.status(200).json({
      success: true,
      message: "UI selection saved successfully",
      data: result,
      token: logintoken,
    });
  } catch (error) {
    next(error);
  }
}
