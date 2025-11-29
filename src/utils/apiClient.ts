import { env } from '../config/env';

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalizedPath}`;
};

const ensureHeaders = (headers?: HeadersInit): HeadersInit => {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!headers) {
    return defaultHeaders;
  }

  if (headers instanceof Headers) {
    const cloned = new Headers(headers);
    if (!cloned.has('Content-Type')) {
      cloned.set('Content-Type', 'application/json');
    }
    return cloned;
  }

  return {
    ...defaultHeaders,
    ...(headers as Record<string, string>),
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: response.statusText }));

    throw new Error(
      (errorPayload && (errorPayload.message || errorPayload.error)) ||
        `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: ensureHeaders(options.headers),
  });
  return handleResponse<T>(response);
};

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

