import api from './axios';

export const organizerApi = {
    getStats: async () => {
        const response = await api.get('/organizer/stats');
        return response.data;
    },

    // Events
    getMyEvents: async () => {
        const response = await api.get('/organizer/events');
        return response.data;
    },
    createEvent: async (data) => {
        const response = await api.post('/organizer/events', data);
        return response.data;
    },
    updateEvent: async (id, data) => {
        const response = await api.patch(`/organizer/events/${id}`, data);
        return response.data;
    },
    deleteEvent: async (id) => {
        const response = await api.delete(`/organizer/events/${id}`);
        return response.data;
    },
    toggleEventPublish: async (id, publish) => {
        const response = await api.patch(`/organizer/events/${id}/publish`, { publish });
        return response.data;
    },

    // Movies
    getMyMovies: async () => {
        const response = await api.get('/organizer/movies');
        return response.data;
    },
    createMovie: async (data) => {
        const response = await api.post('/organizer/movies', data);
        return response.data;
    },
    updateMovie: async (id, data) => {
        const response = await api.patch(`/organizer/movies/${id}`, data);
        return response.data;
    },
    deleteMovie: async (id) => {
        const response = await api.delete(`/organizer/movies/${id}`);
        return response.data;
    },
    toggleMoviePublish: async (id, publish) => {
        const response = await api.patch(`/organizer/movies/${id}/publish`, { publish });
        return response.data;
    },

    // Slots
    createSlot: async (parentId, parentType, data) => {
        // parentType: 'event' or 'movie'
        const endpoint = parentType === 'event'
            ? `/organizer/events/${parentId}/slots`
            : `/organizer/movies/${parentId}/slots`;

        const response = await api.post(endpoint, data);
        return response.data;
    },
    getSlots: async (parentId, parentType) => {
        const endpoint = parentType === 'event'
            ? `/organizer/events/${parentId}/slots`
            : `/organizer/movies/${parentId}/slots`;

        const response = await api.get(endpoint);
        return response.data;
    },
    deleteSlot: async (id) => {
        const response = await api.delete(`/organizer/slots/${id}`);
        return response.data;
    },
    updateSlot: async (id, data) => {
        const response = await api.patch(`/organizer/slots/${id}`, data);
        return response.data;
    },

    // Profile & Settings
    getProfile: async () => {
        const response = await api.get('/organizer/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await api.patch('/organizer/profile', data);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await api.patch('/organizer/password', data);
        return response.data;
    }
};