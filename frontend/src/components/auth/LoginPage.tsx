'use client';

/**
 * ACCESS GATE
 *
 * This is not a login page.
 * This is controlled entry into an institution.
 *
 * Design principles:
 * - Silent authority
 * - Minimal language
 * - No blame on failure
 * - No encouragement, no apology
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { authApi } from '@/lib/api';

export default function AccessGate() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validatePhone = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;

    // Validate phone number
    if (!validatePhone(phone)) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login(phone, password);
      login(res.user as any, res.access_token);
      // Redirect to campus after successful login
      router.push('/campus');
    } catch (err: any) {
      // Show helpful error message based on server response
      const detail = err?.detail || err?.message || '';
      if (detail.includes('pending approval')) {
        setErrorMessage('Account pending approval. Please wait for admin approval.');
      } else if (detail.includes('rejected')) {
        setErrorMessage('Account was rejected. Please contact the school office.');
      } else if (detail.includes('deactivated')) {
        setErrorMessage('Account has been deactivated. Please contact admin.');
      } else {
        setErrorMessage('Invalid phone number or password.');
      }
      setVerifying(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-200">
      <section className="w-full max-w-sm px-8 py-10 border border-gray-700 bg-slate-900/90">

        {/* Institution Identity */}
        <header className="mb-10 text-center">
          <h1 className="text-lg font-serif tracking-wide text-gray-100">
            Jesus Junior Academy
          </h1>
          <p className="mt-1 text-xs tracking-widest uppercase text-gray-400">
            Digital Campus Access
          </p>
        </header>

        {/* Access Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
              Phone Number <span className="text-gray-500">(10 digits)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
              autoComplete="off"
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
              Access Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
              required
            />
          </div>

          {/* Error message */}
          {errorMessage && (
            <p className="text-xs text-red-400 pt-2">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying}
            className={`
              w-full mt-8 py-3
              border border-gray-600
              text-xs tracking-widest uppercase
              transition-colors
              ${
                verifying
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-gray-300'
              }
            `}
          >
            {verifying ? 'Verifying' : 'Enter'}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <a
            href="/forgot-password"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Forgot your password?
          </a>
        </div>

        {/* Registration link */}
        <div className="mt-6 text-center border-t border-gray-800 pt-6">
          <p className="text-xs text-gray-500 mb-2">
            New to the academy?
          </p>
          <a
            href="/register"
            className="text-xs tracking-wider uppercase text-gray-400 hover:text-gray-200 transition-colors"
          >
            Request Access
          </a>
        </div>

        {/* Footer authority line */}
        <footer className="mt-8 text-center">
          <p className="text-[10px] tracking-wide text-gray-500">
            Access granted by the administration
          </p>
        </footer>

      </section>
    </main>
  );
}
