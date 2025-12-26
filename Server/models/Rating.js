/**
 * Rating Model
 * Stores user ratings (1-10) for movies/TV shows
 */

const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
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
    title: {
      type: String,
    },
    posterPath: {
      type: String,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: One rating per user per movie
ratingSchema.index({ userId: 1, tmdbId: 1, mediaType: 1 }, { unique: true });
// Index for aggregating ratings by movie
ratingSchema.index({ tmdbId: 1, mediaType: 1 });

// Static method to get average rating for a movie
ratingSchema.statics.getAverageRating = async function (tmdbId, mediaType) {
  const result = await this.aggregate([
    { $match: { tmdbId, mediaType } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$score" },
        totalRatings: { $sum: 1 },
        distribution: {
          $push: "$score",
        },
      },
    },
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalRatings: 0, distribution: {} };
  }

  // Calculate distribution
  const distribution = {};
  for (let i = 1; i <= 10; i++) {
    distribution[i] = result[0].distribution.filter((s) => s === i).length;
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalRatings: result[0].totalRatings,
    distribution,
  };
};

module.exports = mongoose.model("Rating", ratingSchema);
