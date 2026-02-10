import { io } from 'socket.io-client';

// Socket connects to the root URL (e.g., http://localhost:5000), not /api
// API URL might be http://localhost:5000/api
const getSocketUrl = () => {
    // Match axios logic: Prefer BASE_URL, fallback to URL, then localhost
    let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove /api if user accidentally included it in the env var
    url = url.replace(/\/api\/?$/, '');
    // Remove trailing slash
    return url.replace(/\/$/, '');
};

export const socket = io(getSocketUrl(), {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 10000,
});
