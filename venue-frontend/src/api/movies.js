import api from './axios';

export const movieApi = {
    getAll: async () => {
        const response = await api.get('/movies');
        // Return movies array directly to ensure consistency across components
        return response.data?.data?.movies || [];
    },
    getById: async (id) => {
        const response = await api.get(`/movies/${id}`);
        return response.data;
    },
    getSlots: async (id) => {
        const response = await api.get(`/movies/${id}/slots`);
        return response.data;
    }
};
