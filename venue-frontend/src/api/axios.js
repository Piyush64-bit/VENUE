import axios from "axios";

// Helper to determine the dynamic base URL
const getBaseUrl = () => {
  // 1. Production (Environment Variable)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Development (Localhost)
  if (import.meta.env.DEV) {
    return "http://localhost:5000/api/v1";
  }

  // 3. Fallback (Live Render URL - Safety net)
  return "https://venue-z8ti.onrender.com/api/v1";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log errors in development for easier debugging
    if (import.meta.env.DEV) {
      console.error("API Error:", error.response?.data?.message || error.message);
    }

    // Pass the error forward
    return Promise.reject(error);
  }
);

// Request interceptor - Token is automatically sent via httpOnly cookies
// No need to manually attach from localStorage (security improvement)
api.interceptors.request.use(
  (config) => {
    // Token is sent automatically via cookies with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
