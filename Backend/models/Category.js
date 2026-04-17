import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

categorySchema.virtual('categoryId').get(function() {
  return this._id.toHexString();
});

export const Category = mongoose.model('Category', categorySchema);