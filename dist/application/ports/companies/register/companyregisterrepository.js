"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyRepositoryPort = createCompanyRepositoryPort;
function createCompanyRepositoryPort(repository) {
    if (!repository.create)
        throw new Error("create function is required");
    if (!repository.findById)
        throw new Error("findById function is required");
    if (!repository.findByEmail)
        throw new Error("findByEmail function is required");
    if (!repository.update)
        throw new Error("update function is required");
    return repository;
}
