import { Request, Response, NextFunction } from "express";
import { createCompanyRepository } from "../../../../persistence/mongo/companies/register/companyregisterrepository";
import { registerCompanyInfo } from "../../../../../application/useCases/company/register/registercompanyinfo";
import { saveCompanyApiDetails } from "../../../../../application/useCases/company/register/companyapidetails";
import { saveCompanyUiSelection } from "../../../../../application/useCases/company/register/companyuiselection";
import { createToken, maxAge } from "../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware";

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
    const result = await saveCompanyApiDetails(
      companyRepository,
      req.params.companyId as string,
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
    const result = await saveCompanyUiSelection(
      companyRepository,
      req.params.companyId as string,
      req.body,
    );

    if (result) {
      const logintoken = createToken((result as any)._id);
      res.cookie("jwt", logintoken, {
        httpOnly: true,
        maxAge: maxAge * 1000,
        secure: true,
        sameSite: "none",
        path: "/",
      });
    }

    res.status(200).json({
      success: true,
      message: "UI selection saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
