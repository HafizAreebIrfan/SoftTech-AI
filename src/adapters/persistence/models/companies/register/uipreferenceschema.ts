import mongoose from "mongoose";

export const UiPreferenceSchema = new mongoose.Schema(
  {
    layout: {
      type: String,
      enum: ["grid", "list"],
      default: "grid",
    },
  },
  { _id: false },
);