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
  const [failed, setFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;

    setVerifying(true);
    setFailed(false);

    try {
      const res = await authApi.login(phone, password);
      login(res.user as any, res.access_token);
      // Redirect to campus after successful login
      router.push('/campus');
    } catch {
      // Silent failure — no blame, no drama
      setFailed(true);
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
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
              autoComplete="off"
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

          {/* Silent failure message */}
          {failed && (
            <p className="text-xs text-gray-500 pt-2">
              Access could not be verified.
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

        {/* Footer authority line */}
        <footer className="mt-12 text-center">
          <p className="text-[10px] tracking-wide text-gray-500">
            Access granted by the administration
          </p>
        </footer>

      </section>
    </main>
  );
}
