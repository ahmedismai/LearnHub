import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(ROLES),
    default: ROLES.STUDENT
  },
  bio: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('userID').get(function() {
  return this._id.toHexString();
});

userSchema.methods.updateProfile = function(data) {
  if (data.username) this.username = data.username;
  if (data.bio) this.bio = data.bio;
  if (data.profileImage) this.profileImage = data.profileImage;
  return this.save();
};

export const User = mongoose.model('User', userSchema);