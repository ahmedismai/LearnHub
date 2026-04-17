import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  text: { type: String, required: true },
  type: { type: String, default: "Multiple Choice" },
  correctAnswer: { type: String, required: true },
  options: [String] // Added to make it functional for MCQs
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

questionSchema.virtual('questionId').get(function() {
  return this._id.toHexString();
});

export const Question = mongoose.model('Question', questionSchema);