// api.js
import axios from "axios";

// Temporary fix for development - ignore self-signed certificates
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const api = axios.create({
  baseURL: "https://localhost:5001",
  withCredentials: true,
  timeout: 10000,
});

export default api;