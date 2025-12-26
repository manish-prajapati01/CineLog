/**
 * Movie Reference Model
 * Lightweight reference for faster joins and analytics
 */

const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
    // Cached aggregated data
    avgRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // For featuring movies
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
movieSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });
movieSchema.index({ isFeatured: 1 });
movieSchema.index({ avgRating: -1 });
movieSchema.index({ totalReviews: -1 });

// Static method to get or create movie reference
movieSchema.statics.getOrCreate = async function (
  tmdbId,
  mediaType,
  title,
  posterPath
) {
  let movie = await this.findOne({ tmdbId, mediaType });
  if (!movie) {
    movie = await this.create({ tmdbId, mediaType, title, posterPath });
  }
  return movie;
};

// Static method to update stats
movieSchema.statics.updateStats = async function (tmdbId, mediaType) {
  const Rating = require("./Rating");
  const Review = require("./Review");

  const ratingStats = await Rating.getAverageRating(tmdbId, mediaType);
  const reviewStats = await Review.getReviewStats(tmdbId, mediaType);

  await this.findOneAndUpdate(
    { tmdbId, mediaType },
    {
      avgRating: ratingStats.averageRating,
      totalRatings: ratingStats.totalRatings,
      totalReviews: reviewStats.totalReviews,
    }
  );
};

module.exports = mongoose.model("Movie", movieSchema);
