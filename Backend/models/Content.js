import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: String },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
  },
  {
    discriminatorKey: "contentType",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: { createdAt: "createdDate", updatedAt: "updatedDate" },
  },
);

contentSchema.virtual("contentId").get(function () {
  return this._id.toHexString();
});

export const Content = mongoose.model("Content", contentSchema);

// Lesson Discriminator
const lessonSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true },
});

lessonSchema.virtual("lessonId").get(function () {
  return this._id.toHexString();
});

export const Lesson = Content.discriminator("Lesson", lessonSchema);

// Quiz Discriminator
const quizSchema = new mongoose.Schema({
  totalMarks: { type: Number, default: 100 },
});

quizSchema.virtual("quizId").get(function () {
  return this._id.toHexString();
});

export const Quiz = Content.discriminator("Quiz", quizSchema);

// Assignment Discriminator
const assignmentSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
});

assignmentSchema.virtual("assignmentId").get(function () {
  return this._id.toHexString();
});

export const Assignment = Content.discriminator("Assignment", assignmentSchema);
