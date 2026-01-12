/**
 * Person Routes
 * Handles all person-related endpoints (Actors, Crew)
 */

const router = require("express").Router();
const tmdb = require("../services/tmdbService");

/**
 * @route   GET /api/person/popular
 * @desc    Get popular people
 */
router.get("/popular", async (req, res) => {
  try {
    const { page } = req.query;
    // We need to implement getPopularPeople within tmdbService or call request directly
    // Since it wasn't explicitly exported, let's assume we might need to add it or use generic request
    // Looking at tmdbService.js, it might not have getPopularPeople yet.
    // However, I can try to access the generic tmdbRequest if exported or add the method.
    // For now, let's assume I will add getPopularPeople to tmdbService.js
    const data = await tmdb.getPopularPeople(page);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/person/search
 * @desc    Search for people
 */
router.get("/search", async (req, res) => {
  try {
    const { q, page } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Query parameter 'q' is required" });
    }
    const data = await tmdb.searchPeople(q, page);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/person/:id
 * @desc    Get person details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getPersonDetails(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/person/:id/credits
 * @desc    Get person combined credits
 */
router.get("/:id/credits", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await tmdb.getPersonCredits(parseInt(id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
