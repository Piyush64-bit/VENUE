import axios from 'axios';

const getBaseUrl = () => {
    // Check both variable names (User asked for BASE_URL, code had URL)
    let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove trailing slash to prevent double slashes
    return url.replace(/\/$/, '');
};

const api = axios.create({
    baseURL: `${getBaseUrl()}/api/v1`, // Standardizes to: https://server.com/api/v1
    withCredentials: true,
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
