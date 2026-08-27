import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema(
  {
    whatsappNumber: {
      type: String,
      required: true,
      default: "918291895854",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("SiteSetting", siteSettingSchema);
