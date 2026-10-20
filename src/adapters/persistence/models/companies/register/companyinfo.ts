import mongoose, { Document, Model } from "mongoose";
import { ApiSchema } from "./apischema";
import { UiPreferenceSchema } from "./uipreferenceschema";
import { Hashpassword, comparePassword } from "../../../../../infrastructure/middlewares/SecurityMiddleware/bcrypt";
import { ICompanyForgotPassword, CompanyForgotPasswordFields } from "../forgetPassword/companyForgotPasswordInfo";

export type CompanyRole = "admin" | "company" | "user";

export interface ICompanyDocument extends Document, ICompanyForgotPassword {
  role: CompanyRole;
  companyName: string;
  mcpSlug?: string;
  industry: string;
  email: string;
  password?: string;
  phone?: string;
  apis?: any[];
  authStrategy?: any;
  uiPreference?: any;
  googleMapsApiKey?: string;
  totalSpent?: number;
  currentPlan?: string | null;
  onBoarding?: boolean;
  onboardingStep: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompanyModel extends Model<ICompanyDocument> {
  login(email: string, password: string): Promise<ICompanyDocument>;
}

const CompanySchema = new mongoose.Schema<ICompanyDocument, ICompanyModel>(
  {
    companyName: { type: String, required: true },
    mcpSlug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    industry: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    apis: [ApiSchema],
    authStrategy: { type: mongoose.Schema.Types.Mixed, default: null },
    uiPreference: UiPreferenceSchema,
    googleMapsApiKey: { type: String, default: "" },
    totalSpent: { type: Number, default: 0 },
    currentPlan: { type: String, default: null },
    onBoarding: { type: Boolean, default: true },
    onboardingStep: { type: Number, default: 1 },
    status: {
      type: String,
      default: "draft",
    },
    role: {
      type: String,
      enum: ["admin", "company", "user"],
      default: "company",
    },
    ...CompanyForgotPasswordFields,
  },
  { timestamps: true },
);

CompanySchema.pre<ICompanyDocument>("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await Hashpassword(this.password);
  }
});

CompanySchema.statics.login = async function (email: string, password: string) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const escaped = normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const company = await this.findOne({
    email: { $regex: new RegExp("^" + escaped + "$", "i") },
  });
  if (!company) {
    throw new Error("Invalid credentials");
  }
  const isMatch = await comparePassword(password, company.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  return company;
};

export const CompanyModel = mongoose.model<ICompanyDocument, ICompanyModel>(
  "CompanyModel",
  CompanySchema,
  "companymodels"
);

export default CompanyModel;
