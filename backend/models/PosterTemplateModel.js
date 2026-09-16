import mongoose from "mongoose";

const posterTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    cloudinary_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("PosterTemplate", posterTemplateSchema);