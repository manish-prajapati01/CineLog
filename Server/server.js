/**
 * CineLog - Server Entry Point
 * Complete redesign with TMDB integration
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Database connection
if (require.main === module) require("./config/dbConfig");

const app = express();
app.disable('x-powered-by');
// Render terminates the direct upstream proxy. Never trust arbitrary forwarded chains.
const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? (process.env.RENDER ? 1 : 0));
if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) throw new Error('Invalid TRUST_PROXY_HOPS');
app.set('trust proxy', proxyHops);
const security = require('./middlewares/security');
const rateLimit = require('./middlewares/rateLimit');
app.use(security.headers);

// ============ Middleware ============
// CORS configuration for development and production
const corsOptions = require('./config/corsConfig');
app.use(cors(corsOptions));
app.use('/api', rateLimit({namespace:'api-read',limit:300,windowMs:60000,skip:req=>['/health','/ready'].includes(req.path)}));
app.use('/api', rateLimit({namespace:'api-write',limit:60,windowMs:60000,skip:req=>['GET','HEAD'].includes(req.method)}));
app.use(express.json({ limit: "1mb", inflate: false }));
app.use(express.urlencoded({ extended: false, inflate: false, limit: "16kb", parameterLimit: 100 }));
app.use(security.validateInput);

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

app.use('/api/sponsors', require('./routes/sponsorRoutes'));
app.use('/api/operations', require('./routes/operationsRoutes'));
app.use("/api/audio", require("./routes/audioRoutes"));
app.use("/api/personal", require("./routes/personalRoutes"));
app.use("/api/discover", require("./routes/discoverRoutes"));

app.use('/api/sitemap.xml',require('./routes/sitemapRoutes'));
// ============ Health Check ============
// Simple endpoint to check if server is alive
app.get('/api/ready', (req, res) => { const ready = require('mongoose').connection.readyState === 1; res.status(ready ? 200 : 503).json({ success: ready, database: ready ? 'connected' : 'unavailable' }); });
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
  const status = err.status || (err.name === "ValidationError" || err.name === "CastError" || err.code === "LIMIT_FILE_SIZE" ? 400 : 500);
  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message || "Internal Server Error",
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
if (require.main === module) app.listen(PORT, () => {
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

module.exports=app;
