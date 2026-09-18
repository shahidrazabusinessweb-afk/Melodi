import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "products",
      },
    ],

    payment: [],

    paymentStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Processing", "Success", "Failed", "Canceled"],
    },

    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
    },

    deliveryAddress: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Not Process",
      enum: [
        "Pending Payment",
        "Not Process",
        "Processing",
        "Shipped",
        "Delivered",
        "Canceled",
      ],
    },
  },
  { timestamps: true },
);
// Add indexes for frequently queried fields
orderSchema.index({ buyer: 1 });
orderSchema.index({ buyer: 1, status: 1 }); // Compound index for filtering by buyer and status
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
