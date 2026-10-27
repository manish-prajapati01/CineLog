/**
 * User Model
 * Handles user accounts with role-based access
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include in queries by default
    },
    sessionVersion: { type: Number, default: 0 },
    emailVerifiedAt: { type: Date, default: null },
    passwordResetSentAt: { type: Date, select: false },
    emailVerificationSentAt: { type: Date, select: false },
    passwordResetHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    activityLog: [
      {
        action: { type: String, required: true }, // 'rated', 'reviewed', 'watchlist'
        targetId: { type: String, required: true }, // TMDB ID
        targetTitle: String,
        targetType: { type: String, enum: ["movie", "tv", "person"] },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries

userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
