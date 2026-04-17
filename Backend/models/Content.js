import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'Lesson', 'Quiz', 'Assignment'
  duration: { type: String },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
}, {
  discriminatorKey: 'contentType',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' }
});

contentSchema.virtual('contentId').get(function() {
  return this._id.toHexString();
});

export const Content = mongoose.model('Content', contentSchema);

// Lesson Discriminator
export const Lesson = Content.discriminator('Lesson', new mongoose.Schema({
  contentUrl: { type: String, required: true }
}));

Lesson.virtual('lessonId').get(function() {
  return this._id.toHexString();
});

// Quiz Discriminator
export const Quiz = Content.discriminator('Quiz', new mongoose.Schema({
  totalMarks: { type: Number, default: 100 }
}));

Quiz.virtual('quizId').get(function() {
  return this._id.toHexString();
});

// Assignment Discriminator
export const Assignment = Content.discriminator('Assignment', new mongoose.Schema({
  dueDate: { type: Date, required: true }
}));

Assignment.virtual('assignmentId').get(function() {
  return this._id.toHexString();
});