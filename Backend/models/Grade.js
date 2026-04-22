import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
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
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content", // Refers to the Quiz (Content discriminator)
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content", // Refers to the Assignment (Content discriminator)
      index: true,
    },
    type: {
      type: String,
      enum: ["Quiz", "Exam", "Assignment"],
      required: true,
    },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    submittedAnswers: [{ type: Number }],
    aiFeedback: { type: String },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure a student has only one grade per specific assessment
gradeSchema.index({ studentId: 1, quizId: 1 }, { unique: true, partialFilterExpression: { quizId: { $exists: true } } });
gradeSchema.index({ studentId: 1, examId: 1 }, { unique: true, partialFilterExpression: { examId: { $exists: true } } });
gradeSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true, partialFilterExpression: { assignmentId: { $exists: true } } });

export const Grade = mongoose.model("Grade", gradeSchema);
