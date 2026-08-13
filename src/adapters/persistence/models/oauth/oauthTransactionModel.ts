import mongoose, { Schema, Document } from "mongoose";
import { IOAuthTransaction } from "../../../../domain/types/oauthConnection.types";

export interface IOAuthTransactionDocument
  extends Omit<IOAuthTransaction, "_id">,
    Document {}

const OAuthTransactionSchema = new Schema<IOAuthTransactionDocument>(
  {
    state: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true },
    apiId: { type: String, required: true },
    userId: { type: String, required: true },
    codeVerifier: { type: String, required: true },
    redirectUri: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL index
  },
  {
    timestamps: true,
  },
);

export const OAuthTransactionModel =
  mongoose.models.OAuthTransaction ||
  mongoose.model<IOAuthTransactionDocument>(
    "OAuthTransaction",
    OAuthTransactionSchema,
  );
