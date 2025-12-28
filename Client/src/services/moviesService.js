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
  getPopular: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/popular', { params });
  },

  // ====== INDIAN MOVIES ======
  getAllIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/indian/all', { params });
  },
  getAiringIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/indian/airing', { params });
  },
  getPopularIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/popular/indian', { params });
  },
  getUpcomingIndian: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/indian/upcoming', { params });
  },
  getTopRatedIndian: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/movies/indian/top_rated', { params });
  },

  // ====== HOLLYWOOD MOVIES ======
  getAllHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/hollywood/all', { params });
  },
  getAiringHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/hollywood/airing', { params });
  },
  getPopularHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/popular/hollywood', { params });
  },
  getUpcomingHollywood: (page = 1, genre = null, filters = {}) => {
    const params = { page, ...filters };
    if (genre) params.genre = genre;
    return api.get('/movies/hollywood/upcoming', { params });
  },
  getTopRatedHollywood: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/movies/hollywood/top_rated', { params });
  },

  // Get movie details
  getDetails: (id) => api.get(`/movies/${id}`),

  // Get movie credits (cast & crew)
  getCredits: (id) => api.get(`/movies/${id}/credits`),

  // Get similar movies
  getSimilar: (id) => api.get(`/movies/${id}/similar`),

  // Get movie videos (trailers)
  getVideos: (id) => api.get(`/movies/${id}/videos`),

  // Get now playing movies
  getNowPlaying: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/movies/now_playing', { params });
  },

  // Get upcoming movies
  getUpcoming: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/movies/upcoming', { params });
  },

  // Get top rated movies
  getTopRated: (page = 1, genre = null) => {
    const params = { page };
    if (genre) params.genre = genre;
    return api.get('/movies/top_rated', { params });
  },

  // Get movies by genre
  getByGenre: (genreId, page = 1) =>
    api.get(`/movies/genre/${genreId}?page=${page}`),

  // Search movies
  search: (query, page = 1) =>
    api.get(`/movies/search?q=${encodeURIComponent(query)}&page=${page}`),

  // Get genres
  getGenres: () => api.get('/movies/genres'),
};

export default moviesAPI;
