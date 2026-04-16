import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  questions: [{
    questionText: { type: String, required: true },
    options: [String],
    correctAnswerIndex: { type: Number, required: true },
    type: { type: String, default: "Multiple Choice" }
  }],
  totalMarks: { type: Number, default: 100 }
});

export const Quiz= mongoose.model('Quiz', quizSchema);