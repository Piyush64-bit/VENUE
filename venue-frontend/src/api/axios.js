import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1',
    withCredentials: true, // Important for HttpOnly cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor not needed for Auth header anymore (using Cookies)
// Keeping it clean for now.

// Response interceptor for error handling (optional global handling)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401s if needed (e.g., logout)
        return Promise.reject(error);
    }
);

export default api;
