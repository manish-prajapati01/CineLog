/**
 * Users Redux Slice
 * Manages user authentication state with localStorage persistence
 */
import { createSlice } from '@reduxjs/toolkit';

// Load user from localStorage on initial load
const loadUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const userSlice = createSlice({
  name: 'users',
  initialState: {
    user: loadUserFromStorage(),
    loading: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      // Persist to localStorage
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('user');
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { setUser, setLoading, logout } = userSlice.actions;
export default userSlice.reducer;
