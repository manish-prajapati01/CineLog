/**
 * OMDb API Service
 * Fetches additional metadata not available in TMDB (Awards, Ratings from other sources)
 */
const axios = require("axios");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours (data rarely changes)
const OMDB_BASE_URL = "http://www.omdbapi.com/";

const getOmdbData = async (imdbId) => {
  if (!imdbId) return null;

  const cacheKey = `omdb:${imdbId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbId,
        plot: "full",
      },
      timeout: 5000,
    });

    if (response.data.Response === "True") {
      const data = response.data;
      const result = {
        awards: data.Awards !== "N/A" ? data.Awards : null,
        ratings: data.Ratings || [],
        metascore: data.Metascore !== "N/A" ? data.Metascore : null,
        imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : null,
        imdbVotes: data.imdbVotes !== "N/A" ? data.imdbVotes : null,
        boxOffice: data.BoxOffice !== "N/A" ? data.BoxOffice : null,
        plot: data.Plot !== "N/A" ? data.Plot : null,
        rated: data.Rated !== "N/A" ? data.Rated : null, // US certification
      };
      cache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.warn(`OMDb fetch failed for ${imdbId}:`, error.message);
    return null; // Fail silently, it's supplementary data
  }
};

module.exports = {
  getOmdbData,
};
