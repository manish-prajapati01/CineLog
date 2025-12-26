/**
 * Reviews API Service
 */

import api from './api';

export const reviewsAPI = {
  // Create review
  create: (data) => api.post('/reviews', data),

  // Get reviews for a movie/TV show
  getByMedia: (tmdbId, mediaType, options = {}) => {
    const { page = 1, limit = 10, sort = 'recent' } = options;
    return api.get(
      `/reviews/${tmdbId}/${mediaType}?page=${page}&limit=${limit}&sort=${sort}`,
    );
  },

  // Like/unlike review
  toggleLike: (reviewId) => api.put(`/reviews/${reviewId}/like`),

  // Delete review
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),

  // Get user's reviews
  getMyReviews: () => api.get('/reviews/user/me'),
};

export default reviewsAPI;
