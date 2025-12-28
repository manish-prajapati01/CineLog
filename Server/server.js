/**
 * CineLog - Server Entry Point
 * Complete redesign with TMDB integration
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Database connection
require("./config/dbConfig");

const app = express();

// ============ Middleware ============
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============ API Routes ============

// Auth routes
app.use("/api/auth", require("./routes/authRoutes"));

// TMDB data routes
app.use("/api/movies", require("./routes/tmdbMoviesRoutes"));
app.use("/api/tv", require("./routes/tvRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));

// User interaction routes
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/watchlist", require("./routes/watchlistRoutes"));

// Legacy routes (for backward compatibility during transition)
app.use("/api/users", require("./routes/userRoutes"));

// ============ Health Check ============
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CineLog API is running",
    timestamp: new Date().toISOString(),
  });
});

// ============ Error Handling ============
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ============ Start Server ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎬 CineLog Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   - Auth:      /api/auth`);
  console.log(`   - Movies:    /api/movies`);
  console.log(`   - TV Shows:  /api/tv`);
  console.log(`   - Search:    /api/search`);
  console.log(`   - Ratings:   /api/ratings`);
  console.log(`   - Reviews:   /api/reviews`);
  console.log(`   - Watchlist: /api/watchlist\n`);
});
