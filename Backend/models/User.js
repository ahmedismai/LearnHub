import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(ROLES),
    default: ROLES.STUDENT
  },
  bio: { type: String, default: "" }, // خاص بالمدرب كما في الـ Diagram
  profileImage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);