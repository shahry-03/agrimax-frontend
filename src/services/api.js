import axios from 'axios';

// ══════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = '/api/v1';
const FULL_API_URL = `${BASE_URL}${API_PREFIX}`; // Single source of truth
const IS_DEV = import.meta.env.DEV;

const DEFAULT_TIMEOUT = 15000;
const UPLOAD_TIMEOUT = 60000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 800;

// ══════════════════════════════════════════════════════
// Error code enum
// ══════════════════════════════════════════════════════
export const ErrorCode = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
};

const FRIENDLY_MESSAGES = {
  [ErrorCode.NETWORK]: {
    en: 'Cannot connect to AgriMax. Please check your internet connection.',
    ur: 'ایگری میکس سے رابطہ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔',
  },
  [ErrorCode.TIMEOUT]: {
    en: 'The request took too long. Please try again.',
    ur: 'درخواست میں بہت وقت لگا۔ دوبارہ کوشش کریں۔',
  },
  [ErrorCode.UNAUTHORIZED]: {
    en: 'Your session expired. Please log in again.',
    ur: 'آپ کا سیشن ختم ہو گیا۔ دوبارہ لاگ ان کریں۔',
  },
  [ErrorCode.FORBIDDEN]: {
    en: 'You do not have permission for this action.',
    ur: 'آپ کو اس کام کی اجازت نہیں ہے۔',
  },
  [ErrorCode.NOT_FOUND]: {
    en: 'The requested item was not found.',
    ur: 'درخواست کردہ چیز نہیں ملی۔',
  },
  [ErrorCode.SERVER]: {
    en: 'Our servers are having issues. Please try again shortly.',
    ur: 'سرورز میں مسئلہ ہے۔ تھوڑی دیر بعد کوشش کریں۔',
  },
  [ErrorCode.VALIDATION]: {
    en: 'Please check your input and try again.',
    ur: 'اپنا ڈیٹا چیک کریں اور دوبارہ کوشش کریں۔',
  },
  [ErrorCode.UNKNOWN]: {
    en: 'An unexpected error occurred.',
    ur: 'کوئی غیر متوقع خرابی پیش آئی۔',
  },
};

// ══════════════════════════════════════════════════════
// Axios instances
// ══════════════════════════════════════════════════════
const api = axios.create({
  baseURL: FULL_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: DEFAULT_TIMEOUT,
  withCredentials: false,
});

// Dedicated client for token refresh — bypasses interceptors entirely
const refreshClient = axios.create({
  baseURL: FULL_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: DEFAULT_TIMEOUT,
});

// ══════════════════════════════════════════════════════
// Refresh coordination
// ══════════════════════════════════════════════════════
let isRefreshing = false;
let refreshQueue = [];

function processRefreshQueue(error, token = null) {
  // ✅ Clear FIRST, then iterate — prevents stuck queue on sync throw
  const queue = refreshQueue;
  refreshQueue = [];
  queue.forEach(({ resolve, reject }) => {
    try {
      if (error) reject(error);
      else resolve(token);
    } catch (e) {
      console.error('[API] Queue item failed:', e);
    }
  });
}

function clearAuthSession() {
  localStorage.removeItem('agrimax_token');
  localStorage.removeItem('agrimax_refresh_token');
  localStorage.removeItem('agrimax_user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrimax:session-expired'));
  }
}

// ══════════════════════════════════════════════════════
// Error normalization
// ══════════════════════════════════════════════════════
export function normalizeError(error) {
  if (error._isNormalized) return error;

  const status = error.response?.status;
  const data = error.response?.data;

  let code;
  if (!error.response) {
    code =
      error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')
        ? ErrorCode.TIMEOUT
        : ErrorCode.NETWORK;
  } else if (status === 401) code = ErrorCode.UNAUTHORIZED;
  else if (status === 403) code = ErrorCode.FORBIDDEN;
  else if (status === 404) code = ErrorCode.NOT_FOUND;
  else if (status >= 400 && status < 500) code = ErrorCode.VALIDATION;
  else if (status >= 500) code = ErrorCode.SERVER;
  else code = ErrorCode.UNKNOWN;

  error.code = code;
  error.status = status;
  error._isNormalized = true;

  error.friendlyMessage = {
    en:
      data?.messageEn ||
      data?.error ||
      FRIENDLY_MESSAGES[code]?.en ||
      FRIENDLY_MESSAGES[ErrorCode.UNKNOWN].en,
    ur:
      data?.messageUr ||
      FRIENDLY_MESSAGES[code]?.ur ||
      FRIENDLY_MESSAGES[ErrorCode.UNKNOWN].ur,
  };

  return error;
}

