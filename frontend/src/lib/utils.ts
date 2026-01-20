/**
 * Utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format time to readable string
 */
export function formatTime(time: string | null): string {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get grade color for results
 */
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'text-emerald-600',
    'A': 'text-green-600',
    'B+': 'text-blue-600',
    'B': 'text-blue-500',
    'C+': 'text-yellow-600',
    'C': 'text-yellow-500',
    'D': 'text-orange-500',
    'F': 'text-red-600',
  };
  return colors[grade] || 'text-gray-600';
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Attendance
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    HALF_DAY: 'bg-orange-100 text-orange-800',
    ON_LEAVE: 'bg-blue-100 text-blue-800',
    // Leave status
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    // Fee status
    PAID: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get notification priority color
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'text-gray-500',
    NORMAL: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-600',
  };
  return colors[priority] || 'text-gray-500';
}

/**
 * Calculate days until a date
 */
export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep utility for animations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Device detection for responsive 3D rendering
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if device supports WebGL 2
 */
export function supportsWebGL2(): boolean {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  return !!gl;
}

/**
 * Safely extract error message from API errors
 * Handles FastAPI validation errors (422) which return arrays/objects
 */
export function getErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  if (!error) return fallback;
  
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // Try to get detail from error object
  if (error.detail) {
    if (typeof error.detail === 'string') {
      return error.detail;
    }
    // FastAPI validation errors are arrays
    if (Array.isArray(error.detail)) {
      return error.detail.map((e: any) => {
        if (typeof e === 'string') return e;
        if (e.msg) return `${e.loc?.join('.') || ''}: ${e.msg}`;
        return JSON.stringify(e);
      }).join(', ');
    }
    // If detail is an object, try to extract message
    if (typeof error.detail === 'object') {
      return error.detail.message || error.detail.error || JSON.stringify(error.detail);
    }
  }
  
  // Try error.message
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  return fallback;
}
