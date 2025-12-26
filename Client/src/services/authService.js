/**
 * Auth API Service
 */

import api from './api';

export const authAPI = {
  // Register new user
  register: (data) => api.post('/auth/register', data),

  // Login user
  login: (data) => api.post('/auth/login', data),

  // Get current user
  getMe: () => api.get('/auth/me'),

  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
};

export default authAPI;