// ══════════════════════════════════════════════════════
// Request interceptor
// ══════════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    // 1. Attach JWT (safe for AxiosHeaders)
    const token = localStorage.getItem('agrimax_token');
    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 2. Per-request timeout (audio uploads need longer)
    if (config.meta?.longTimeout) {
      config.timeout = UPLOAD_TIMEOUT;
    }

    // 3. ✅ CRITICAL FIX: Remove Content-Type for FormData
    //    So the browser generates multipart boundary automatically
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }

    // 4. Dev logging
    if (IS_DEV) {
      console.log(
        `%c→ ${config.method?.toUpperCase()} %c${config.url}`,
        'color: #3b82f6; font-weight: bold',
        'color: #64748b',
        config.data instanceof FormData ? '[FormData]' : config.data || config.params || ''
      );
    }

    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

// ══════════════════════════════════════════════════════
// Response interceptor
// ══════════════════════════════════════════════════════
api.interceptors.response.use(
  (response) => {
    if (IS_DEV) {
      console.log(
        `%c✓ ${response.status} %c${response.config.url}`,
        'color: #10b981; font-weight: bold',
        'color: #64748b',
        response.data
      );
    }
    return response;
  },
  async (error) => {
    const originalConfig = error.config || {};
    const url = originalConfig.url || '';

    // ─────────────────────────────────────────────
    // Canceled request — reject immediately
    // ─────────────────────────────────────────────
    if (originalConfig.signal?.aborted || error.code === 'ERR_CANCELED') {
      return Promise.reject(normalizeError(error));
    }

    // ✅ Precise auth endpoint detection — NOT all /auth/* routes
    const isAuthEndpoint = /\/auth\/(send-otp|verify-otp|login|register)/.test(url);
    const isRefreshEndpoint = /\/auth\/refresh/.test(url);

    // ─────────────────────────────────────────────
    // 401 — Try refresh-token flow
    // ─────────────────────────────────────────────
    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !isRefreshEndpoint &&
      !originalConfig._retry
    ) {
      originalConfig._retry = true;
      const refreshToken = localStorage.getItem('agrimax_refresh_token');

      if (refreshToken) {
        // If a refresh is already in progress, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: (newToken) => {
                // Respect abort state at resolution time
                if (originalConfig.signal?.aborted) {
                  return reject(normalizeError(error));
                }
                if (typeof originalConfig.headers?.set === 'function') {
                  originalConfig.headers.set('Authorization', `Bearer ${newToken}`);
                } else {
                  originalConfig.headers = {
                    ...originalConfig.headers,
                    Authorization: `Bearer ${newToken}`,
                  };
                }
                resolve(api(originalConfig));
              },
              reject,
            });
          });
        }

        isRefreshing = true;
        try {
          const refreshRes = await refreshClient.post('/auth/refresh', {
            refreshToken,
          });
          const newToken = refreshRes.data?.data?.accessToken;
          const newRefreshToken = refreshRes.data?.data?.refreshToken;

          if (!newToken) throw new Error('No access token in refresh response');

          localStorage.setItem('agrimax_token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('agrimax_refresh_token', newRefreshToken);
          }

          processRefreshQueue(null, newToken);
          isRefreshing = false;

          // Retry original request with new token
          if (typeof originalConfig.headers?.set === 'function') {
            originalConfig.headers.set('Authorization', `Bearer ${newToken}`);
          } else {
            originalConfig.headers = {
              ...originalConfig.headers,
              Authorization: `Bearer ${newToken}`,
            };
          }
          return api(originalConfig);
        } catch (refreshError) {
          const normalized = normalizeError(refreshError);
          processRefreshQueue(normalized, null);
          isRefreshing = false;
          clearAuthSession();
          return Promise.reject(normalized);
        }
      }

      // No refresh token — hard logout
      clearAuthSession();
      return Promise.reject(normalizeError(error));
    }

    // ─────────────────────────────────────────────
    // Retry idempotent (GET/HEAD) on network/5xx errors
    // ─────────────────────────────────────────────
    const method = (originalConfig.method || 'get').toLowerCase();
    const isIdempotent = method === 'get' || method === 'head';
    const isNetworkOrServerError = !error.response || error.response.status >= 500;
    const retryCount = originalConfig._retryCount || 0;

    if (
      isIdempotent &&
      isNetworkOrServerError &&
      retryCount < MAX_RETRIES &&
      !originalConfig.signal?.aborted &&
      error.code !== 'ERR_CANCELED'
    ) {
      originalConfig._retryCount = retryCount + 1;

      if (IS_DEV) {
        console.log(
          `%c↻ Retry ${retryCount + 1}/${MAX_RETRIES} %c${originalConfig.url}`,
          'color: #f59e0b; font-weight: bold',
          'color: #64748b'
        );
      }

      // Exponential backoff: 800ms, 1600ms
      await new Promise((r) => setTimeout(r, RETRY_DELAY * (retryCount + 1)));

      // ✅ CRITICAL FIX: Re-check abort AFTER the backoff delay
      // User may have navigated away during the wait
      if (originalConfig.signal?.aborted) {
        return Promise.reject(normalizeError(error));
      }

      return api(originalConfig);
    }

    return Promise.reject(normalizeError(error));
  }
);

