import { getApiUrl, API_BASE_URL } from './apiConfig';
import { tokenService } from './tokenService';

export interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'API_ERROR', statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const apiClient = {
  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { requiresAuth = true, headers: customHeaders, ...fetchOptions } = options;

    const url = getApiUrl(endpoint);
    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(customHeaders as Record<string, string>),
    };

    // If body is FormData, ensure Content-Type is never manually set so browser generates boundary
    if (isFormData && headers['Content-Type']) {
      delete headers['Content-Type'];
    }

    if (requiresAuth) {
      const token = await tokenService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (__DEV__) {
      console.log(`[API Request] ${fetchOptions.method || 'GET'} -> ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
        const errorCode = data?.error?.code || 'SERVER_ERROR';

        if (__DEV__) {
          console.warn(`[API Error] ${response.status} from ${url}:`, errorMsg);
        }

        throw new ApiError(errorMsg, errorCode, response.status);
      }

      if (__DEV__) {
        console.log(`[API Response Success] ${url}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      const err = error as Error;
      
      if (__DEV__) {
        console.warn(`[Network/Client Exception] ${url}:`, err.message);
      }

      if (err.message && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
        throw new ApiError(
          `Unable to connect to backend server at ${API_BASE_URL}. Please check server and network connection.`,
          'NETWORK_ERROR',
          0
        );
      }
      throw new ApiError(err.message || 'An unexpected error occurred', 'CLIENT_ERROR', 0);
    }
  },

  async get<T = any>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  async post<T = any>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  async put<T = any>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  async patch<T = any>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  async delete<T = any>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },
};
