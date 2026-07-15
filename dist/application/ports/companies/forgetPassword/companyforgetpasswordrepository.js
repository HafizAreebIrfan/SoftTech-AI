"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyForgotPasswordRepositoryPort = createCompanyForgotPasswordRepositoryPort;
function createCompanyForgotPasswordRepositoryPort(repository) {
    if (!repository.findByEmail)
        throw new Error("findByEmail function is required");
    if (!repository.update)
        throw new Error("update function is required");
    if (!repository.resetPassword)
        throw new Error("resetPassword function is required");
    return repository;
}
