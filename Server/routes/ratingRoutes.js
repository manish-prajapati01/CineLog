/**
 * Rating Routes
 * Handle user ratings for movies/TV shows
 */

const express = require("express");
const router = express.Router();
const Rating = require("../models/Rating");
const Movie = require("../models/Movie");
const { protect } = require("../middlewares/auth");

/**
 * @route   POST /api/ratings
 * @desc    Add or update rating
 * @access  Private
 */
// Moved to TOP to prevent collision with /:tmdbId/:mediaType
router.get("/user/me", protect, async (req, res) => {
  try {
    const ratings = await Rating.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { tmdbId, mediaType, score, title, posterPath } = req.body;

    // Validate score
    if (!Number.isInteger(score) || score < 1 || score > 10 || !Number.isSafeInteger(Number(tmdbId)) || Number(tmdbId) < 1 || !["movie", "tv"].includes(mediaType) || typeof title !== "string" || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Score must be between 1 and 10" });
    }

    // Upsert rating
    const rating = await Rating.findOneAndUpdate(
      { userId: req.userId, tmdbId, mediaType },
      { score, title, posterPath },
      { new: true, upsert: true, runValidators: true }
    );

    // Create/update movie reference for analytics
    try {
      await Movie.getOrCreate(Number(tmdbId), mediaType, title, posterPath);
      await Movie.updateStats(Number(tmdbId), mediaType);
    } catch (error) { console.error('Rating analytics refresh failed:', error.message); }

    res.json({
      success: true,
      message: "Rating saved",
      data: rating,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/ratings/:tmdbId/:mediaType
 * @desc    Get rating stats for a movie/TV show
 * @access  Public
 */
router.get('/community/:tmdbId/:mediaType', async (req,res,next) => {
 try {
  const {tmdbId,mediaType}=req.params;
  if(!/^\d+$/.test(tmdbId)||!Number.isSafeInteger(Number(tmdbId))||Number(tmdbId)<1||!['movie','tv'].includes(mediaType)) return res.status(400).json({success:false,message:'Invalid title'});
  const page=Math.max(1,Math.min(10000,parseInt(req.query.page)||1)),limit=12;
  const filter={tmdbId:Number(tmdbId),mediaType};
  const [rows,total]=await Promise.all([
   Rating.find(filter).select('score userId updatedAt').populate('userId','name isActive').sort({updatedAt:-1,_id:-1}).skip((page-1)*limit).limit(limit).lean(),
   Rating.countDocuments(filter)
  ]);
  res.json({success:true,data:rows.map(r=>({id:r._id,score:r.score,date:r.updatedAt,user:r.userId?.isActive?{id:r.userId._id,name:r.userId.name}:null})),pagination:{page,pages:Math.ceil(total/limit),total}});
 } catch(e){next(e);}
});

router.get("/:tmdbId/:mediaType", async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    const stats = await Rating.getAverageRating(parseInt(tmdbId), mediaType);
    res.json({ success: true, ...stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETED FROM BOTTOM

/**
 * @route   GET /api/ratings/user/:tmdbId/:mediaType
 * @desc    Get user's rating for a specific movie/TV show
 * @access  Private
 */
router.get("/user/:tmdbId/:mediaType", protect, async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    const rating = await Rating.findOne({
      userId: req.userId,
      tmdbId: parseInt(tmdbId),
      mediaType,
    });
    res.json({
      success: true,
      data: rating ? { score: rating.score } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/ratings/:tmdbId/:mediaType
 * @desc    Remove user's rating
 * @access  Private
 */
router.delete("/:tmdbId/:mediaType", protect, async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    await Rating.findOneAndDelete({
      userId: req.userId,
      tmdbId: parseInt(tmdbId),
      mediaType,
    });

    // Update movie stats
    await Movie.updateStats(parseInt(tmdbId), mediaType).catch(error => console.error("Rating analytics refresh failed:", error.message));

    res.json({ success: true, message: "Rating removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
