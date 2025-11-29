const FALLBACK_API_BASE_URL = 'http://localhost:5000/api';

const sanitizeBaseUrl = (value: string) => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const resolveBaseUrl = () => {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;

  if (envUrl && envUrl.trim().length > 0) {
    return sanitizeBaseUrl(envUrl);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return sanitizeBaseUrl(`${window.location.origin}/api`);
  }

  return sanitizeBaseUrl(FALLBACK_API_BASE_URL);
};

export const env = Object.freeze({
  apiBaseUrl: resolveBaseUrl(),
});

export type EnvConfig = typeof env;

