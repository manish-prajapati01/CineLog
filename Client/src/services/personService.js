/**
 * Person API Service
 */

import api from './api';

export const personAPI = {
  // Get person details
  getDetails: (id) => api.get(`/person/${id}`),

  // Get popular people
  getPopular: (page = 1) => api.get(`/person/popular?page=${page}`),

  // Search people
  search: (query, page = 1) =>
    api.get(`/person/search?q=${encodeURIComponent(query)}&page=${page}`),
};

export default personAPI;
