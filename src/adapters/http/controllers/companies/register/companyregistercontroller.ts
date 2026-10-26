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
  refreshCookieOptions,
  createToken,
  createRefreshToken,
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
    const userRole = (result as any).role || "company";
    const token = createToken(result._id, userRole);
    const refreshToken = createRefreshToken(result._id, userRole);
    res.cookie("jwt", token, authCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    const safeResult =
      typeof (result as any).toObject === "function"
        ? (result as any).toObject()
        : result;

    res.status(200).json({
      success: true,
      message: "Company info saved successfully",
      token,
      refreshToken,
      data: {
        ...safeResult,
        token,
        refreshToken,
      },
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

    // Check if company exists
    const existingCompany = await companyRepository.findById(companyId as string);
    if (!existingCompany) {
      res.status(404).json({
        success: false,
        message: "Company not found. Please complete signup first.",
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

    // Check if company exists
    const existingCompany = await companyRepository.findById(companyId as string);
    if (!existingCompany) {
      res.status(404).json({
        success: false,
        message: "Company not found. Please complete signup first.",
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
      const userRole = (result as any).role || "company";
      const refreshToken = createRefreshToken((result as any)._id, userRole);
      res.cookie("jwt", logintoken, authCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshCookieOptions);
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

export async function updateCompanyOnboardingStepController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = req.params.companyId as string;
    const { step } = req.body;

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: "Company ID is missing",
      });
      return;
    }

    const stepNumber = Number(step);
    if (!Number.isFinite(stepNumber) || stepNumber < 1 || stepNumber > 10) {
      res.status(422).json({
        success: false,
        message: "Invalid onboarding step. Must be a number between 1 and 10.",
      });
      return;
    }

    const existingCompany = await companyRepository.findById(companyId);
    if (!existingCompany) {
      res.status(404).json({
        success: false,
        message: "Company not found. Please complete signup first.",
      });
      return;
    }

    // The onboarding-step endpoint tracks the DASHBOARD onboarding
    // (MCP -> Plans -> Deploy). Canonical shape:
    //   step >= 4  -> dashboardOnboardingStep stays 3 + isDashboardOnboardingDone
    //   step < 4   -> dashboardOnboardingStep = step (current unlocked step)
    // The legacy `onboardingStep` field belongs to the signup phase (1
    // registered / 2 APIs / 3 UI selection) and must not be overwritten here.
    const dashboardDone = stepNumber >= 4;
    const clampedStep = dashboardDone ? 3 : stepNumber;

    const update: Record<string, unknown> = {
      dashboardOnboardingStep: clampedStep,
      updatedAt: new Date(),
    };
    if (dashboardDone) {
      update.isDashboardOnboardingDone = true;
      // Fully onboarded companies are no longer "onboarding" for admin stats.
      update.onBoarding = false;
    }

    const updated = await companyRepository.update(companyId, update);

    res.status(200).json({
      success: true,
      message: `Onboarding step saved (${stepNumber}).`,
      data: updated
        ? {
            dashboardOnboardingStep: (updated as any).dashboardOnboardingStep,
            isDashboardOnboardingDone: (updated as any).isDashboardOnboardingDone,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeSignupOnboardingController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = req.params.companyId as string;

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: "Company ID is missing",
      });
      return;
    }

    const existingCompany = await companyRepository.findById(companyId);
    if (!existingCompany) {
      res.status(404).json({
        success: false,
        message: "Company not found. Please complete signup first.",
      });
      return;
    }

    const updated = await companyRepository.update(companyId, {
      isSignupOnboardingDone: true,
      signupOnboardingStep: 3,
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Signup onboarding marked as complete.",
      data: updated
        ? {
            isSignupOnboardingDone: (updated as any).isSignupOnboardingDone,
            signupOnboardingStep: (updated as any).signupOnboardingStep,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}
