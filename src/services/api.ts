import axios from "axios";

// Frontend API service layer prepared for Django REST Framework
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("afrihub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful error handling for offline/demo mode
    if (error.code === "ECONNABORTED" || !error.response) {
      console.warn("[MetafriX API] Backend non connecté ou hors ligne, repli sur le cache local.");
    }
    return Promise.reject(error);
  }
);
