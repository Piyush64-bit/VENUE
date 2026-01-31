import axios from "axios";

const api = axios.create({
  baseURL: "https://venue-z8ti.onrender.com/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
