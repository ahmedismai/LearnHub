import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ["Visa", "E-Wallet"], required: true },
    review: { type: String, default: "" },
  },
  {
    discriminatorKey: "paymentType",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

paymentSchema.virtual("paymentId").get(function () {
  return this._id.toHexString();
});

export const Payment = mongoose.model("Payment", paymentSchema);

// Visa Discriminator
export const Visa = Payment.discriminator(
  "Visa",
  new mongoose.Schema({
    status: { type: String, enum: ["Success", "Failed"], default: "Success" },
  }),
);

// E-Wallet Discriminator
export const EWallet = Payment.discriminator(
  "E-Wallet",
  new mongoose.Schema({
    status: { type: String, enum: ["Success", "Failed"], default: "Success" },
  }),
);
