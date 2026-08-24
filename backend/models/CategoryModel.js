import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    brandName: {
      type: String,
      trim: true,
      default: "",
    },
    sizeType: {
      type: String,
      enum: ["none", "dimensions", "apparel"],
      default: "none",
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    image: {
      data: Buffer,
      contentType: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("category", categorySchema);
