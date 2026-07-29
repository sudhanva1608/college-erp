import axios from 'axios';

const API = axios.create({
  // Use relative /api — Vite dev proxy forwards to backend:5001
  // Works regardless of hostname (localhost, LAN IP, dev tunnel, etc.)
  baseURL: '/api',
});

// Add a request interceptor to attach the JWT token to all API calls
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
