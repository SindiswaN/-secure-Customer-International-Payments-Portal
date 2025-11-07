// api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:5001",
  withCredentials: true,
  timeout: 10000,
});

export default api;
