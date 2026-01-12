import api from '../services/api';

// Add Series
export const AddSeries = async (payload) => {
    return await api.post("/admin/series/add-series", payload); // Assuming api wrapper handles base URL or it's just /api/...
}

// Get All Series
export const GetAllSeries = async () => {
    return await api.get("/admin/series");
}

// Get Series By ID
export const GetSeriesById = async (id) => {
    return await api.get(`/admin/series/${id}`);
}

// Update Series
export const UpdateSeries = async (id, payload) => {
    return await api.put(`/admin/series/${id}`, payload);
}

// Delete Series
export const DeleteSeries = async (id) => {
    return await api.delete(`/admin/series/${id}`);
}
