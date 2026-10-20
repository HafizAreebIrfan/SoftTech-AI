import { Request, Response, NextFunction } from "express";
import { createCompanyRepository } from "../../../../persistence/mongo/companies/register/companyregisterrepository";
import { registerCompanyInfo } from "../../../../../application/useCases/company/register/registercompanyinfo";
import {
  saveCompanyApiDetails,
  updateSingleApiUiSettings,
} from "../../../../../application/useCases/company/register/companyapidetails";
import { saveCompanyUiSelection } from "../../../../../application/useCases/company/register/companyuiselection";
import { analyzeSingleApi } from "../../../../../application/useCases/company/register/analyzecompanyapi";
import {
  authCookieOptions,
  createToken,
} from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";
import { getAILogs } from "../../../../../infrastructure/mcp/schema_analyzer/ailogsgenerator";

const companyRepository = createCompanyRepository();

export async function registerCompanyInfoController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

export async function saveCompanyApiDetailsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

export async function updateCompanyApiUiSettingsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateSingleApiUiSettings(
      companyRepository,
      req.params.companyId as string,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "API UI settings updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveCompanyUiSelectionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

export async function getGeminiLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const logs = getAILogs();
    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeSingleApiController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = req.params.companyId as string;
    const apiIndex = parseInt(req.params.apiIndex as string, 10);
    const { sampleResponse } = req.body || {};

    const result = await analyzeSingleApi(
      companyRepository,
      companyId,
      apiIndex,
      sampleResponse,
    );

    res.status(200).json({
      success: true,
      message: `API #${apiIndex + 1} analyzed successfully with AI`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCompanyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const company = await companyRepository.findById(req.params.companyId as string);
    if (!company) {
      res.status(404).json({ success: false, error: "Company not found" });
      return;
    }
    const sanitized: any = typeof (company as any).toObject === "function" ? (company as any).toObject() : { ...company };
    delete sanitized.password;
    delete sanitized.passwordResetOTP;
    delete sanitized.passwordResetOTPExpires;
    res.status(200).json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
}

export async function updateCompanyApisController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = req.params.companyId as string;
    const { apis, googleMapsApiKey } = req.body;

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: "Company ID is missing",
      });
      return;
    }

    if (!apis || !Array.isArray(apis)) {
      res.status(422).json({
        success: false,
        message: "apis must be an array",
      });
      return;
    }

    const updated = await companyRepository.update(companyId, {
      apis,
      ...(googleMapsApiKey !== undefined ? { googleMapsApiKey } : {}),
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "API details updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
