/**
 * TV Shows Routes
 * Handle TMDB TV show data fetching with all endpoints
 */

const express = require("express");
const router = express.Router();
const tmdb = require("../services/tmdbService");
const { optionalAuth } = require("../middlewares/auth");
const Rating = require("../models/Rating");
const Review = require("../models/Review");

// ======== STATIC ROUTES FIRST ========

// ...existing routes...

/**
 * @route   GET /api/tv/discover
 * @desc    Advanced TV discovery with filters
 */
router.get("/discover", async (req, res) => {
  try {
    const data = await tmdb.discoverTV(req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/trending
 */
router.get("/trending", async (req, res) => {
  try {
    const { timeWindow = "week" } = req.query;
    const shows = await tmdb.getTrendingTV(timeWindow);
    res.json({ success: true, results: shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/popular
 */
router.get("/popular", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getPopularTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/indian/all
 * @desc    Get all Indian TV shows sorted by latest release
 */
router.get("/indian/all", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAllIndianTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/indian/airing
 * @desc    Get currently airing Indian TV shows
 */
router.get("/indian/airing", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAiringIndianTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/popular/indian
 * @desc    Get popular Indian TV shows/web series
 */
router.get("/popular/indian", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getPopularIndianTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/indian/upcoming
 * @desc    Get upcoming Indian TV shows
 */
router.get("/indian/upcoming", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getUpcomingIndianTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/indian/top_rated
 * @desc    Get top rated Indian TV shows
 */
router.get("/indian/top_rated", async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const filters = genre ? { with_genres: genre } : {};
    const data = await tmdb.getTopRatedIndianTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/hollywood/all
 * @desc    Get all Hollywood TV shows sorted by latest release
 */
router.get("/hollywood/all", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAllHollywoodTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/hollywood/airing
 * @desc    Get currently airing Hollywood TV shows
 */
router.get("/hollywood/airing", async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const filters = genre ? { with_genres: genre } : {};
    const data = await tmdb.getAiringHollywoodTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/popular/hollywood
 * @desc    Get popular Hollywood/foreign TV shows
 */
router.get("/popular/hollywood", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getPopularHollywoodTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/hollywood/upcoming
 * @desc    Get upcoming Hollywood TV shows
 */
router.get("/hollywood/upcoming", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getUpcomingHollywoodTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/hollywood/top_rated
 * @desc    Get top rated Hollywood TV shows
 */
router.get("/hollywood/top_rated", async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const filters = genre ? { with_genres: genre } : {};
    const data = await tmdb.getTopRatedHollywoodTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/airing_today
 */
router.get("/airing_today", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAiringTodayTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/on_the_air
 */
router.get("/on_the_air", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getOnTheAirTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/top_rated
 */
router.get("/top_rated", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getTopRatedTV(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/search
 */
router.get("/search", async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }
    const data = await tmdb.searchTV(q, parseInt(page));
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/genres
 */
router.get("/genres", async (req, res) => {
  try {
    const genres = await tmdb.getTVGenres();
    res.json({ success: true, genres });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/genre/:genreId
 */
router.get("/genre/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    const data = await tmdb.getTVByGenre(parseInt(genreId), parseInt(page));
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======== DYNAMIC :id ROUTES - SPECIFIC PATHS FIRST ========

/**
 * @route   GET /api/tv/:id/credits
 */
router.get("/:id/credits", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getTVCredits(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/:id/similar
 */
router.get("/:id/similar", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getSimilarTV(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/:id/videos
 */
router.get("/:id/videos", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getTVVideos(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tv/:id/season/:seasonNumber
 */
router.get("/:id/season/:seasonNumber", async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await tmdb.getTVSeasonDetails(
      parseInt(id),
      parseInt(seasonNumber)
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======== GENERIC :id ROUTE - MUST BE LAST ========

/**
 * @route   GET /api/tv/:id
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const show = await tmdb.getTVDetails(parseInt(id));

    // Get community ratings (with fallback)
    let ratingStats = { averageRating: 0, totalRatings: 0 };
    let reviewStats = { totalReviews: 0 };

    try {
      if (Rating.getAverageRating) {
        ratingStats = await Rating.getAverageRating(parseInt(id), "tv");
      }
      if (Review.getReviewStats) {
        reviewStats = await Review.getReviewStats(parseInt(id), "tv");
      }
    } catch (e) {
      console.log("Rating/Review stats not available:", e.message);
    }

    res.json({
      success: true,
      data: {
        ...show,
        communityRating: ratingStats.averageRating || 0,
        totalRatings: ratingStats.totalRatings || 0,
        totalReviews: reviewStats.totalReviews || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
