/**
 * Lazy Loading Utilities
 *
 * Provides utilities for lazy loading components and data.
 */

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

/**
 * Loading spinner component for lazy loaded content
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-blue-600`}
      />
    </div>
  );
}

/**
 * Loading skeleton for cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-2/3" />
    </div>
  );
}

/**
 * Loading skeleton for tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-t border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/5" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for charts
 */
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="h-48 bg-slate-100 rounded flex items-end justify-around p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-200 rounded-t w-8"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Create a lazy loaded component with custom loading state
 */
export function lazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent: ReactNode = <LoadingSpinner />
) {
  return dynamic(importFn, {
    loading: () => <>{LoadingComponent}</>,
    ssr: false,
  });
}

/**
 * Prefetch a route for faster navigation
 */
export function prefetchRoute(path: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Intersection Observer hook for lazy loading
 */
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    }
  );
}
