/**
 * Runtime configuration (public env vars)
 *
 * Centralizes NEXT_PUBLIC_* access so we don't sprinkle fallbacks throughout the app.
 * In production we fail fast if config is missing to avoid silently calling the wrong backend.
 */

const isProduction = process.env.NODE_ENV === 'production';

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export function getApiBaseUrl(): string {
  const fromEnv = clean(process.env.NEXT_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  if (isProduction) {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL. Set it in Vercel env (or frontend/vercel.json) to the backend base URL.'
    );
  }

  return 'http://localhost:8000';
}

export function getWsUrl(): string {
  const wsFromEnv = clean(process.env.NEXT_PUBLIC_WS_URL);
  if (wsFromEnv) return wsFromEnv;

  const apiBase = getApiBaseUrl();
  const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws';
  const wsHost = apiBase.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${wsHost}/ws`;
}

export const API_BASE_URL = getApiBaseUrl();
export const WS_URL = getWsUrl();

