import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  progress: { type: Number, default: 0 },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  completedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  completedAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  completedExams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],
  completed: { type: Boolean, default: false },
  isRevoked: { type: Boolean, default: false },
  canGenerateCertificate: { type: Boolean, default: false },
  averageExamScore: { type: Number, default: 0 }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

enrollmentSchema.virtual('enrollmentId').get(function() {
  return this._id.toHexString();
});

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);