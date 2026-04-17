import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
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
      index: true,
    },
    issueDate: { type: Date, default: Date.now },
    certificateUrl: { type: String, default: "" },
  },
  { 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true 
  }
);

certificateSchema.virtual('certificateId').get(function() {
  return this._id.toHexString();
});

certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Certificate = mongoose.model("Certificate", certificateSchema);
