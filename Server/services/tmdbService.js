/**
 * TMDB API Service
 * Handles all TMDB API calls with caching support
 */

const axios = require("axios");
const NodeCache = require("node-cache");

// Cache setup: TTL in seconds
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour default
  checkperiod: 600, // Check for expired keys every 10 minutes
});

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Image size presets
const IMAGE_SIZES = {
  poster: {
    small: "w185",
    medium: "w342",
    large: "w500",
    original: "original",
  },
  backdrop: {
    small: "w300",
    medium: "w780",
    large: "w1280",
    original: "original",
  },
  profile: {
    small: "w45",
    medium: "w185",
    large: "h632",
    original: "original",
  },
};

/**
 * Make authenticated request to TMDB API
 */
const tmdbRequest = async (endpoint, params = {}) => {
  const cacheKey = `tmdb:${endpoint}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: { api_key: process.env.TMDB_API_KEY, ...params },
        timeout: 10000, // 10s timeout
      });
      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const isRetryable =
        !error.response || // Network error
        (error.response.status >= 500 && error.response.status < 600) || // Server error
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";

      if (isRetryable && retries > 1) {
        retries--;
        console.warn(
          `[TMDB] Retry ${3 - retries}/3 for ${endpoint}: ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      console.error(`TMDB API Error: ${endpoint}`, error.message);
      throw new Error(error.response?.data?.status_message || "TMDB API Error");
    }
  }
};

