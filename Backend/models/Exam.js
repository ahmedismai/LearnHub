import mongoose from "mongoose";

const examQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, default: "Multiple Choice" },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
  },
  { _id: true },
);

const examSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, default: "30m" },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
    totalMarks: { type: Number, required: true, default: 100 },
    questions: [examQuestionSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

examSchema.virtual("examId").get(function () {
  return this._id.toHexString();
});

export const Exam = mongoose.model("Exam", examSchema);
