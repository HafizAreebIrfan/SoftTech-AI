"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const apischema_1 = require("./apischema");
const uipreferenceschema_1 = require("./uipreferenceschema");
const bcrypt_1 = require("../../../../../infrastructure/middlewares/SecurityMiddleware/bcrypt");
const CompanySchema = new mongoose_1.default.Schema({
    companyName: { type: String, required: true },
    industry: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    apis: [apischema_1.ApiSchema],
    uiPreference: uipreferenceschema_1.UiPreferenceSchema,
    onboardingStep: { type: Number, default: 1 },
    status: { type: String, default: "draft" },
}, { timestamps: true });
CompanySchema.pre("save", async function () {
    if (this.isModified("password") && this.password) {
        this.password = await (0, bcrypt_1.Hashpassword)(this.password);
    }
});
CompanySchema.statics.login = async function (email, password) {
    try {
        const user = await this.findOne({ email });
        if (!user) {
            throw new Error("incorrect email");
        }
        if (!user.password) {
            throw new Error("this account does not have a password configured");
        }
        const auth = await (0, bcrypt_1.comparePassword)(password, user.password);
        if (!auth) {
            throw new Error("incorrect password");
        }
        return user;
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.CompanyModel = mongoose_1.default.model("CompanyModel", CompanySchema);
exports.default = exports.CompanyModel;
