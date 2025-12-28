/**
 * Movies Routes
 * Handle TMDB movie data fetching with all endpoints
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
 * @route   GET /api/movies/discover
 * @desc    Advanced movie discovery with filters (Year, Language, Genres, etc.)
 */
router.get("/discover", async (req, res) => {
  try {
    const data = await tmdb.discoverMovies(req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/trending
 */
router.get("/trending", async (req, res) => {
  try {
    const { timeWindow = "week" } = req.query;
    const movies = await tmdb.getTrendingMovies(timeWindow);
    res.json({ success: true, results: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/popular
 */
router.get("/popular", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;

    const data = await tmdb.getPopularMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/trending/india
 * @desc    Get trending movies in India
 */
router.get("/trending/india", async (req, res) => {
  try {
    const { timeWindow = "week" } = req.query;
    const movies = await tmdb.getTrendingIndia(timeWindow);
    res.json({ success: true, results: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/indian/all
 * @desc    Get all Indian movies sorted by latest release
 */
router.get("/indian/all", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAllIndianMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/indian/airing
 * @desc    Get currently airing/now playing Indian movies
 */
router.get("/indian/airing", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAiringIndianMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/popular/indian
 * @desc    Get popular Indian movies (all industries)
 */
router.get("/popular/indian", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getPopularIndianMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/indian/upcoming
 * @desc    Get upcoming Indian movies
 */
router.get("/indian/upcoming", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getUpcomingIndianMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/indian/top_rated
 * @desc    Get top rated Indian movies
 */
router.get("/indian/top_rated", async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const filters = genre ? { with_genres: genre } : {};
    const data = await tmdb.getTopRatedIndianMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/hollywood/all
 * @desc    Get all Hollywood movies sorted by latest release
 */
router.get("/hollywood/all", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getAllHollywoodMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/hollywood/airing
 * @desc    Get currently airing/now playing Hollywood movies
 */
router.get("/hollywood/airing", async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const filters = genre ? { with_genres: genre } : {};
    const data = await tmdb.getAiringHollywoodMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/popular/hollywood
 * @desc    Get popular Hollywood/foreign movies
 */
router.get("/popular/hollywood", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getPopularHollywoodMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/hollywood/upcoming
 * @desc    Get upcoming Hollywood movies
 */
router.get("/hollywood/upcoming", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getUpcomingHollywoodMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/hollywood/top_rated
 * @desc    Get top rated Hollywood movies
 */
router.get("/hollywood/top_rated", async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const filters = genre ? { with_genres: genre } : {};
    const data = await tmdb.getTopRatedHollywoodMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/now_playing
 */
router.get("/now_playing", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getNowPlayingMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/upcoming
 */
router.get("/upcoming", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getUpcomingMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/top_rated
 */
router.get("/top_rated", async (req, res) => {
  try {
    const { page = 1, genre, sort_by, language } = req.query;
    const filters = {};
    if (genre) filters.with_genres = genre;
    if (sort_by) filters.sort_by = sort_by;
    if (language) filters.language = language;
    const data = await tmdb.getTopRatedMovies(parseInt(page), filters);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/search
 */
router.get("/search", async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }
    const data = await tmdb.searchMovies(q, parseInt(page));
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/genres
 */
router.get("/genres", async (req, res) => {
  try {
    const genres = await tmdb.getMovieGenres();
    res.json({ success: true, genres });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/genre/:genreId
 */
router.get("/genre/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    const data = await tmdb.getMoviesByGenre(parseInt(genreId), parseInt(page));
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======== DYNAMIC :id ROUTES - SPECIFIC PATHS FIRST ========

/**
 * @route   GET /api/movies/:id/credits
 */
router.get("/:id/credits", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getMovieCredits(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/:id/similar
 */
router.get("/:id/similar", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getSimilarMovies(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/movies/:id/videos
 */
router.get("/:id/videos", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getMovieVideos(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======== GENERIC :id ROUTE - MUST BE LAST ========

/**
 * @route   GET /api/movies/:id
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await tmdb.getMovieDetails(parseInt(id));

    // Get community ratings (with fallback if models don't have these methods)
    let ratingStats = { averageRating: 0, totalRatings: 0 };
    let reviewStats = { totalReviews: 0 };

    try {
      if (Rating.getAverageRating) {
        ratingStats = await Rating.getAverageRating(parseInt(id), "movie");
      }
      if (Review.getReviewStats) {
        reviewStats = await Review.getReviewStats(parseInt(id), "movie");
      }
    } catch (e) {
      console.log("Rating/Review stats not available:", e.message);
    }

    res.json({
      success: true,
      data: {
        ...movie,
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
