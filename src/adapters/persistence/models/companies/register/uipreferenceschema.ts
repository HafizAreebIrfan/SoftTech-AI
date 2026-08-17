import mongoose from "mongoose";

export const UiPreferenceSchema = new mongoose.Schema(
  {
    layout: String,
    themeColor: String,
    audienceDefault: String,
  },
  { _id: false },
);
