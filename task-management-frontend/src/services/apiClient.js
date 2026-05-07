import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false

// Queue of requests waiting for token refresh to complete
let failedQueue = []

/**
 * Process the queue of pending requests after a refresh attempt.
 * @param {Error|null} error - If non-null, reject all queued requests with this error
 * @param {string|null} token - New access token to use for retrying queued requests
 */
function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Read a token from the Pinia-persisted auth store in localStorage.
 *
 * pinia-plugin-persistedstate serializes the auth store under the key "auth"
 * as a JSON string: { accessToken, refreshToken, isAuthenticated, user }.
 * Reading individual keys like localStorage.getItem('accessToken') will always
 * return null because the plugin does NOT write flat keys.
 *
 * @param {'accessToken'|'refreshToken'} key
 * @returns {string|null}
 */
function getPersistedToken(key) {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed[key] ?? null
  } catch {
    return null
  }
}

/**
 * Persist an updated accessToken back into the "auth" key so the Pinia store
 * stays in sync after a silent token refresh.
 * @param {string} newToken
 */
function persistAccessToken(newToken) {
  try {
    const raw = localStorage.getItem('auth')
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.accessToken = newToken
    localStorage.setItem('auth', JSON.stringify(parsed))
  } catch {
    // Non-critical — the in-memory store will still work
  }
}

/**
 * Clear auth tokens from the persisted store and redirect to /login.
 */
function clearAuthAndRedirect() {
  try {
    const raw = localStorage.getItem('auth')
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.accessToken = null
    parsed.refreshToken = null
    parsed.isAuthenticated = false
    localStorage.setItem('auth', JSON.stringify(parsed))
  } catch {
    localStorage.removeItem('auth')
  }
  window.location.href = '/login'
}

// Request interceptor: attach AccessToken if available
apiClient.interceptors.request.use(
  (config) => {
    const token = getPersistedToken('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: handle 401 with token refresh, normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized — attempt token refresh once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getPersistedToken('refreshToken')

      // If there is no refresh token at all, bail out immediately
      if (!refreshToken) {
        isRefreshing = false
        processQueue(new Error('No refresh token'), null)
        clearAuthAndRedirect()
        return Promise.reject(normalizeError(error))
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        )

        const newAccessToken = response.data.access

        // Write the new token back so subsequent requests pick it up
        persistAccessToken(newAccessToken)

        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthAndRedirect()
        return Promise.reject(normalizeError(refreshError))
      } finally {
        isRefreshing = false
      }
    }

    // Normalize all errors into { status, message, errors }
    return Promise.reject(normalizeError(error))
  },
)

/**
 * Normalize an Axios error into a consistent error object.
 * @param {Error} error - Axios error
 * @returns {{ status: number, message: string, errors: object }}
 */
function normalizeError(error) {
  if (error.response) {
    const { status, data } = error.response

    const message =
      data?.detail ||
      data?.message ||
      data?.non_field_errors?.[0] ||
      getDefaultMessageForStatus(status)

    const errors = data?.errors || extractFieldErrors(data) || {}

    return { status, message, errors }
  }

  // Network error or request never sent
  return {
    status: 0,
    message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
    errors: {},
  }
}

/**
 * Extract field-level validation errors from response data.
 * Django REST Framework returns validation errors as { fieldName: [messages] }.
 * @param {object} data - Response data
 * @returns {object}
 */
function extractFieldErrors(data) {
  if (!data || typeof data !== 'object') return {}

  const reserved = new Set(['detail', 'message', 'non_field_errors', 'errors'])
  const fieldErrors = {}

  for (const [key, value] of Object.entries(data)) {
    if (!reserved.has(key)) {
      fieldErrors[key] = value
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : {}
}

/**
 * Get a default human-readable message for a given HTTP status code.
 * @param {number} status
 * @returns {string}
 */
function getDefaultMessageForStatus(status) {
  const messages = {
    400: 'Dữ liệu không hợp lệ.',
    401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    403: 'Bạn không có quyền thực hiện thao tác này.',
    404: 'Không tìm thấy tài nguyên yêu cầu.',
    500: 'Đã xảy ra lỗi server. Vui lòng thử lại sau.',
  }
  return messages[status] || 'Đã xảy ra lỗi không xác định.'
}

export default apiClient
