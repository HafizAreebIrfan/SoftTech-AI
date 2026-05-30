import mongoose from "mongoose";
import { env } from "../config/env";

export const connectDB = async (): Promise<void> => {
  if (!env.MONGO_URI) {
    console.log("MONGO_URI not set, skipping MongoDB connection");
    return;
  }

  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
};
