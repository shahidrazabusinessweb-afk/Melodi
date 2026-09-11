import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "category",
      required: true,
    },

    photos: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    shipping: {
      type: Boolean,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    colors: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    dimensions: {
      height: { type: Number },
      width: { type: Number },
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    ratings: [
      {
        user: {
          type: mongoose.ObjectId,
          ref: "users",
        },
        value: {
          type: Number,
          min: 1,
          max: 5,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// Add indexes for frequently queried fields
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text" });
productSchema.index({ category: 1, price: 1 }); // Compound index for filters

export default mongoose.model("products", productSchema);
