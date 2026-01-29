/**
 * Authentication Store using Zustand
 * 
 * Manages user authentication state across the app.
 */

import { create } from 'zustand';
import { AuthAPI, TokenManager } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    is_active: boolean;
    avatar_url?: string;
    student_id?: number;
    class_id?: number;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Actions
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,

    login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const response = await AuthAPI.login(username, password);

            // Store tokens
            await TokenManager.setTokens(
                response.access_token,
                response.refresh_token
            );

            // Get user profile
            const user = await AuthAPI.getMe();

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            return true;
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Login failed. Please try again.';
            set({
                error: message,
                isLoading: false,
                isAuthenticated: false,
            });
            return false;
        }
    },

    logout: async () => {
        set({ isLoading: true });

        try {
            await AuthAPI.logout();
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });

        try {
            const token = await TokenManager.getAccessToken();

            if (!token) {
                set({ isLoading: false, isAuthenticated: false });
                return;
            }

            const user = await AuthAPI.getMe();

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            // Token invalid or expired
            await TokenManager.clearTokens();
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    clearError: () => set({ error: null }),
}));
