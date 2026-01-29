/**
 * API Client for Jesus Junior Academy Mobile App
 * 
 * Connects to the same backend as the web application.
 * Handles authentication, token refresh, and API requests.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base URL - Production backend on Render
const API_BASE_URL = __DEV__
    ? 'http://192.168.1.100:8000'  // Local development (update with your IP)
    : 'https://jja-backend.onrender.com';  // Production on Render

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management
export const TokenManager = {
    async getAccessToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    },

    async getRefreshToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    },

    async setTokens(accessToken: string, refreshToken: string): Promise<void> {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    },

    async clearTokens(): Promise<void> {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    },
};

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await TokenManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await TokenManager.getRefreshToken();
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token } = response.data;
                    await TokenManager.setTokens(access_token, refresh_token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                await TokenManager.clearTokens();
            }
        }

        return Promise.reject(error);
    }
);

// API endpoints
export const AuthAPI = {
    login: async (username: string, password: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    register: async (data: {
        name: string;
        email: string;
        phone_number: string;
        password: string;
        role?: string;
    }) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    logout: async () => {
        await TokenManager.clearTokens();
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

export const NotificationsAPI = {
    getAll: async (limit = 20, offset = 0) => {
        const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
        return response.data;
    },

    markAsRead: async (id: number) => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },
};

export const AttendanceAPI = {
    getStudentAttendance: async (studentId: number, month?: string) => {
        const params = month ? `?month=${month}` : '';
        const response = await api.get(`/attendance/student/${studentId}${params}`);
        return response.data;
    },

    getSummary: async (studentId: number) => {
        const response = await api.get(`/attendance/student/${studentId}/summary`);
        return response.data;
    },
};

export const ResultsAPI = {
    getStudentResults: async (studentId: number) => {
        const response = await api.get(`/results/student/${studentId}`);
        return response.data;
    },

    getReportCard: async (studentId: number, examId: number) => {
        const response = await api.get(`/results/student/${studentId}/exam/${examId}`);
        return response.data;
    },
};

export const FeesAPI = {
    getDue: async (studentId: number) => {
        const response = await api.get(`/fees/due/${studentId}`);
        return response.data;
    },

    getHistory: async (studentId: number) => {
        const response = await api.get(`/fees/history/${studentId}`);
        return response.data;
    },
};

export const EventsAPI = {
    getPublic: async () => {
        const response = await api.get('/events/public');
        return response.data;
    },

    getUpcoming: async () => {
        const response = await api.get('/events/upcoming');
        return response.data;
    },
};

export const HomeworkAPI = {
    getForStudent: async (studentId: number, classId: number) => {
        const response = await api.get(`/homework/student/${studentId}/class/${classId}`);
        return response.data;
    },

    getPending: async (studentId: number) => {
        const response = await api.get(`/homework/student/${studentId}/pending`);
        return response.data;
    },
};

export default api;
