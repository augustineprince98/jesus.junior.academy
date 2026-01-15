'use client';

/**
 * Login Page
 *
 * Dedicated login page for authentication.
 * After successful login, redirects to /campus
 */

import AccessGate from '@/components/auth/LoginPage';
import { useAuthStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Redirect to campus if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/campus');
    }
  }, [isAuthenticated, router]);

  return <AccessGate />;
}
