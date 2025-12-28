/**
 * TV Shows API Service
 * Complete API for TV shows with all TMDB endpoints
 */

import api from './api';

const tvService = {
  // Get trending TV shows
  getTrending: (timeWindow = 'week') =>
    api.get(`/tv/trending?timeWindow=${timeWindow}`),

  // Get popular TV shows
  getPopular: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/popular', { params });
  },

  // ====== INDIAN TV ======
  getAllIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/indian/all', { params });
  },
  getAiringIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/indian/airing', { params });
  },
  getPopularIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/popular/indian', { params });
  },
  getUpcomingIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/indian/upcoming', { params });
  },
  getTopRatedIndian: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/tv/indian/top_rated', { params });
  },

  // ====== HOLLYWOOD TV ======
  getAllHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/hollywood/all', { params });
  },
  getAiringHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/hollywood/airing', { params });
  },
  getPopularHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/popular/hollywood', { params });
  },
  getUpcomingHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/tv/hollywood/upcoming', { params });
  },
  getTopRatedHollywood: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/tv/hollywood/top_rated', { params });
  },

  // Get airing today TV shows
  getAiringToday: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/tv/airing_today', { params });
  },

  // Get on the air TV shows
  getOnTheAir: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/tv/on_the_air', { params });
  },

  // Get top rated TV shows
  getTopRated: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/tv/top_rated', { params });
  },

  // Get TV show details
  getTVDetails: (id) => api.get(`/tv/${id}`),

  // Get TV show credits (cast & crew)
  getTVCredits: (id) => api.get(`/tv/${id}/credits`),

  // Get TV Season details (episodes)
  getTVSeason: (id, seasonNumber) =>
    api.get(`/tv/${id}/season/${seasonNumber}`),

  // Get similar TV shows
  getSimilarTV: (id) => api.get(`/tv/${id}/similar`),

  // Get TV show videos (trailers)
  getTVVideos: (id) => api.get(`/tv/${id}/videos`),

  // Get TV shows by genre
  getByGenre: (genreId, page = 1) =>
    api.get(`/tv/genre/${genreId}?page=${page}`),

  // Search TV shows
  search: (query, page = 1) =>
    api.get(`/tv/search?q=${encodeURIComponent(query)}&page=${page}`),

  // Get genres
  getGenres: () => api.get('/tv/genres'),
};

export default tvService;
export { tvService as tvAPI };
