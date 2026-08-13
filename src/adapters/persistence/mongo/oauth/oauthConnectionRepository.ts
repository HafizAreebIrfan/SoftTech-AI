import { OAuthConnectionModel } from "../../models/oauth/oauthConnectionModel";
import { OAuthTransactionModel } from "../../models/oauth/oauthTransactionModel";
import {
  IOAuthConnection,
  IOAuthTransaction,
} from "../../../../domain/types/oauthConnection.types";

/**
 * Find an active user OAuth connection matching (companyId, apiId, userId).
 */
export const findUserConnection = async (
  companyId: string,
  apiId: string,
  userId: string,
): Promise<IOAuthConnection | null> => {
  const doc = await OAuthConnectionModel.findOne({
    companyId,
    apiId,
    userId,
  } as any).lean();
  return doc as unknown as IOAuthConnection | null;
};

/**
 * Upsert a user OAuth connection record.
 */
export const saveUserConnection = async (
  connection: IOAuthConnection,
): Promise<IOAuthConnection> => {
  const filter = {
    companyId: connection.companyId,
    apiId: connection.apiId,
    userId: connection.userId,
  };

  const update = {
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken ?? null,
    tokenType: connection.tokenType || "Bearer",
    expiresAt: connection.expiresAt ?? null,
    scopes: connection.scopes || [],
  };

  const doc = await (OAuthConnectionModel as any).findOneAndUpdate(
    filter,
    update,
    {
      upsert: true,
      new: true,
    },
  );

  return (doc?.toObject ? doc.toObject() : doc) as IOAuthConnection;
};

/**
 * Remove a user OAuth connection.
 */
export const deleteUserConnection = async (
  companyId: string,
  apiId: string,
  userId: string,
): Promise<void> => {
  await OAuthConnectionModel.deleteOne({ companyId, apiId, userId } as any);
};

/**
 * Create a short-lived PKCE transaction record.
 */
export const createTransaction = async (
  transaction: IOAuthTransaction,
): Promise<IOAuthTransaction> => {
  const doc = await OAuthTransactionModel.create(transaction as any);
  return (doc?.toObject ? doc.toObject() : doc) as IOAuthTransaction;
};

/**
 * Consume a short-lived PKCE transaction record by state (single-use).
 */
export const consumeTransaction = async (
  state: string,
): Promise<IOAuthTransaction | null> => {
  if (!state || !state.trim()) {
    return null;
  }

  const doc = await (OAuthTransactionModel as any).findOneAndDelete({
    state: state.trim(),
  });

  if (!doc) {
    return null;
  }

  const transaction = (doc?.toObject ? doc.toObject() : doc) as IOAuthTransaction;

  if (new Date(transaction.expiresAt) < new Date()) {
    return null;
  }

  return transaction;
};

export const OAuthConnectionRepository = {
  findUserConnection,
  saveUserConnection,
  deleteUserConnection,
  createTransaction,
  consumeTransaction,
};
