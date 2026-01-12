/**
 * Search Routes
 * Multi-search across movies, TV shows, and people
 */

const express = require("express");
const router = express.Router();
const tmdb = require("../services/tmdbService");

/**
 * @route   GET /api/search/multi
 * @desc    Multi-search (movies, TV, people)
 */
router.get("/multi", async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }

    // 1. Search Local MongoDB
    const Movie = require("../models/movieModels");
    const localMovies = await Movie.find({
      name: { $regex: q, $options: "i" },
    }).limit(5); // Limit local results to mix well

    // Map local movies to TMDB-like structure
    const localResults = localMovies.map((movie) => ({
      id: movie._id,
      _id: movie._id, // Keep original ID
      title: movie.name,
      name: movie.name,
      poster_path: movie.posters?.[0], // Use first poster
      media_type: "movie",
      release_date: movie.releaseDate,
      overview: movie.plot,
      is_local: true, // Flag to identify local content for specific handling
    }));

    // 2. Search TMDB
    const tmdbData = await tmdb.multiSearch(q, parseInt(page));

    // 3. Merge Results (Local first)
    const combinedResults = [...localResults, ...(tmdbData.results || [])];

    res.json({
      success: true,
      results: combinedResults,
      total_pages: tmdbData.total_pages,
      total_results: (tmdbData.total_results || 0) + localResults.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/search/movie
 * @desc    Search movies only
 */
router.get("/movie", async (req, res) => {
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
 * @route   GET /api/search/tv
 * @desc    Search TV shows only
 */
router.get("/tv", async (req, res) => {
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
 * @route   GET /api/search/person
 * @desc    Search people only
 */
router.get("/person", async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }
    const data = await tmdb.searchPeople(q, parseInt(page));
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/search/person/:id
 * @desc    Get person details
 */
router.get("/person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const person = await tmdb.getPersonDetails(parseInt(id));
    res.json({ success: true, data: person });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/search/person/:id/credits
 * @desc    Get person combined credits
 */
router.get("/person/:id/credits", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getPersonCredits(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