// ══════════════════════════════════════════════════════
// API Surface — all methods accept optional `config`
// ══════════════════════════════════════════════════════

export const authApi = {
  sendOtp: (phone, config = {}) => api.post('/auth/send-otp', { phone }, config),
  verifyOtp: (phone, otp, config = {}) =>
    api.post('/auth/verify-otp', { phone, otp }, config),
  refresh: (refreshToken, config = {}) =>
    refreshClient.post('/auth/refresh', { refreshToken }, config),
  logout: (config = {}) => api.post('/auth/logout', {}, config),
  getProfile: (config = {}) => api.get('/auth/profile', config),
  updateProfile: (data, config = {}) => api.patch('/auth/profile', data, config),
};

export const voiceApi = {
  sendCommand: (transcript, sessionId, config = {}) =>
    api.post('/voice/command', { transcript, sessionId }, config),

  // ✅ Content-Type deliberately omitted — browser sets multipart boundary
  sendAudio: (formData, config = {}) =>
    api.post('/voice/audio', formData, {
      ...config,
      meta: { longTimeout: true, ...(config.meta || {}) },
    }),
};

export const catalogApi = {
  listCrops: (config = {}) => api.get('/crops/public/list', config),
  getCropPrice: (cropId, config = {}) =>
    api.get(`/crops/public/${cropId}/price`, config),
  getCropDetails: (cropId, config = {}) =>
    api.get(`/crops/public/${cropId}`, config),
};

export const marketplaceApi = {
  getActivePosts: (config = {}) => api.get('/marketplace/posts', config),
  getMyPosts: (config = {}) => api.get('/marketplace/my-posts', config),
  getPost: (id, config = {}) => api.get(`/marketplace/posts/${id}`, config),
  createPost: (data, config = {}) => api.post('/marketplace/posts', data, config),
  updatePost: (id, data, config = {}) =>
    api.patch(`/marketplace/posts/${id}`, data, config),
  deletePost: (id, config = {}) => api.delete(`/marketplace/posts/${id}`, config),
};

export const walletApi = {
  getBalance: (config = {}) => api.get('/wallet/balance', config),
  getTransactions: (config = {}) => api.get('/wallet/transactions', config),
  requestWithdrawal: (data, config = {}) =>
    api.post('/wallet/withdraw', data, config),
};

export const notificationsApi = {
  list: (config = {}) => api.get('/notifications', config),
  markRead: (id, config = {}) =>
    api.patch(`/notifications/${id}/read`, {}, config),
  markAllRead: (config = {}) =>
    api.patch('/notifications/read-all', {}, config),
  delete: (id, config = {}) => api.delete(`/notifications/${id}`, config),
};

export const aiApi = {
  getDailyTip: (config = {}) => api.get('/ai/tip', config),
  getCacheStats: (config = {}) => api.get('/ai/cache/stats', config),
};

export default api;