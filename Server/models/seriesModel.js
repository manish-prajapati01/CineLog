const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    plot: { type: String, required: true },
    posters: { type: Array, required: true },
    // Reusing artist refs for simplicity
    hero: { type: mongoose.Schema.Types.ObjectId, ref: "artists", required: false }, 
    heroine: { type: mongoose.Schema.Types.ObjectId, ref: "artists", required: false },
    director: { type: mongoose.Schema.Types.ObjectId, ref: "artists", required: false },
    
    genre: { type: String, required: true },
    language: { type: String, required: true },
    releaseDate: { type: String, required: true },
    trailer: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    cast: [{ type: mongoose.Schema.Types.ObjectId, ref: "artists", required: false }],
    
    // Series specific fields
    totalSeasons: { type: Number, required: false, default: 1 },
    status: { type: String, required: false, default: "Ongoing" } // Ongoing, Ended, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("series", seriesSchema);
