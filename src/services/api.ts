import axios from "axios";

// Frontend API service layer prepared for Django REST Framework
export const apiClient = axios.create({
  baseURL: "/api/backend",
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || !error.response) {
      console.warn("[MetafriX API] Backend non connecté ou hors ligne.");
    }
    return Promise.reject(error);
  }
);
