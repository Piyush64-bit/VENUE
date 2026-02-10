import api from './axios';

export const movieApi = {
    getAll: async () => {
        const response = await api.get('/movies');
        return response.data;
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
