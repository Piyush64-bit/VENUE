import { io } from 'socket.io-client';

// Socket connects to the root URL (e.g., http://localhost:5000), not /api
// API URL might be http://localhost:5000/api
const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
        const url = new URL(apiUrl);
        return url.origin; // e.g. http://localhost:5000
    } catch (e) {
        return 'http://localhost:5000';
    }
};

export const socket = io(getSocketUrl(), {
    autoConnect: false,
});
