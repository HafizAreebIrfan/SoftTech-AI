import mongoose, { Document, Model } from "mongoose";

export interface IActivityLogDocument extends Document {
  action: string;
  actorId?: mongoose.Types.ObjectId | string;
  actorType?: string;
  meta?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IActivityLogModel extends Model<IActivityLogDocument> {}

const ActivityLogSchema = new mongoose.Schema<IActivityLogDocument, IActivityLogModel>(
  {
    action: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyModel", required: false },
    actorType: { type: String, default: "system" },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ActivityLogModel = mongoose.model<IActivityLogDocument, IActivityLogModel>(
  "ActivityLog",
  ActivityLogSchema,
);

export default ActivityLogModel;
