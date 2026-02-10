import api from './axios';

// Get user profile
export const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

// Update user profile
export const updateProfile = async (data) => {
    const response = await api.patch('/users/profile', data);
    return response.data;
};

// Change password
export const changePassword = async (data) => {
    const response = await api.patch('/users/password', data);
    return response.data;
};

// Upload profile picture
export const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await api.post('/users/profile/picture', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get favorites
export const getFavorites = async () => {
    const response = await api.get('/users/favorites');
    return response.data;
};

// Toggle favorite
export const toggleFavorite = async (itemId, itemType) => {
    const response = await api.post('/users/favorites', { itemId, itemType });
    return response.data;
};
