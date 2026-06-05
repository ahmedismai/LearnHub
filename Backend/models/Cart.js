import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true },
);

cartItemSchema.index(
  { studentId: 1, courseId: 1 },
  { unique: true, name: "cart_student_course_unique" },
);

cartItemSchema.virtual("cartItemId").get(function () {
  return this._id.toHexString();
});

export const CartItem = mongoose.model("CartItem", cartItemSchema);
