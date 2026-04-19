import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  // Supports both Content (Assignment/Quiz) and Exam
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { type: String, enum: ['Assignment', 'Quiz', 'Exam'], required: true },
  submittedFile: { type: String }, // For Assignments
  answers: [{
    questionId: String,
    selectedOption: String,
    isCorrect: Boolean
  }], // For Quizzes and Exams

  status: { type: String, enum: ['Submitted', 'Graded'], default: 'Submitted' },
  score: { type: Number, min: 0, default: 0 },
  totalQuestions: { type: Number },
  correctCount: { type: Number },
  feedback: { type: String },
  date: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

submissionSchema.virtual('submissionId').get(function() {
  return this._id.toHexString();
});

// Allow multiple submissions if it's an AI practice, but unique for official IDs
submissionSchema.index({ studentId: 1, contentId: 1, examId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
