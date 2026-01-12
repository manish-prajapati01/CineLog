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
// CORS configuration for development and production
const corsOptions = {
  origin: [
    "http://localhost:5173", // Local Vite dev server
    "http://localhost:3000", // Alternative local port
    "https://cinelog-p441.onrender.com", // Production Render Server
    /\.vercel\.app$/, // Any Vercel preview deployment
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
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

// Auth routes (Login, Register)
app.use("/api/auth", require("./routes/authRoutes"));

// TMDB data routes (Fetch Movies, TV, People from TMDB API)
app.use("/api/movies", require("./routes/tmdbMoviesRoutes"));
app.use("/api/tv", require("./routes/tvRoutes"));
app.use("/api/person", require("./routes/personRoutes")); // New Person Routes
app.use("/api/search", require("./routes/searchRoutes"));

// User interaction routes (Ratings, Reviews, Watchlist)
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/watchlist", require("./routes/watchlistRoutes"));

// ============ Admin / Legacy Routes ============
// Mounted specially to avoid conflict with TMDB routes
app.use("/api/admin/movies", require("./routes/moviesRoute")); // Admin Custom Movies
app.use("/api/admin/series", require("./routes/seriesRoute")); // Admin Custom Series
app.use("/api/artists", require("./routes/artistRoutes")); // Admin Artists
app.use("/api/images", require("./routes/imagesRouter")); // Admin Image Upload
app.use("/api/users", require("./routes/userRoutes")); // Legacy User/Auth

// ============ Health Check ============
// Simple endpoint to check if server is alive
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CineLog API is running",
    timestamp: new Date().toISOString(),
  });
});

// ============ Error Handling ============
// Global error handler for all routes
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// 404 Handler - For any route not found above
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
  console.log(`   - Watchlist: /api/watchlist`);
  console.log(`   - Person:    /api/person`);
  console.log(`   - Admin:     /api/admin/movies, /api/artists, /api/images\n`);
});
