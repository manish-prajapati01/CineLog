import api from '../services/api';

export const AddMovie = async (payload) => {
  return await api.post('/admin/movies/add-movie', payload);
};

export const GetAllMovies = async () => {
  return await api.get('/admin/movies/');
};

export const GetMovieById = async (id) => {
  return await api.get(`/admin/movies/${id}`);
};

export const UpdateMovie = async (id, data) => {
  return await api.put(`/admin/movies/${id}`, data);
};

export const DeleteMovie = async (id) => {
  return await api.delete(`/admin/movies/${id}`);
};
