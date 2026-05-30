"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCompanyUiSelection = saveCompanyUiSelection;
async function saveCompanyUiSelection(companyRepository, companyId, payload) {
    if (!companyId) {
        throw new Error("companyId is required");
    }
    if (!payload.uiPreference) {
        throw new Error("uiPreference is required");
    }
    return await companyRepository.update(companyId, {
        uiPreference: payload.uiPreference,
        onboardingStep: 3,
        status: "ready-for-testing",
        updatedAt: new Date(),
    });
}
