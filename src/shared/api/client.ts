// NOTE: Install axios: npm install axios
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// API Configuration
const API_BASE_URL = '/api/v1'

// Token management
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem('token'),
  setToken: (token: string): void => localStorage.setItem('token', token),
  clearToken: (): void => localStorage.removeItem('token'),
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Error response interface
interface ErrorResponse {
  detail?: string | Array<{ msg?: string; loc?: string[] }>
  message?: string
  code?: string
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponse> | unknown) => {
    // Handle network errors
    if (!error || !(error as AxiosError).response) {
      throw new ApiError('Network error - please check your connection', 0, 'NETWORK_ERROR')
    }

    const axiosError = error as AxiosError<ErrorResponse>
    const { status, data } = axiosError.response || {}

    // Handle 401 Unauthorized - redirect to login
    if (status === 401) {
      tokenManager.clearToken()
      window.location.href = '/login'
      throw new ApiError('Session expired - please log in again', 401, 'UNAUTHORIZED')
    }

    // Handle 403 Forbidden
    if (status === 403) {
      throw new ApiError('You do not have permission to perform this action', 403, 'FORBIDDEN')
    }

    // Handle 404 Not Found
    if (status === 404) {
      throw new ApiError('Resource not found', 404, 'NOT_FOUND')
    }

    // Handle validation errors (422)
    if (status === 422 && data?.detail && Array.isArray(data.detail)) {
      const messages = data.detail.map(
        (err: { loc?: string[]; msg?: string }) => `${err.loc?.slice(-1)[0] ?? ''}: ${err.msg ?? String(err)}`
      ).join('; ')
      throw new ApiError(messages, 422, 'VALIDATION_ERROR', data)
    }

    // Handle other errors
    const message = data?.detail || data?.message || 'An unexpected error occurred'
    throw new ApiError(String(message), status, `HTTP_${status}`, data)
  }
)

// Retry configuration for transient failures
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 500

function isRetryableError(error: AxiosError | unknown): boolean {
  if (!error || !(error as AxiosError).response) {
    return true // network error
  }
  const status = (error as AxiosError).response?.status
  return status === 429 || (status !== undefined && status >= 500) || status === 408
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generic request wrapper with better typing and retry logic
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  config?: Record<string, unknown>
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await apiClient.request<T>({
        method,
        url,
        data,
        ...config,
      })
      return response.data
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES - 1 && isRetryableError(error as AxiosError)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }
      throw error
    }
  }

  throw lastError
}

// Convenience methods
export const api = {
  get: <T>(url: string, config?: Record<string, unknown>) => 
    apiRequest<T>('GET', url, undefined, config),
  
  post: <T>(url: string, data?: unknown, config?: Record<string, unknown>) => 
    apiRequest<T>('POST', url, data, config),
  
  put: <T>(url: string, data?: unknown, config?: Record<string, unknown>) => 
    apiRequest<T>('PUT', url, data, config),
  
  patch: <T>(url: string, data?: unknown, config?: Record<string, unknown>) => 
    apiRequest<T>('PATCH', url, data, config),
  
  delete: <T>(url: string, config?: Record<string, unknown>) => 
    apiRequest<T>('DELETE', url, undefined, config),
}

export default apiClient
