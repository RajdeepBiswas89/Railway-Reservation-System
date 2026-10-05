const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const TOKEN_STORAGE_KEY = 'railnex_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function buildHeaders(extra?: HeadersInit, hasJsonBody = false): Headers {
  const headers = new Headers(extra || {});
  const token = getAuthToken();

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = buildHeaders(options.headers as HeadersInit, options.body !== undefined);

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const payloadText = await response.text();
    let message = 'Request failed';

    try {
      const payload = JSON.parse(payloadText);
      if (typeof payload?.detail === 'string') message = payload.detail;
      else if (typeof payload?.message === 'string') message = payload.message;
      else if (payload?.error) message = String(payload.error);
    } catch {
      if (payloadText) message = payloadText;
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
