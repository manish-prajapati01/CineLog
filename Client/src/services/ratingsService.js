/**
 * Ratings API Service
 */

import api from './api';

export const ratingsAPI = {
  // Add or update rating
  rate: (data) => api.post('/ratings', data),

  // Get rating stats for a movie/TV show
  getStats: (tmdbId, mediaType) => api.get(`/ratings/${tmdbId}/${mediaType}`),

  // Get user's rating
  getUserRating: (tmdbId, mediaType) =>
    api.get(`/ratings/user/${tmdbId}/${mediaType}`),

  // Remove rating
  remove: (tmdbId, mediaType) => api.delete(`/ratings/${tmdbId}/${mediaType}`),
};

export default ratingsAPI;
