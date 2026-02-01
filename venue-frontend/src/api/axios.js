import axios from "axios";

// Helper to determine the dynamic base URL
const getBaseUrl = () => {
  // Check for environment variables
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  // If env var is set, use it (ensuring it ends with /api/v1)
  if (envUrl) {
    // Remove trailing slash and optional /api suffix to normalize
    const cleanUrl = envUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return `${cleanUrl}/api/v1`;
  }

  // Fallback for development (localhost)
  if (import.meta.env.DEV) {
    return "http://localhost:5000/api/v1";
  }

  // Fallback for production (existing Render URL as safety net)
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

export default api;
