import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  category: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  thumbnail: { type: String, default: "" },
  lessons: [{
    title: String,
    contentUrl: String,
    duration: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export const Course = mongoose.model('Course', courseSchema);