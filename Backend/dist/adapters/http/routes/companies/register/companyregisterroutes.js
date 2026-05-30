"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyRoutes = void 0;
const express_1 = __importDefault(require("express"));
const companyregistercontroller_1 = require("../../../controllers/companies/register/companyregistercontroller");
exports.CompanyRoutes = express_1.default.Router();
exports.CompanyRoutes.post("/registerstep", companyregistercontroller_1.registerCompanyInfoController);
exports.CompanyRoutes.post("/:companyId/apidetailsstep", companyregistercontroller_1.saveCompanyApiDetailsController);
exports.CompanyRoutes.post("/:companyId/uiselectionstep", companyregistercontroller_1.saveCompanyUiSelectionController);
