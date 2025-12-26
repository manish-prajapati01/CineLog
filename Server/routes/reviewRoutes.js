/**
 * Review Routes
 * Handle user reviews for movies/TV shows
 */

const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Movie = require("../models/Movie");
const { protect, optionalAuth, adminOnly } = require("../middlewares/auth");

/**
 * @route   POST /api/reviews
 * @desc    Create a review
 * @access  Private
 */
// Renamed route to ensure fresh code execution - Moved to TOP to prevent collision with /:tmdbId/:mediaType
// Renamed route to ensure fresh code execution - Moved to TOP to prevent collision with /:tmdbId/:mediaType
router.get("/user/my-reviews", protect, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Populate missing titles/posters from Movie collection
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        if (!review.movieTitle || !review.posterPath) {
          const movie = await Movie.findOne({
            tmdbId: review.tmdbId,
            mediaType: review.mediaType,
          });
          if (movie) {
            return {
              ...review,
              movieTitle: review.movieTitle || movie.title,
              posterPath: review.posterPath || movie.posterPath,
            };
          }
        }
        return review;
      })
    );

    res.json({ success: true, data: populatedReviews });
  } catch (error) {
    console.error("Error fetching user reviews:", error.message);
    res.json({ success: true, data: [] });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const {
      tmdbId,
      mediaType,
      title,
      content,
      containsSpoilers,
      movieTitle,
      posterPath,
    } = req.body;

    // Check if user already reviewed this
    const existingReview = await Review.findOne({
      userId: req.userId,
      tmdbId,
      mediaType,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this",
      });
    }

    const review = await Review.create({
      userId: req.userId,
      tmdbId,
      mediaType,
      title,
      content,
      containsSpoilers,
    });

    // Create/update movie reference
    await Movie.getOrCreate(tmdbId, mediaType, movieTitle, posterPath);
    await Movie.updateStats(tmdbId, mediaType);

    // Populate user info
    await review.populate("userId", "name avatar");

    res.status(201).json({
      success: true,
      message: "Review created",
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/reviews/:tmdbId/:mediaType
 * @desc    Get reviews for a movie/TV show
 * @access  Public
 */
router.get("/:tmdbId/:mediaType", optionalAuth, async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    const { page = 1, limit = 10, sort = "recent" } = req.query;

    const sortOptions = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { "likes.length": -1 },
    };

    const reviews = await Review.find({
      tmdbId: parseInt(tmdbId),
      mediaType,
      isApproved: true,
    })
      .populate("userId", "name avatar")
      .sort(sortOptions[sort] || sortOptions.recent)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      tmdbId: parseInt(tmdbId),
      mediaType,
      isApproved: true,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/reviews/:id/like
 * @desc    Like/unlike a review
 * @access  Private
 */
router.put("/:id/like", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    const likeIndex = review.likes.indexOf(req.userId);

    if (likeIndex > -1) {
      // Unlike
      review.likes.splice(likeIndex, 1);
    } else {
      // Like
      review.likes.push(req.userId);
    }

    await review.save();

    res.json({
      success: true,
      liked: likeIndex === -1,
      likeCount: review.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (own review or admin)
 * @access  Private
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Check ownership or admin
    if (
      review.userId.toString() !== req.userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await review.deleteOne();

    // Update movie stats
    await Movie.updateStats(review.tmdbId, review.mediaType);

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/reviews/user/me
 * @desc    Get current user's reviews
 * @access  Private
 */
// DELETED FROM BOTTOM

module.exports = router;
