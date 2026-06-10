import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { refreshFirebaseToken } from './refresh';
import { ApiError, type ApiEnvelope } from './types';

const PUBLIC_AUTH_PREFIXES = [
  // OAuth login exchange — pre-token, so no Bearer is attached and a 401 here
  // must not trigger the silent-refresh retry.
  '/authentication/v1/login',
];

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// In dev, leave VITE_API_BASE_URL unset — the Vite proxy forwards same-origin
// requests to VITE_GATEWAY_URL. In production builds, set VITE_API_BASE_URL to
// the gateway URL so the SPA can talk to it directly (requires CORS).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = useAuthStore.getState().session;
  if (session?.accessToken && !isPublicAuthPath(config.url)) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  return config;
});

// Unwrap finance-common's ApiResponse envelope on success so callers see the inner data.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data as ApiEnvelope<unknown> | undefined;
    if (body && typeof body === 'object' && 'success' in body && body.success === true) {
      return { ...response, data: body.data };
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope<never>>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    // One-shot refresh on 401 for non-auth endpoints.
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    if (
      status === 401 &&
      original &&
      !original._retried &&
      !isPublicAuthPath(original.url)
    ) {
      original._retried = true;
      const session = useAuthStore.getState().session;
      if (session?.refreshToken) {
        const next = await refreshFirebaseToken(session.refreshToken);
        if (next) {
          useAuthStore.getState().setSession(next);
          original.headers.set('Authorization', `Bearer ${next.accessToken}`);
          return apiClient.request(original);
        }
      }
      useAuthStore.getState().clearSession();
    }

    if (body && body.success === false) {
      throw new ApiError({
        code: body.error.code,
        message: body.error.message,
        status,
        fieldErrors: body.error.fieldErrors,
      });
    }
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: error.message ?? 'Network request failed',
      status,
    });
  },
);
