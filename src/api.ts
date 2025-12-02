import axios from 'axios';

const BASE_URL = import.meta.env.PROD 
  ? 'https://office-smartsuite.onrender.com/api' 
  : 'http://localhost:3001/api';
const TOKEN_KEY = 'authToken';

// Create an Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api, TOKEN_KEY };