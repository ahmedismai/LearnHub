import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    thumbnail: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

courseSchema.virtual("courseId").get(function () {
  return this._id.toHexString();
});

// Virtual for Contents
courseSchema.virtual("contents", {
  ref: "Content",
  localField: "_id",
  foreignField: "courseId",
});

// Virtual for Sections
courseSchema.virtual("sections", {
  ref: "Section",
  localField: "_id",
  foreignField: "courseId",
});

export const Course = mongoose.model("Course", courseSchema);
