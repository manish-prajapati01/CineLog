import api from '../services/api';
export const UploadImage = (payload) =>
  api.post('/images/upload-image', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
