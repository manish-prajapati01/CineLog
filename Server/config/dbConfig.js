const mongoose = require("mongoose");

// Debug: Log the URI being used (masking password)
const uri = process.env.MONGO_URL || process.env.MONGO_URI;

if (!uri) {
  console.error(
    "❌ CRITICAL ERROR: MONGO_URL or MONGO_URI is not defined in environment variables!"
  );
} else {
  // Mask password for safe logging
  const maskedUri = uri.replace(/:([^:@]+)@/, ":****@");
  console.log(`Connecting to MongoDB at: ${maskedUri}`);
}

mongoose.connect(uri, {
  dbName: "movie-review", // Force specific database name
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
