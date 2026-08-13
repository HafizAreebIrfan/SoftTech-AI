import mongoose, { Schema, Document } from "mongoose";
import { IOAuthConnection } from "../../../../domain/types/oauthConnection.types";

export interface IOAuthConnectionDocument
  extends Omit<IOAuthConnection, "_id">,
    Document {}

const OAuthConnectionSchema = new Schema<IOAuthConnectionDocument>(
  {
    companyId: { type: String, required: true, index: true },
    apiId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, default: null },
    tokenType: { type: String, default: "Bearer" },
    expiresAt: { type: Date, default: null },
    scopes: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

// Compound unique index so each user has at most one active OAuth connection per company API
OAuthConnectionSchema.index(
  { companyId: 1, apiId: 1, userId: 1 },
  { unique: true },
);

export const OAuthConnectionModel =
  mongoose.models.OAuthConnection ||
  mongoose.model<IOAuthConnectionDocument>(
    "OAuthConnection",
    OAuthConnectionSchema,
  );
