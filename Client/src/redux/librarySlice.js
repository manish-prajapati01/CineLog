import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';
export const fetchLibrary = createAsyncThunk(
  'library/fetch',
  async () => (await api.get('/watchlist')).data,
);
const slice = createSlice({
  name: 'library',
  initialState: { items: [], loaded: false },
  reducers: {
    setLibrary: (state, action) => {
      state.items = action.payload;
      state.loaded = true;
    },
    clearLibrary: (state) => {
      state.items = [];
      state.loaded = false;
    },
  },
  extraReducers: (builder) =>
    builder.addCase(fetchLibrary.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loaded = true;
    }),
});
export const { setLibrary, clearLibrary } = slice.actions;
export default slice.reducer;
