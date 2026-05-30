"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCompanyApiDetails = saveCompanyApiDetails;
async function saveCompanyApiDetails(companyRepository, companyId, payload) {
    if (!companyId) {
        throw new Error("companyId is required");
    }
    if (!payload.apis ||
        !Array.isArray(payload.apis) ||
        payload.apis.length === 0) {
        throw new Error("apis must be a non-empty array");
    }
    return await companyRepository.update(companyId, {
        apis: payload.apis,
        onboardingStep: 2,
        updatedAt: new Date(),
    });
}
