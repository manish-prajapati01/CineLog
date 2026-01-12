import api from '../services/api';

export const AddArtist = async (payload) => {
  return await api.post('/artists/add', payload);
};

export const GetAllArtists = async () => {
  return await api.get('/artists');
};

export const GetArtistById = async (id) => {
  return await api.get(`/artists/${id}`);
};

export const UpadteArtist = async (id, payload) => {
  return await api.put(`/artists/${id}`, payload);
};

export const DeleteArtist = async (id) => {
  return await api.delete(`/artists/${id}`);
};
