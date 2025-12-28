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

const omdbService = require("./omdbService");

// ============ HELPERS ============

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

// ============ GENERIC DISCOVERY ============

/**
 * Advanced Discovery Engine for Movies
 * Supports: Sorting, Filtering by Year, Language, Genres, Region, Vote Count
 */
const discoverMovies = async (params = {}) => {
  const {
    page = 1,
    sort_by = "popularity.desc",
    year,
    language, // 'hi', 'en', 'south'
    with_genres,
    region,
    vote_average_gte,
    vote_count_gte,
    // Date filters
    "primary_release_date.gte": release_date_gte,
    "primary_release_date.lte": release_date_lte,
  } = params;

  const apiParams = {
    page,
    sort_by,
    include_adult: false,
    include_video: false,
  };

  if (year) apiParams["primary_release_year"] = year;

  if (language) {
    if (language === "south") {
      apiParams["with_original_language"] = "ta|te|ml|kn";
    } else if (language === "indian") {
      apiParams["with_original_language"] = "hi|ta|te|ml|kn|bn|mr|pa|gu";
    } else {
      apiParams["with_original_language"] = language;
    }
  }

  if (with_genres) apiParams["with_genres"] = with_genres;
  if (region) apiParams.region = region;
  if (vote_average_gte) apiParams["vote_average.gte"] = vote_average_gte;
  if (vote_count_gte) apiParams["vote_count.gte"] = vote_count_gte;

  // Pass through date filters
  if (release_date_gte)
    apiParams["primary_release_date.gte"] = release_date_gte;
  if (release_date_lte)
    apiParams["primary_release_date.lte"] = release_date_lte;

  // Sorting nuances
  if (sort_by === "revenue.desc") {
    apiParams["vote_count.gte"] = 50;
  } else if (sort_by === "vote_average.asc") {
    apiParams["vote_count.gte"] = 10;
  }

  const data = await tmdbRequest("/discover/movie", apiParams);

  return {
    results: data.results || [],
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

/**
 * Advanced Discovery Engine for TV
 */
const discoverTV = async (params = {}) => {
  const {
    page = 1,
    sort_by = "popularity.desc",
    year,
    language,
    with_genres,
    vote_average_gte,
    vote_count_gte,
    // TV Date filters
    "first_air_date.gte": first_air_date_gte,
    "first_air_date.lte": first_air_date_lte,
    "air_date.gte": air_date_gte,
    "air_date.lte": air_date_lte,
    with_status, // Allow status filtering
  } = params;

  const apiParams = {
    page,
    sort_by,
    include_adult: false,
    include_null_first_air_dates: false,
  };

  if (year) apiParams["first_air_date_year"] = year;

  if (language) {
    if (language === "south") {
      apiParams["with_original_language"] = "ta|te|ml|kn";
    } else if (language === "indian") {
      apiParams["with_original_language"] = "hi|ta|te|ml|kn|bn|mr";
    } else {
      apiParams["with_original_language"] = language;
    }
  }

  if (with_genres) apiParams["with_genres"] = with_genres;
  if (vote_average_gte) apiParams["vote_average.gte"] = vote_average_gte;
  if (vote_count_gte) apiParams["vote_count.gte"] = vote_count_gte;

  // Pass through date filters
  if (first_air_date_gte) apiParams["first_air_date.gte"] = first_air_date_gte;
  if (first_air_date_lte) apiParams["first_air_date.lte"] = first_air_date_lte;
  if (air_date_gte) apiParams["air_date.gte"] = air_date_gte;
  if (air_date_lte) apiParams["air_date.lte"] = air_date_lte;
  if (with_status) apiParams["with_status"] = with_status;

  const data = await tmdbRequest("/discover/tv", apiParams);

  // Apply custom filtering for Indian Web Series if needed
  let results = data.results || [];
  if (
    language === "indian" ||
    language === "south" ||
    (language && language.includes("hi"))
  ) {
    results = filterWebSeries(results);
  }

  return {
    results,
    page: data.page,
    total_pages: Math.min(data.total_pages || 0, 500),
    total_results: data.total_results || 0,
  };
};

// ============ MOVIE ENDPOINTS ============

const getTrendingMovies = async (timeWindow = "week") => {
  const data = await tmdbRequest(`/trending/movie/${timeWindow}`);
  return data.results;
};

const getPopularMovies = async (page = 1, filters = {}) => {
  const data = await discoverMovies({
    page,
    sort_by: "popularity.desc",
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((m) => !isIndianContent(m)),
  };
};

const getNowPlayingMovies = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await discoverMovies({
    page,
    "primary_release_date.gte": fortyFiveDaysAgo,
    "primary_release_date.lte": today,
    sort_by: "popularity.desc",
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((m) => !isIndianContent(m)),
  };
};

const getUpcomingMovies = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await discoverMovies({
    page,
    "primary_release_date.gte": today,
    sort_by: "popularity.desc", // Upcoming usually sorted by popularity or date
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((m) => !isIndianContent(m)),
  };
};

const getTopRatedMovies = async (page = 1, filters = {}) => {
  const data = await discoverMovies({
    page,
    sort_by: "vote_average.desc",
    vote_count_gte: 300,
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((m) => !isIndianContent(m)),
  };
};

const getMovieDetails = async (movieId) => {
  const tmdbData = await tmdbRequest(`/movie/${movieId}`, {
    append_to_response:
      "credits,videos,recommendations,similar,release_dates,keywords,external_ids",
  });

  // Extract useful extra data
  const keywords = tmdbData.keywords?.keywords?.map((k) => k.name) || [];
  const certification =
    tmdbData.release_dates?.results
      ?.find((r) => r.iso_3166_1 === "US" || r.iso_3166_1 === "IN")
      ?.release_dates?.find((d) => d.certification)?.certification || "NR";

  const imdbId = tmdbData.external_ids?.imdb_id;
  const omdbData = imdbId ? await omdbService.getOmdbData(imdbId) : null;

  return {
    ...tmdbData,
    keywords_list: keywords,
    certification_code: certification,
    omdb: omdbData,
  };
};

const getMovieCredits = async (movieId) =>
  tmdbRequest(`/movie/${movieId}/credits`);
const getSimilarMovies = async (movieId) =>
  tmdbRequest(`/movie/${movieId}/similar`);
const getMovieVideos = async (movieId) =>
  tmdbRequest(`/movie/${movieId}/videos`);

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

const INDIAN_LANGUAGES = ["hi", "ta", "te", "ml", "kn"];

const isIndianContent = (item) => {
  return INDIAN_LANGUAGES.includes(item.original_language);
};

const getTrendingIndia = async (timeWindow = "week") => {
  const today = new Date();
  const ninetyDaysAgo = new Date(today - 90 * 24 * 60 * 60 * 1000);

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

  const allMovies = [...nowPlayingIndia, ...trendingRecent, ...indianMovies];
  const uniqueMovies = [...new Map(allMovies.map((m) => [m.id, m])).values()];
  uniqueMovies.sort((a, b) => b.popularity - a.popularity);
  return uniqueMovies.slice(0, 20);
};

// 2️⃣ INDIAN MOVIES
const getAllIndianMovies = async (page = 1, filters = {}) =>
  discoverMovies({
    page,
    language: "indian",
    sort_by: "primary_release_date.desc",
    ...filters,
  });
// "Now Playing" for India
const getAiringIndianMovies = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const data = await discoverMovies({
    page,
    language: "indian",
    "primary_release_date.gte": fortyFiveDaysAgo,
    "primary_release_date.lte": today,
    sort_by: "primary_release_date.desc",
    ...filters,
  });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getPopularIndianMovies = async (page = 1, filters = {}) =>
  discoverMovies({
    page,
    language: "indian",
    sort_by: "popularity.desc",
    vote_count_gte: 20,
    ...filters,
  });

const getUpcomingIndianMovies = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await discoverMovies({
    page,
    language: "indian",
    "primary_release_date.gte": today,
    sort_by: "primary_release_date.asc",
    ...filters,
  });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getTopRatedIndianMovies = async (page = 1, filters = {}) =>
  discoverMovies({
    page,
    language: "indian",
    sort_by: "vote_average.desc",
    vote_count_gte: 50,
    ...filters,
  });

// 3️⃣ HOLLYWOOD MOVIES (Existing methods + Top Rated)
const getAllHollywoodMovies = async (page = 1, filters = {}) =>
  discoverMovies({
    page,
    language: "en",
    sort_by: "primary_release_date.desc",
    ...filters,
  });
const getAiringHollywoodMovies = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "en",
    "primary_release_date.gte": fortyFiveDaysAgo,
    "primary_release_date.lte": today,
    sort_by: "primary_release_date.desc",
    ...filters,
  });
  const filtered = (data.results || []).filter(
    (show) => !isIndianContent(show)
  );
  return {
    results: filtered,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};
const getPopularHollywoodMovies = async (page = 1, filters = {}) =>
  discoverMovies({
    page,
    language: "en",
    sort_by: "popularity.desc",
    vote_count_gte: 500,
    ...filters,
  });
const getUpcomingHollywoodMovies = async (page = 1, filters = {}) => {
  // Use TOMORROW to strictly filter out already released movies
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const data = await tmdbRequest("/discover/movie", {
    page,
    with_original_language: "en",
    "primary_release_date.gte": tomorrow,
    sort_by: "primary_release_date.asc", // Nearest first
    "vote_count.gte": 0,
    ...filters,
  });
  const filtered = (data.results || []).filter(
    (show) => !isIndianContent(show)
  );
  return {
    results: filtered,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};
const getTopRatedHollywoodMovies = async (page = 1, filters = {}) =>
  discoverMovies({
    page,
    language: "en",
    sort_by: "vote_average.desc",
    vote_count_gte: 1000,
    ...filters,
  });

// 4️⃣ INDIAN TV SHOWS
const getAllIndianTV = async (page = 1, filters = {}) =>
  discoverTV({
    page,
    language: "indian",
    sort_by: "first_air_date.desc",
    ...filters,
  });
const getAiringIndianTV = async (page = 1, filters = {}) => {
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
    ...filters,
  });
  return {
    results: filterWebSeries(data.results),
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};
const getPopularIndianTV = async (page = 1, filters = {}) =>
  discoverTV({
    page,
    language: "indian",
    sort_by: "popularity.desc",
    vote_count_gte: 50, // Increased from 10 to filter out niche/low-quality
    "vote_average.gte": 5, // Minimum rating to avoid trash
    ...filters,
  });

const getUpcomingIndianTV = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "hi|ta|te|ml|kn|bn",
    "first_air_date.gte": today,
    sort_by: "first_air_date.asc", // Nearest first
    ...filters,
  });
  return {
    results: data.results || [],
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getTopRatedIndianTV = async (page = 1, filters = {}) =>
  discoverTV({
    page,
    language: "indian",
    sort_by: "vote_average.desc",
    vote_count_gte: 20,
    ...filters,
  });

// 5️⃣ HOLLYWOOD TV SHOWS
const getAllHollywoodTV = async (page = 1, filters = {}) => {
  const data = await discoverTV({
    page,
    language: "en",
    sort_by: "first_air_date.desc",
    ...filters,
  });
  data.results = data.results.filter((s) => !isIndianContent(s));
  return data;
};

const getAiringHollywoodTV = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Use 'air_date' checks to find shows with episodes airing NOW or RECENTLY
  // AND 'with_status' to strictly exclude Ended/Canceled shows
  // Status: 0=Returning Series, 1=Planned, 2=In Production, 3=Ended, 4=Canceled, 5=Pilot
  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "en",
    "air_date.gte": fortyFiveDaysAgo,
    "air_date.lte": today,
    with_status: "0|2", // Returning Series OR In Production
    sort_by: "popularity.desc",
    include_null_first_air_dates: false,
    ...filters,
  });

  const filtered = (data.results || []).filter((s) => !isIndianContent(s));
  return {
    results: filtered,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};

