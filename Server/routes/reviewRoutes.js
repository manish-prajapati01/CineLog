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

    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        if (review.movieTitle && review.posterPath) return review;

        let movieTitle = review.movieTitle;
        let posterPath = review.posterPath;

        if (!movieTitle || !posterPath) {
          const movie = await Movie.findOne({
            tmdbId: review.tmdbId,
            mediaType: review.mediaType,
          });
          if (movie) {
            movieTitle = movieTitle || movie.title;
            posterPath = posterPath || movie.posterPath;
          }
        }

        if (!movieTitle) {
          try {
            const { getMovieDetails, getTVDetails } = require("../services/tmdbService");
            const tmdbData =
              review.mediaType === "movie"
                ? await getMovieDetails(review.tmdbId)
                : await getTVDetails(review.tmdbId);
            movieTitle = tmdbData.title || tmdbData.name || null;
            posterPath = posterPath || tmdbData.poster_path || null;

            if (movieTitle) {
              await Review.updateOne(
                { _id: review._id },
                { movieTitle, posterPath }
              );
            }
          } catch (tmdbErr) {
            // Unreachable TMDB is ignored
          }
        }

        return { ...review, movieTitle, posterPath };
      })
    );

    res.json({ success: true, data: populatedReviews });
  } catch (error) {
    console.error("Error fetching user reviews:", error.message);
    res.status(500).json({ success: false, message: "Unable to load reviews" });
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

    if (!Number.isSafeInteger(Number(tmdbId)) || Number(tmdbId) <= 0 || !['movie','tv'].includes(mediaType) || typeof title !== 'string' || typeof content !== 'string' || content.trim().length < 10 || content.length > 5000 || title.length > 100) {
      return res.status(400).json({ success: false, message: 'Use a valid title and a review between 10 and 5000 characters' });
    }
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
      movieTitle: movieTitle || null,
      posterPath: posterPath || null,
    });

    // Cached analytics must not turn a successful review into a failed submission.
    try {
      await Movie.getOrCreate(tmdbId, mediaType, movieTitle || title, posterPath);
      await Movie.updateStats(Number(tmdbId), mediaType);
    } catch (error) { console.error('Review analytics refresh failed:', error.message); }

    // Populate user info
    await review.populate("userId", "name avatar");

    res.status(201).json({
      success: true,
      message: "Review created",
      data: review,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : error.name === "ValidationError" ? 400 : 500).json({ success: false, message: error.code === 11000 ? "You have already reviewed this title" : error.message });
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const sort = req.query.sort || "recent";

    const sortOptions = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { createdAt: -1 },
    };

    const filter = { tmdbId: parseInt(tmdbId), mediaType, isApproved: true };
    let reviews;
    if (sort === 'popular') {
      const rows = await Review.aggregate([
        { $match: filter },
        { $addFields: { likeCount: { $size: { $ifNull: ['$likes', []] } } } },
        { $sort: { likeCount: -1, createdAt: -1 } },
        { $skip: (page - 1) * limit }, { $limit: limit },
      ]);
      reviews = await Review.populate(rows, { path: 'userId', select: 'name avatar' });
    } else {
      reviews = await Review.find(filter).populate('userId', 'name avatar')
        .sort(sortOptions[sort] || sortOptions.recent).skip((page - 1) * limit).limit(limit);
    }

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
    res.status(error.code === 11000 ? 409 : error.name === "ValidationError" ? 400 : 500).json({ success: false, message: error.code === 11000 ? "You have already reviewed this title" : error.message });
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
    res.status(error.code === 11000 ? 409 : error.name === "ValidationError" ? 400 : 500).json({ success: false, message: error.code === 11000 ? "You have already reviewed this title" : error.message });
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
    await Movie.updateStats(review.tmdbId, review.mediaType).catch(error => console.error("Review analytics refresh failed:", error.message));

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : error.name === "ValidationError" ? 400 : 500).json({ success: false, message: error.code === 11000 ? "You have already reviewed this title" : error.message });
  }
});

/**
 * @route   GET /api/reviews/user/me
 * @desc    Get current user's reviews
 * @access  Private
 */
// DELETED FROM BOTTOM

module.exports = router;
