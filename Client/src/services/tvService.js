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
  getPopular: (page = 1) => api.get(`/tv/popular?page=${page}`),

  // ====== INDIAN TV ======
  getAllIndian: (page = 1) => api.get(`/tv/indian/all?page=${page}`),
  getAiringIndian: (page = 1) => api.get(`/tv/indian/airing?page=${page}`),
  getPopularIndian: (page = 1) => api.get(`/tv/popular/indian?page=${page}`),
  getUpcomingIndian: (page = 1) => api.get(`/tv/indian/upcoming?page=${page}`),

  // ====== HOLLYWOOD TV ======
  getAllHollywood: (page = 1) => api.get(`/tv/hollywood/all?page=${page}`),
  getAiringHollywood: (page = 1) =>
    api.get(`/tv/hollywood/airing?page=${page}`),
  getPopularHollywood: (page = 1) =>
    api.get(`/tv/popular/hollywood?page=${page}`),
  getUpcomingHollywood: (page = 1) =>
    api.get(`/tv/hollywood/upcoming?page=${page}`),

  // Get airing today TV shows
  getAiringToday: (page = 1) => api.get(`/tv/airing_today?page=${page}`),

  // Get on the air TV shows
  getOnTheAir: (page = 1) => api.get(`/tv/on_the_air?page=${page}`),

  // Get top rated TV shows
  getTopRated: (page = 1) => api.get(`/tv/top_rated?page=${page}`),

  // Get TV show details
  getTVDetails: (id) => api.get(`/tv/${id}`),

  // Get TV show credits (cast & crew)
  getTVCredits: (id) => api.get(`/tv/${id}/credits`),

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
