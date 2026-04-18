import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      required: true,
    },
    profileImage: { type: String, default: "" },
    emailConfirmed: { type: Boolean, default: false },
    confirmationToken: { type: String, default: "" },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date },
    refreshToken: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    discriminatorKey: "roleType",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Update Profile Method
userSchema.methods.updateProfile = function (data) {
  if (data.name) this.name = data.name;
  if (data.bio && this.role === ROLES.INSTRUCTOR) this.bio = data.bio;
  if (data.profileImage) this.profileImage = data.profileImage;
  return this.save();
};

export const User = mongoose.model("User", userSchema);

// Admin Discriminator
export const Admin = User.discriminator(
  ROLES.ADMINISTRATOR,
  new mongoose.Schema({
    adminId: {
      type: String,
      default: function () {
        return this._id.toHexString();
      },
    },
  }),
);

// Instructor Discriminator
export const Instructor = User.discriminator(
  ROLES.INSTRUCTOR,
  new mongoose.Schema({
    instructorId: {
      type: String,
      default: function () {
        return this._id.toHexString();
      },
    },
    bio: { type: String, default: "" },
  }),
);

// Student Discriminator
export const Student = User.discriminator(
  ROLES.STUDENT,
  new mongoose.Schema({
    studentId: {
      type: String,
      default: function () {
        return this._id.toHexString();
      },
    },
    enrollmentDate: { type: Date, default: Date.now },
  }),
);
