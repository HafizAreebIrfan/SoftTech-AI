import mongoose, { Document, Model } from "mongoose";

export interface IPaymentDocument extends Document {
  companyId: mongoose.Types.ObjectId | string;
  amount: number;
  currency?: string;
  plan?: string | null;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentModel extends Model<IPaymentDocument> {}

const PaymentSchema = new mongoose.Schema<IPaymentDocument, IPaymentModel>(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyModel", required: true, index: true },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "USD" },
    plan: { type: String, default: null, nullable: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "succeeded",
      index: true,
    },
    paidAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

PaymentSchema.index({ companyId: 1, paidAt: -1 });

export const PaymentModel = mongoose.model<IPaymentDocument, IPaymentModel>("PaymentModel", PaymentSchema);
export default PaymentModel;
