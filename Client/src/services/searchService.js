/**
 * Search API Service
 * Multi-search and person details
 */

import api from './api';

const searchService = {
  // Multi-search (movies, TV, people)
  searchMulti: (query, page = 1) =>
    api.get(`/search/multi?q=${encodeURIComponent(query)}&page=${page}`),

  multiSearch: (query, page = 1) =>
    api.get(`/search/multi?q=${encodeURIComponent(query)}&page=${page}`),

  // Search movies only
  searchMovies: (query, page = 1) =>
    api.get(`/search/movie?q=${encodeURIComponent(query)}&page=${page}`),

  // Search TV shows only
  searchTV: (query, page = 1) =>
    api.get(`/search/tv?q=${encodeURIComponent(query)}&page=${page}`),

  // Search people only
  searchPeople: (query, page = 1) =>
    api.get(`/search/person?q=${encodeURIComponent(query)}&page=${page}`),

  // Get person details
  getPersonDetails: (id) => api.get(`/search/person/${id}`),

  // Get person combined credits
  getPersonCredits: (id) => api.get(`/search/person/${id}/credits`),
};

export default searchService;
export { searchService as searchAPI };
