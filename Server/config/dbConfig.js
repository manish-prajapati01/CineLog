const mongoose = require("mongoose");

// Debug: Log the URI being used (masking password)
const uri = process.env.MONGO_URL || process.env.MONGO_URI;

if (!uri) {
  console.error(
    "❌ CRITICAL ERROR: MONGO_URL or MONGO_URI is not defined in environment variables!"
  );
}

mongoose.connect(uri, {
  autoIndex: process.env.NODE_ENV !== "production",
  dbName: process.env.MONGO_DB_NAME || "movie-review", // Force specific database name
  serverSelectionTimeoutMS: 10000, // 10 second timeout
}).catch((err) => {
  console.error("❌ MongoDB initial connection error:", err.message);
  console.error("   Check your network / MongoDB Atlas IP whitelist.");
});

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log(
    `✅ MongoDB connected successfully to database: ${connection.name}`
  );
});

connection.on("error", (err) => {
  console.log("❌ MongoDB connection failed:", err);
});

module.exports = mongoose;
