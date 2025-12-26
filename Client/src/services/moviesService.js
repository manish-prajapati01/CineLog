/**
 * Movies API Service
 */

import api from './api';

export const moviesAPI = {
  // Get trending movies
  getTrending: (timeWindow = 'week') =>
    api.get(`/movies/trending?timeWindow=${timeWindow}`),

  // Get trending movies in India
  getTrendingIndia: (timeWindow = 'week') =>
    api.get(`/movies/trending/india?timeWindow=${timeWindow}`),

  // Get popular movies
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),

  // ====== INDIAN MOVIES ======
  getAllIndian: (page = 1) => api.get(`/movies/indian/all?page=${page}`),
  getAiringIndian: (page = 1) => api.get(`/movies/indian/airing?page=${page}`),
  getPopularIndian: (page = 1) =>
    api.get(`/movies/popular/indian?page=${page}`),
  getUpcomingIndian: (page = 1) =>
    api.get(`/movies/indian/upcoming?page=${page}`),

  // ====== HOLLYWOOD MOVIES ======
  getAllHollywood: (page = 1) => api.get(`/movies/hollywood/all?page=${page}`),
  getAiringHollywood: (page = 1) =>
    api.get(`/movies/hollywood/airing?page=${page}`),
  getPopularHollywood: (page = 1) =>
    api.get(`/movies/popular/hollywood?page=${page}`),
  getUpcomingHollywood: (page = 1) =>
    api.get(`/movies/hollywood/upcoming?page=${page}`),

  // Get movie details
  getDetails: (id) => api.get(`/movies/${id}`),

  // Search movies
  search: (query, page = 1) =>
    api.get(`/movies/search?q=${encodeURIComponent(query)}&page=${page}`),

  // Get genres
  getGenres: () => api.get('/movies/genres'),
};

export default moviesAPI;
