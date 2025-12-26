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
    const data = await tmdb.multiSearch(q, parseInt(page));
    res.json({ success: true, ...data });
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
