import mongoose from "mongoose";

export const UiPreferenceSchema = new mongoose.Schema(
  {
    layout: String,
  },
  { _id: false },
);