const getPopularHollywoodTV = async (page = 1, filters = {}) => {
  const data = await discoverTV({
    page,
    language: "en",
    sort_by: "popularity.desc",
    vote_count_gte: 300,
    ...filters,
  });
  data.results = data.results.filter((s) => !isIndianContent(s));
  return data;
};

const getUpcomingHollywoodTV = async (page = 1, filters = {}) => {
  // Use TOMORROW to effectively filter out today's released content if user finds it redundant
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await tmdbRequest("/discover/tv", {
    page,
    with_original_language: "en",
    "first_air_date.gte": tomorrow,
    sort_by: "first_air_date.asc", // Nearest Date First
    include_null_first_air_dates: false,
    ...filters,
  });
  const filtered = (data.results || []).filter((s) => !isIndianContent(s));
  return {
    results: filtered,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
};
const getTopRatedHollywoodTV = async (page = 1, filters = {}) => {
  const data = await discoverTV({
    page,
    language: "en",
    sort_by: "vote_average.desc",
    vote_count_gte: 300,
    ...filters,
  });
  data.results = data.results.filter((s) => !isIndianContent(s));
  return data;
};

// ============ TV SHOW ENDPOINTS ============

const getTrendingTV = async (timeWindow = "week") => {
  const data = await tmdbRequest(`/trending/tv/${timeWindow}`);
  return data.results;
};
const getPopularTV = async (page = 1, filters = {}) => {
  const data = await discoverTV({
    page,
    sort_by: "popularity.desc",
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((s) => !isIndianContent(s)),
  };
};

const getAiringTodayTV = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  // Airing today roughly means this week for safety, or strict equality
  const data = await discoverTV({
    page,
    "first_air_date.lte": today,
    sort_by: "popularity.desc",
    "air_date.lte": today, // Ensure it's currently airing
    with_status: "0|2", // Returning or In Production only
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((s) => !isIndianContent(s)),
  };
};

const getOnTheAirTV = async (page = 1, filters = {}) => {
  const today = new Date().toISOString().split("T")[0];
  const data = await discoverTV({
    page,
    "first_air_date.gte": today, // Upcomingish
    sort_by: "popularity.desc",
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((s) => !isIndianContent(s)),
  };
};

const getTopRatedTV = async (page = 1, filters = {}) => {
  const data = await discoverTV({
    page,
    sort_by: "vote_average.desc",
    vote_count_gte: 150,
    ...filters,
  });
  return {
    ...data,
    results: (data.results || []).filter((s) => !isIndianContent(s)),
  };
};

const getTVDetails = async (tvId) => {
  return await tmdbRequest(`/tv/${tvId}`, {
    append_to_response:
      "credits,videos,recommendations,similar,content_ratings,external_ids,keywords",
  });
};
const getTVCredits = async (tvId) => tmdbRequest(`/tv/${tvId}/credits`);
const getSimilarTV = async (tvId) => tmdbRequest(`/tv/${tvId}/similar`);
const getTVVideos = async (tvId) => tmdbRequest(`/tv/${tvId}/videos`);
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

const getTVSeasonDetails = async (tvId, seasonNumber) => {
  return await tmdbRequest(`/tv/${tvId}/season/${seasonNumber}`);
};

// ============ PERSON ENDPOINTS ============

const getPersonDetails = async (personId) => {
  return await tmdbRequest(`/person/${personId}`, {
    append_to_response: "movie_credits,tv_credits,images",
  });
};
const getPersonCredits = async (personId) =>
  tmdbRequest(`/person/${personId}/combined_credits`);
const getPopularPeople = async (page = 1) => {
  const data = await tmdbRequest("/person/popular", { page });
  return {
    results: data.results,
    page: data.page,
    total_pages: data.total_pages,
    total_results: data.total_results,
  };
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
  // Discovery
  discoverMovies,
  discoverTV,
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
  getTopRatedIndianMovies,
  getAllHollywoodMovies,
  getAiringHollywoodMovies,
  getPopularHollywoodMovies,
  getUpcomingHollywoodMovies,
  getTopRatedHollywoodMovies,
  // India-specific TV
  getAllIndianTV,
  getAiringIndianTV,
  getPopularIndianTV,
  getUpcomingIndianTV,
  getTopRatedIndianTV,
  getAllHollywoodTV,
  getAiringHollywoodTV,
  getPopularHollywoodTV,
  getUpcomingHollywoodTV,
  getTopRatedHollywoodTV,
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
  getTVSeasonDetails,
  // People
  getPersonDetails,
  getPersonCredits,
  getPopularPeople,
  searchPeople,
  // Multi
  multiSearch,
  // Utils
  getImageUrl,
  clearCache,
  IMAGE_SIZES,
};
