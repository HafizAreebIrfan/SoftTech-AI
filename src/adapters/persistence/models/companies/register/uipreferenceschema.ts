import mongoose from "mongoose";

export const UiPreferenceSchema = new mongoose.Schema(
  {
    layout: {
      type: String,
      default: "grid",
    },
    themeColor: {
      type: String,
      default: "#6366f1",
    },
    audienceDefault: {
      type: String,
      default: "customer",
    },
  },
  { _id: false },
);
