import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
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

wishlistItemSchema.index(
  { studentId: 1, courseId: 1 },
  { unique: true, name: "wishlist_student_course_unique" },
);

wishlistItemSchema.virtual("wishlistItemId").get(function () {
  return this._id.toHexString();
});

export const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);
