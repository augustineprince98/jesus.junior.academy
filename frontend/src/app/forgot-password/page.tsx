'use client';

/**
 * Forgot Password Page
 *
 * Allows users to reset their password via OTP verification.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

type Step = 'phone' | 'otp' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await authApi.requestPasswordReset(phone);
      setMessage('If this phone number is registered, you will receive an OTP.');
      setStep('otp');
    } catch (err: any) {
      const detail = err?.detail || err?.message || 'Failed to send OTP';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.verifyPasswordReset(phone, otp, newPassword);
      setStep('success');
    } catch (err: any) {
      const detail = err?.detail || err?.message || 'Failed to reset password';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-200">
      <section className="w-full max-w-sm px-8 py-10 border border-gray-700 bg-slate-900/90">

        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-lg font-serif tracking-wide text-gray-100">
            Password Recovery
          </h1>
          <p className="mt-1 text-xs tracking-widest uppercase text-gray-400">
            Jesus Junior Academy
          </p>
        </header>

        {/* Step 1: Enter Phone */}
        {step === 'phone' && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <p className="text-xs text-gray-400 mb-4">
              Enter your registered phone number to receive a password reset OTP.
            </p>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
                placeholder="Enter your phone number"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full mt-6 py-3
                border border-gray-600
                text-xs tracking-widest uppercase
                transition-colors
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
              `}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP and New Password */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-6">
            {message && (
              <p className="text-xs text-green-400 mb-4">{message}</p>
            )}

            <p className="text-xs text-gray-400 mb-4">
              Enter the OTP sent to your phone and set a new password.
            </p>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-300"
                placeholder="Re-enter password"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full mt-6 py-3
                border border-gray-600
                text-xs tracking-widest uppercase
                transition-colors
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
              `}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setError(null);
                setMessage(null);
              }}
              className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Back to phone entry
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-100 mb-2">
                Password Reset Successful
              </h2>
              <p className="text-xs text-gray-400">
                Your password has been updated. You can now login with your new password.
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 border border-gray-600 text-xs tracking-widest uppercase hover:border-gray-300 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Back to login */}
        {step !== 'success' && (
          <div className="mt-8 text-center border-t border-gray-800 pt-6">
            <a
              href="/login"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Back to Login
            </a>
          </div>
        )}

      </section>
    </main>
  );
}
