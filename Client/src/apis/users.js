import api from '../services/api';

export const GetAllUsers = async () => {
  return await api.get('/users/get-all-users');
};
