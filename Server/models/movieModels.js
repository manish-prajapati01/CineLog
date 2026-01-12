const mongoose = require("mongoose");
const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    plot: {
      type: String,
      required: true,
    },
    hero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "artists",
      required: true,
    },
    heroine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "artists",
      required: true,
    },
    director: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "artists",
      required: true,
    },
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "artists",
      required: false, // Optional for now
    },
    genre: {
      type: [String], // Changed to Array
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: false, 
      default: "India",
    },
    runtime: {
      type: Number, // In minutes
      required: false,
    },
    posters: {
      type: [],
      required: false,
    },
    trailer: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    cast: [
      {
        artist: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "artists",
        },
        role: {
          type: String, // Character Name
          required: false,
        },
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("movies", movieSchema);
