'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { authApi } from '@/lib/api';

export default function SessionValidator() {
  const { token, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    authApi.getMe(token).catch(() => {
      logout();
    });
  }, []);

  return null;
}
