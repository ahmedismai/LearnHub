import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedFile: { type: String, required: true },
  status: { type: String, enum: ['Submitted', 'Graded'], default: 'Submitted' },
  score: { type: Number, min: 0 },
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

submissionSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

export const Submission = mongoose.model('Submission', submissionSchema);