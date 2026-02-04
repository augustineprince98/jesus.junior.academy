'use client';

/**
 * ACCESS GATE - Igloo-Inspired Login Experience
 *
 * Elegant dark theme with glassmorphism,
 * glow effects, and refined input styling.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { authApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AccessGate() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (!validatePhone(phone)) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login(phone, password);
      login(res.user as any, res.access_token);
      router.push('/campus');
    } catch (err: any) {
      const detail = (err?.detail || err?.message || '').toLowerCase();
      if (detail.includes('pending approval') || detail.includes('pending')) {
        setErrorMessage('Account pending approval. Please wait for admin approval.');
      } else if (detail.includes('rejected')) {
        setErrorMessage('Account was rejected. Please contact the school office.');
      } else if (detail.includes('deactivated')) {
        setErrorMessage('Account has been deactivated. Please contact admin.');
      } else if (detail.includes('invalid credentials') || detail.includes('invalid')) {
        setErrorMessage('Invalid phone number or password.');
      } else if (detail.includes('rate') || detail.includes('too many')) {
        setErrorMessage('Too many login attempts. Please wait a minute and try again.');
      } else {
        setErrorMessage(err?.detail || err?.message || 'Login failed. Please try again.');
      }
      setVerifying(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dots" />

      {/* Glow orbs */}
      <div className="glow-orb glow-orb-blue w-[400px] h-[400px] -top-20 -left-20 opacity-20" />
      <div className="glow-orb glow-orb-gold w-[300px] h-[300px] bottom-20 -right-20 opacity-15" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="gradient-border p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="icon-circle icon-circle-lg icon-circle-accent mx-auto mb-6">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="font-bambi text-lg sm:text-2xl text-[var(--text-primary)] mb-2 whitespace-nowrap">JESUS JUNIOR ACADEMY</h1>
            <p className="text-[var(--text-secondary)] text-sm tracking-wide">Digital Campus Access</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="input pr-16"
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
                  {phone.length}/10
                </span>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <p className="text-sm text-red-400">{errorMessage}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={verifying}
              className={`w-full btn btn-primary py-4 flex items-center justify-center gap-2 ${verifying ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Enter Campus
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Registration Link */}
          <div className="mt-8 pt-8 border-t border-[var(--glass-border)] text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-3">New to the academy?</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-[var(--accent-blue)] hover:text-[var(--text-primary)] font-semibold transition-colors group"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Protected by Jesus Junior Academy Administration
        </p>
      </motion.div>
    </main>
  );
}
