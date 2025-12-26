/**
 * Watchlist API Service
 */

import api from './api';

export const watchlistAPI = {
  // Get user's watchlist
  get: () => api.get('/watchlist'),
  getWatchlist: () => api.get('/watchlist'),

  // Add to watchlist
  add: (data) => api.post('/watchlist', data),

  // Remove from watchlist
  remove: (tmdbId, mediaType) =>
    api.delete(`/watchlist/${tmdbId}/${mediaType}`),

  // Check if in watchlist
  check: (tmdbId, mediaType) =>
    api.get(`/watchlist/check/${tmdbId}/${mediaType}`),
};

export default watchlistAPI;
