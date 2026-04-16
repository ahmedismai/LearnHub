import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrollmentDate: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  completedLessons: [{ type: String }],
  completedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  completed: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' }
});

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment= mongoose.model('Enrollment', enrollmentSchema);