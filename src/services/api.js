import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── JWT Interceptor — auto-attach Bearer token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrimax_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — friendly error handling & 401 handling ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/voice/');
      if (!isAuthEndpoint) {
        localStorage.removeItem('agrimax_token');
        localStorage.removeItem('agrimax_refresh_token');
        localStorage.removeItem('agrimax_user');
      }
    }

    if (!error.response) {
      error.friendlyMessage = {
        en: 'Cannot connect to AgriMax server. Please check your internet or backend status.',
        ur: 'ایگری میکس سرور سے رابطہ نہیں ہو سکا۔ برائے مہربانی انٹرنیٹ یا سرور چیک کریں۔',
      };
    } else {
      const data = error.response.data;
      error.friendlyMessage = {
        en: data?.messageEn || data?.error || 'An unexpected error occurred.',
        ur: data?.messageUr || 'کوئی غیر متوقع خرابی پیش آئی ہے۔',
      };
    }

    return Promise.reject(error);
  }
);

// ── Auth APIs ──
export const authApi = {
  sendOtp: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
};

export const voiceApi = {
  /**
   * POST /api/v1/voice/command
   * Body: { transcript, sessionId }
   */
  sendCommand: (transcript, sessionId) =>
    api.post('/voice/command', { transcript, sessionId }),

  /**
   * POST /api/v1/voice/audio
   * Body: FormData (audio: File, sessionId: string, languageHint?: string)
   */
  sendAudio: (formData) =>
    api.post('/voice/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// ── Catalog & Crop APIs ──
export const catalogApi = {
  listCrops: () => api.get('/crops/public/list'),
  getCropPrice: (cropId) => api.get(`/crops/public/${cropId}/price`),
};

// ── Marketplace APIs ──
export const marketplaceApi = {
  getActivePosts: () => api.get('/marketplace/posts'),
  getMyPosts: () => api.get('/marketplace/my-posts'),
};

// ── Wallet APIs ──
export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: () => api.get('/wallet/transactions'),
};

// ── AI APIs ──
export const aiApi = {
  getDailyTip: () => api.get('/ai/tip'),
  getCacheStats: () => api.get('/ai/cache/stats'),
};

export default api;
