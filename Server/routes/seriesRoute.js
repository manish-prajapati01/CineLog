const Series = require("../models/seriesModel");
const express = require("express");
const router = express.Router();
const authMiddlewares = require("../middlewares/authMiddlewares");

// Add Series
router.post("/add-series", authMiddlewares, async (req, res) => {
  try {
    req.body.createdBy = req.userId;
    await Series.create(req.body);
    res.status(200).json({ message: "Series added successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Get all Series
router.get("/", authMiddlewares, async (req, res) => {
  try {
    const series = await Series.find()
      .populate("cast")
      .populate("hero")
      .populate("heroine")
      .populate("director")
      .populate("createdBy")
      .sort({ createdAt: -1 });
    res.status(200).json({ data: series, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Get Series by ID
router.get("/:id", authMiddlewares, async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
      .populate("cast")
      .populate("hero")
      .populate("heroine")
      .populate("director")
      .populate("createdBy");
    res.status(200).json({ data: series, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Update Series
router.put("/:id", authMiddlewares, async (req, res) => {
  try {
    const updatedSeries = await Series.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res
      .status(200)
      .json({
        message: "Series Updated successfully",
        data: updatedSeries,
        success: true,
      });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Delete Series
router.delete("/:id", authMiddlewares, async (req, res) => {
  try {
    const deletedSeries = await Series.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: "Series Deleted successfully", success: true, data: deletedSeries });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

module.exports = router;