const getImageUrl = (path, type = "poster", size = "medium") => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES[type]?.[size] || "original"}${path}`;
};

// ============ MOVIE ENDPOINTS ============

const getTrendingMovies = async (timeWindow = "week") => {
  const data = await tmdbRequest(`/trending/movie/${timeWindow}`);
  return data.results;
};

const getPopularMovies = async (page = 1) => {
  const data = await tmdbRequest("/movie/popular", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getNowPlayingMovies = async (page = 1) => {
  const data = await tmdbRequest("/movie/now_playing", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getUpcomingMovies = async (page = 1) => {
  const data = await tmdbRequest("/movie/upcoming", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getTopRatedMovies = async (page = 1) => {
  const data = await tmdbRequest("/movie/top_rated", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getMovieDetails = async (movieId) => {
  return await tmdbRequest(`/movie/${movieId}`, {
    append_to_response: "credits,videos,recommendations,similar,release_dates",
  });
};

const getMovieCredits = async (movieId) => {
  return await tmdbRequest(`/movie/${movieId}/credits`);
};

const getSimilarMovies = async (movieId) => {
  return await tmdbRequest(`/movie/${movieId}/similar`);
};

const getMovieVideos = async (movieId) => {
  return await tmdbRequest(`/movie/${movieId}/videos`);
};

const getMoviesByGenre = async (genreId, page = 1) => {
  const data = await tmdbRequest("/discover/movie", {
    with_genres: genreId,
    page,
    sort_by: "popularity.desc",
  });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const searchMovies = async (query, page = 1) => {
  const data = await tmdbRequest("/search/movie", { query, page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getMovieGenres = async () => {
  const data = await tmdbRequest("/genre/movie/list");
  return data.genres;
};

// ============ INDIA-SPECIFIC ENDPOINTS ============

// Indian languages for filtering (Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi)
const INDIAN_LANGUAGES = ["hi", "ta", "te", "ml", "kn", "bn", "mr", "pa", "gu"];

/**
 * Helper: Check if content is Indian based on language
 */
const isIndianContent = (item) => {
  return INDIAN_LANGUAGES.includes(item.original_language);
};

/**
 * 1️⃣ TRENDING IN INDIA (Movies)
 * Movies currently playing/streaming in India + trending globally
 * Hybrid: now_playing(region=IN) + trending/movie filtered
 */
const getTrendingIndia = async (timeWindow = "week") => {
  const today = new Date();
  const ninetyDaysAgo = new Date(today - 90 * 24 * 60 * 60 * 1000);

  // SOURCE 1: Now Playing in India (currently in theaters)
  let nowPlayingIndia = [];
  try {
    const nowPlaying = await tmdbRequest("/movie/now_playing", {
      region: "IN",
    });
    nowPlayingIndia = (nowPlaying.results || []).filter((m) => {
      const hasPopularity = m.popularity >= 30;
      const hasQuality = m.vote_average >= 5.0;
      return hasPopularity && hasQuality;
    });
  } catch (e) {
    console.log("Now playing fetch failed:", e.message);
  }

  // SOURCE 2: Trending movies globally (recent releases)
  let trendingRecent = [];
  try {
    const trending = await tmdbRequest(`/trending/movie/${timeWindow}`);
    trendingRecent = (trending.results || []).filter((m) => {
      const releaseDate = m.release_date ? new Date(m.release_date) : null;
      const isRecent = releaseDate && releaseDate >= ninetyDaysAgo;
      const hasPopularity = m.popularity >= 50;
      return isRecent && hasPopularity;
    });
  } catch (e) {
    console.log("Trending fetch failed:", e.message);
  }

  // SOURCE 3: Popular Indian language movies (recent)
  let indianMovies = [];
  try {
    for (const lang of ["hi", "ta", "te"]) {
      const data = await tmdbRequest("/discover/movie", {
        page: 1,
        with_original_language: lang,
        "primary_release_date.gte": ninetyDaysAgo.toISOString().split("T")[0],
        sort_by: "popularity.desc",
      });
      indianMovies.push(...(data.results || []).slice(0, 10));
    }
  } catch (e) {
    console.log("Indian movies fetch failed:", e.message);
  }

  // Merge all sources, remove duplicates
  const allMovies = [...nowPlayingIndia, ...trendingRecent, ...indianMovies];
  const uniqueMovies = [...new Map(allMovies.map((m) => [m.id, m])).values()];

  // Sort by popularity (current buzz)
  uniqueMovies.sort((a, b) => b.popularity - a.popularity);

  return uniqueMovies.slice(0, 20);
};

/**
 * 2️⃣ INDIAN MOVIES - Multiple Filter Variants
 */

// All Indian Movies - Released only, most recent first
const getAllIndianMovies = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn|mr",
    "primary_release_date.lte": today,
    sort_by: "primary_release_date.desc",
  });

  return {
    results: data.results || [],
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Airing/Now Playing Indian Movies - Recently released (last 45 days)
const getAiringIndianMovies = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn|mr",
    "primary_release_date.gte": fortyFiveDaysAgo,
    "primary_release_date.lte": today,
    sort_by: "primary_release_date.desc",
  });

  return {
    results: data.results || [],
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Popular Indian Movies - Released only, sorted by popularity
const getPopularIndianMovies = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn|mr",
    "primary_release_date.lte": today,
    sort_by: "popularity.desc",
    "vote_count.gte": 50,
    "vote_average.gte": 5.0,
  });

  return {
    results: data.results || [],
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Upcoming Indian Movies - Future releases
const getUpcomingIndianMovies = async (page = 1) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn|mr",
    "primary_release_date.gte": tomorrow,
    sort_by: "primary_release_date.asc",
  });

  return {
    results: data.results || [],
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

/**
 * 3️⃣ HOLLYWOOD MOVIES - Multiple Filter Variants
 */

// All Hollywood Movies - Released only, most recent first
const getAllHollywoodMovies = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "en",
    "primary_release_date.lte": today,
    sort_by: "primary_release_date.desc",
  });

  const filtered = (data.results || []).filter(
    (movie) => !isIndianContent(movie)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Airing/Now Playing Hollywood Movies - Recently released (last 45 days)
const getAiringHollywoodMovies = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "en",
    "primary_release_date.gte": fortyFiveDaysAgo,
    "primary_release_date.lte": today,
    sort_by: "primary_release_date.desc", // Latest releases first
  });

  const filtered = (data.results || []).filter(
    (movie) => !isIndianContent(movie)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Popular Hollywood Movies - Released only, sorted by popularity
const getPopularHollywoodMovies = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "en",
    "primary_release_date.lte": today,
    sort_by: "popularity.desc",
    "vote_count.gte": 500,
    "vote_average.gte": 6.0,
  });

  const filtered = (data.results || []).filter(
    (movie) => !isIndianContent(movie)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Upcoming Hollywood Movies - Future releases
const getUpcomingHollywoodMovies = async (page = 1) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "en",
    "primary_release_date.gte": tomorrow,
    sort_by: "primary_release_date.asc",
  });

  const filtered = (data.results || []).filter(
    (movie) => !isIndianContent(movie)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

/**
 * 4️⃣ INDIAN TV SHOWS - Multiple Filter Variants (Web Series Only)
 */

// Common blacklist for Indian TV (excludes daily soaps/reality)
const TV_BLACKLIST_PATTERNS = [
  /kapil/i,
  /comedy/i,
  /bigg\s*boss/i,
  /kbc/i,
  /saas/i,
  /bahu/i,
  /serial/i,
  /daily/i,
  /cid/i,
  /crime\s*patrol/i,
  /savdhaan/i,
  /dance/i,
  /reality/i,
  /roadies/i,
  /splitsvilla/i,
  /star/i,
  /colors/i,
  /zee/i,
  /sony/i,
  /anupama/i,
  /rishta/i,
  /kumkum/i,
  /kundali/i,
  /bhagya/i,
  /taarak/i,
  /mehta/i,
  /naagin/i,
  /uddan/i,
  /shakti/i,
  /udaariyaan/i,
  /parineet/i,
  /dhruv/i,
  /wagle/i,
  /pushpa/i,
  /tmkoc/i,
  /idol/i,
  /singer/i,
  /voice/i,
];

// Helper to filter out daily soaps
const filterWebSeries = (shows) => {
  return (shows || []).filter((show) => {
    const name = (show.name || show.original_name || "").toLowerCase();
    const genreIds = show.genre_ids || [];
    const seasons = show.number_of_seasons || 1;

    for (const pattern of TV_BLACKLIST_PATTERNS) {
      if (pattern.test(name)) return false;
    }

    if (genreIds.includes(10766)) return false; // Soap genre
    if (genreIds.includes(10764)) return false; // Reality genre
    if (seasons > 10) return false;

    return true;
  });
};

// All Indian TV - Released only, most recent first
const getAllIndianTV = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn",
    "first_air_date.lte": today,
    sort_by: "first_air_date.desc",
  });

  return {
    results: filterWebSeries(data.results),
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Airing/Now Playing Indian TV - Recently released (last 45 days)
const getAiringIndianTV = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn",
    "first_air_date.gte": fortyFiveDaysAgo,
    "first_air_date.lte": today,
    sort_by: "first_air_date.desc",
  });

  return {
    results: filterWebSeries(data.results),
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Popular Indian TV - Released only, sorted by popularity
const getPopularIndianTV = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn",
    "first_air_date.lte": today,
    sort_by: "popularity.desc",
    "vote_count.gte": 20,
    "vote_average.gte": 5.0,
  });

  return {
    results: filterWebSeries(data.results),
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Upcoming Indian TV - Not yet aired
const getUpcomingIndianTV = async (page = 1) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn",
    "first_air_date.gte": tomorrow,
    sort_by: "first_air_date.asc",
  });

  return {
    results: data.results || [],
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

/**
 * 5️⃣ HOLLYWOOD TV SHOWS - Multiple Filter Variants
 */

// All Hollywood TV - Released only, sorted by latest release
const getAllHollywoodTV = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "en",
    "first_air_date.lte": today,
    sort_by: "first_air_date.desc",
  });

  const filtered = (data.results || []).filter(
    (show) => !isIndianContent(show)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Airing/Now Playing Hollywood TV - Recently released (last 45 days)
const getAiringHollywoodTV = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "en",
    "first_air_date.gte": fortyFiveDaysAgo,
    "first_air_date.lte": today,
    sort_by: "first_air_date.desc",
  });

  const filtered = (data.results || []).filter(
    (show) => !isIndianContent(show)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Popular Hollywood TV - Released only, sorted by popularity
const getPopularHollywoodTV = async (page = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "en",
    "first_air_date.lte": today,
    sort_by: "popularity.desc",
    "vote_count.gte": 300,
    "vote_average.gte": 6.5,
  });

  const filtered = (data.results || []).filter(
    (show) => !isIndianContent(show)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// Upcoming Hollywood TV - Not yet aired
const getUpcomingHollywoodTV = async (page = 1) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "en",
    "first_air_date.gte": tomorrow,
    sort_by: "first_air_date.asc",
  });

  const filtered = (data.results || []).filter(
    (show) => !isIndianContent(show)
  );

  return {
    results: filtered,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// ============ TV SHOW ENDPOINTS ============

const getTrendingTV = async (timeWindow = "week") => {
  const data = await tmdbRequest(`/trending/tv/${timeWindow}`);
  return data.results;
};

const getPopularTV = async (page = 1) => {
  const data = await tmdbRequest("/tv/popular", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getAiringTodayTV = async (page = 1) => {
  const data = await tmdbRequest("/tv/airing_today", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getOnTheAirTV = async (page = 1) => {
  const data = await tmdbRequest("/tv/on_the_air", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getTopRatedTV = async (page = 1) => {
  const data = await tmdbRequest("/tv/top_rated", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getTVDetails = async (tvId) => {
  return await tmdbRequest(`/tv/${tvId}`, {
    append_to_response:
      "credits,videos,recommendations,similar,content_ratings",
  });
};

const getTVCredits = async (tvId) => {
  return await tmdbRequest(`/tv/${tvId}/credits`);
};

const getSimilarTV = async (tvId) => {
  return await tmdbRequest(`/tv/${tvId}/similar`);
};

const getTVVideos = async (tvId) => {
  return await tmdbRequest(`/tv/${tvId}/videos`);
};

const getTVByGenre = async (genreId, page = 1) => {
  const data = await tmdbRequest("/discover/tv", {
    with_genres: genreId,
    page,
    sort_by: "popularity.desc",
  });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const searchTV = async (query, page = 1) => {
  const data = await tmdbRequest("/search/tv", { query, page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getTVGenres = async () => {
  const data = await tmdbRequest("/genre/tv/list");
  return data.genres;
};

// ============ PERSON ENDPOINTS ============

const getPersonDetails = async (personId) => {
  return await tmdbRequest(`/person/${personId}`, {
    append_to_response: "movie_credits,tv_credits,images",
  });
};

const getPersonCredits = async (personId) => {
  return await tmdbRequest(`/person/${personId}/combined_credits`);
};

const searchPeople = async (query, page = 1) => {
  const data = await tmdbRequest("/search/person", { query, page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

// ============ MULTI SEARCH ============

const multiSearch = async (query, page = 1) => {
  const data = await tmdbRequest("/search/multi", { query, page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

// ============ UTILS ============

const clearCache = () => {
  cache.flushAll();
  return { message: "Cache cleared" };
};

module.exports = {
  // Movies
  getTrendingMovies,
  getPopularMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getTopRatedMovies,
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getMovieVideos,
  getMoviesByGenre,
  searchMovies,
  getMovieGenres,
  // India-specific movies
  getTrendingIndia,
  getAllIndianMovies,
  getAiringIndianMovies,
  getPopularIndianMovies,
  getUpcomingIndianMovies,
  getAllHollywoodMovies,
  getAiringHollywoodMovies,
  getPopularHollywoodMovies,
  getUpcomingHollywoodMovies,
  // India-specific TV
  getAllIndianTV,
  getAiringIndianTV,
  getPopularIndianTV,
  getUpcomingIndianTV,
  getAllHollywoodTV,
  getAiringHollywoodTV,
  getPopularHollywoodTV,
  getUpcomingHollywoodTV,
  // TV Shows
  getTrendingTV,
  getPopularTV,
  getAiringTodayTV,
  getOnTheAirTV,
  getTopRatedTV,
  getTVDetails,
  getTVCredits,
  getSimilarTV,
  getTVVideos,
  getTVByGenre,
  searchTV,
  getTVGenres,
  // People
  getPersonDetails,
  getPersonCredits,
  searchPeople,
  // Multi
  multiSearch,
  // Utils
  getImageUrl,
  clearCache,
  IMAGE_SIZES,
};
