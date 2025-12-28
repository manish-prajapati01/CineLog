import apiRequest from '.';

export const AddMovie = async (payload) => {
  return await apiRequest({
    method: 'POST',
    endPoint: '/api/admin/movies/add-movie',
    payload,
  });
};

export const GetAllMovies = async () => {
  return await apiRequest({
    method: 'GET',
    endPoint: '/api/admin/movies/',
  });
};

export const GetMovieById = async (id) => {
  return await apiRequest({
    method: 'GET',
    endPoint: `/api/admin/movies/${id}`,
  });
};
export const UpdateMovie = async (id, data) => {
  return await apiRequest({
    method: 'PUT',
    endPoint: `/api/admin/movies/${id}`,
    payload: data,
  });
};

export const DeleteMovie = async (id) => {
  return await apiRequest({
    method: 'DELETE',
    endPoint: `/api/admin/movies/${id}`,
  });
};
