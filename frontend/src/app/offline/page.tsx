'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-200 mb-4">
            <WifiOff className="w-12 h-12 text-slate-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-slate-600 mb-8">
          It looks like you've lost your internet connection. Please check your
          connection and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium border border-slate-200"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-12 p-4 bg-white rounded-lg border border-slate-200">
          <h2 className="font-semibold text-slate-700 mb-2">
            While you're offline:
          </h2>
          <ul className="text-sm text-slate-600 text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Previously visited pages may still be available
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Your data will sync when you're back online
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">&#9679;</span>
              Some features require an internet connection
            </li>
          </ul>
        </div>

        {/* JJA Branding */}
        <div className="mt-8 text-slate-400 text-sm">
          <p>Jesus Junior Academy</p>
          <p>Digital Campus</p>
        </div>
      </div>
    </div>
  );
}
