import mongoose, { Document, Model } from "mongoose";
import { ApiSchema } from "./apischema";
import { UiPreferenceSchema } from "./uipreferenceschema";
import { Hashpassword, comparePassword } from "../../../../../infrastructure/middlewares/SecurityMiddleware/bcrypt";
import { ICompanyForgotPassword, CompanyForgotPasswordFields } from "../forgetPassword/companyForgotPasswordInfo";

export interface ICompanyDocument extends Document, ICompanyForgotPassword {
  companyName: string;
  mcpSlug?: string;
  industry: string;
  email: string;
  password?: string;
  phone?: string;
  apis?: any[];
  uiPreference?: any;
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
    uiPreference: UiPreferenceSchema,
    onboardingStep: { type: Number, default: 1 },
    status: { type: String, default: "draft" },
    ...CompanyForgotPasswordFields,
  },
  { timestamps: true },
);

CompanySchema.pre<ICompanyDocument>("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await Hashpassword(this.password);
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

    const auth = await comparePassword(password, user.password);
    if (!auth) {
      throw new Error("incorrect password");
    }

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const CompanyModel = mongoose.model<ICompanyDocument, ICompanyModel>("CompanyModel", CompanySchema);
export default CompanyModel;
