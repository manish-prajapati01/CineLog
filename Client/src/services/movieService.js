/**
 * Movies API Service
 * Complete API for movies with all TMDB endpoints
 */

import api from './api';

const movieService = {
  // Get trending movies
  getTrending: (timeWindow = 'week') =>
    api.get(`/movies/trending?timeWindow=${timeWindow}`),

  // Get popular movies
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),

  // Get now playing movies
  getNowPlaying: (page = 1) => api.get(`/movies/now_playing?page=${page}`),

  // Get upcoming movies
  getUpcoming: (page = 1) => api.get(`/movies/upcoming?page=${page}`),

  // Get top rated movies
  getTopRated: (page = 1) => api.get(`/movies/top_rated?page=${page}`),

  // Get movie details
  getMovieDetails: (id) => api.get(`/movies/${id}`),

  // Get movie credits (cast & crew)
  getMovieCredits: (id) => api.get(`/movies/${id}/credits`),

  // Get similar movies
  getSimilarMovies: (id) => api.get(`/movies/${id}/similar`),

  // Get movie videos (trailers)
  getMovieVideos: (id) => api.get(`/movies/${id}/videos`),

  // Get movies by genre
  getByGenre: (genreId, page = 1) =>
    api.get(`/movies/genre/${genreId}?page=${page}`),

  // Search movies
  search: (query, page = 1) =>
    api.get(`/movies/search?q=${encodeURIComponent(query)}&page=${page}`),

  // Get genres
  getGenres: () => api.get('/movies/genres'),
};

export default movieService;
export { movieService as moviesAPI };
