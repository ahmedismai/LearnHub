import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

reviewSchema.virtual('reviewId').get(function() {
  return this._id.toHexString();
});

export const Review = mongoose.model('Review', reviewSchema);