/**
 * Watchlist Model
 * Stores user's watchlist items
 */

const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema({
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
    required: true,
  },
  posterPath: {
    type: String,
    default: null,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [watchlistItemSchema],
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup
watchlistSchema.index({ userId: 1 });

// Method to check if item exists in watchlist
watchlistSchema.methods.hasItem = function (tmdbId, mediaType) {
  return this.items.some(
    (item) => item.tmdbId === tmdbId && item.mediaType === mediaType
  );
};

// Method to add item
watchlistSchema.methods.addItem = function (item) {
  if (!this.hasItem(item.tmdbId, item.mediaType)) {
    this.items.push({
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      title: item.title,
      posterPath: item.posterPath,
      addedAt: new Date(),
    });
  }
  return this;
};

// Method to remove item
watchlistSchema.methods.removeItem = function (tmdbId, mediaType) {
  this.items = this.items.filter(
    (item) => !(item.tmdbId === tmdbId && item.mediaType === mediaType)
  );
  return this;
};

module.exports = mongoose.model("Watchlist", watchlistSchema);
