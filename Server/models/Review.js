/**
 * Review Model
 * Stores user reviews for movies/TV shows
 */

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tmdbId: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
    movieTitle: {
      type: String,
      default: null,
    },
    posterPath: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Review content is required"],
      trim: true,
      minlength: [10, "Review must be at least 10 characters"],
      maxlength: [5000, "Review cannot exceed 5000 characters"],
    },
    containsSpoilers: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve, admin can moderate later
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for like count
reviewSchema.virtual("likeCount").get(function () {
  return this.likes?.length || 0;
});

// Indexes
reviewSchema.index({ tmdbId: 1, mediaType: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isApproved: 1, isFeatured: 1 });

// Static method to get review stats for a movie
reviewSchema.statics.getReviewStats = async function (tmdbId, mediaType) {
  const result = await this.aggregate([
    { $match: { tmdbId, mediaType, isApproved: true } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { totalReviews: 0, totalLikes: 0 };
};

module.exports = mongoose.model("Review", reviewSchema);
