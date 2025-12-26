/**
 * Watchlist Routes
 * Handle user watchlist operations
 */

const express = require("express");
const router = express.Router();
const Watchlist = require("../models/Watchlist");
const { protect } = require("../middlewares/auth");

/**
 * @route   GET /api/watchlist
 * @desc    Get user's watchlist
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ userId: req.userId });

    if (!watchlist) {
      watchlist = await Watchlist.create({ userId: req.userId, items: [] });
    }

    res.json({
      success: true,
      data: watchlist.items,
      count: watchlist.items.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/watchlist
 * @desc    Add item to watchlist
 * @access  Private
 */
router.post("/", protect, async (req, res) => {
  try {
    const { tmdbId, mediaType, title, posterPath } = req.body;

    let watchlist = await Watchlist.findOne({ userId: req.userId });

    if (!watchlist) {
      watchlist = new Watchlist({ userId: req.userId, items: [] });
    }

    if (watchlist.hasItem(tmdbId, mediaType)) {
      return res.status(400).json({
        success: false,
        message: "Already in watchlist",
      });
    }

    watchlist.addItem({ tmdbId, mediaType, title, posterPath });
    await watchlist.save();

    res.status(201).json({
      success: true,
      message: "Added to watchlist",
      data: watchlist.items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/watchlist/:tmdbId/:mediaType
 * @desc    Remove item from watchlist
 * @access  Private
 */
router.delete("/:tmdbId/:mediaType", protect, async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;

    const watchlist = await Watchlist.findOne({ userId: req.userId });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: "Watchlist not found",
      });
    }

    watchlist.removeItem(parseInt(tmdbId), mediaType);
    await watchlist.save();

    res.json({
      success: true,
      message: "Removed from watchlist",
      data: watchlist.items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/watchlist/check/:tmdbId/:mediaType
 * @desc    Check if item is in watchlist
 * @access  Private
 */
router.get("/check/:tmdbId/:mediaType", protect, async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;

    const watchlist = await Watchlist.findOne({ userId: req.userId });

    res.json({
      success: true,
      inWatchlist: watchlist?.hasItem(parseInt(tmdbId), mediaType) || false,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
