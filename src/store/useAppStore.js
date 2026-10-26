import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ══════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════
const STORAGE_KEYS = {
  TOKEN: 'agrimax_token',
  REFRESH_TOKEN: 'agrimax_refresh_token',
  USER: 'agrimax_user',
  LANG: 'agrimax_lang',
  SESSION_ID: 'agrimax_session_id',
  CHAT_HISTORY: 'agrimax_chat_history',
};

const VALID_LANGS = ['ur', 'en'];
const IS_DEV = import.meta.env.DEV;

// ══════════════════════════════════════════════════════
// Safe localStorage wrapper
// (Private browsing, quota, SSR — never crashes)
// ══════════════════════════════════════════════════════
const safeStorage = {
  get(key, fallback = null) {
    if (typeof window === 'undefined') return fallback;
    try {
      const val = localStorage.getItem(key);
      return val === null ? fallback : val;
    } catch {
      return fallback;
    }
  },
  getJSON(key, fallback = null) {
    if (typeof window === 'undefined') return fallback;
    try {
      const val = localStorage.getItem(key);
      return val === null ? fallback : JSON.parse(val);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (IS_DEV) console.warn(`[useAppStore] Failed to save ${key}:`, e?.message);
      return false;
    }
  },
  remove(key) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

// ══════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════
const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return `session_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
};

const getOrCreateSessionId = () => {
  const existing = safeStorage.get(STORAGE_KEYS.SESSION_ID);
  if (existing && typeof existing === 'string' && existing.length > 10) {
    return existing;
  }
  const newId = generateSessionId();
  safeStorage.set(STORAGE_KEYS.SESSION_ID, newId);
  return newId;
};

const applyDirToDocument = (lang) => {
  if (typeof document === 'undefined') return;
  try {
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  } catch {}
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'ur';

  // Priority 1: URL param
  try {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (VALID_LANGS.includes(urlLang)) {
      applyDirToDocument(urlLang);
      return urlLang;
    }
  } catch {}

  // Priority 2: localStorage
  const saved = safeStorage.get(STORAGE_KEYS.LANG);
  const lang = VALID_LANGS.includes(saved) ? saved : 'ur';
  applyDirToDocument(lang);
  return lang;
};

// ✅ Factory — timestamps fresh every call (fixes frozen INITIAL_CHAT bug)
const createInitialChat = () => {
  const now = Date.now();
  return [
    {
      id: 'welcome-1',
      sender: 'assistant',
      messageUr:
        'اسلام علیکم! میں ایگری میکس ہوں۔ فصلوں کی قیمت، پوچھیں، فصلیں بیچیں، یا لاگ ان کریں۔',
      messageEn:
        'Assalam-o-Alaikum! I am AgriMax. Ask for crop prices, sell crops, or login.',
      intent: 'GREETING',
      timestamp: now - 60000,
    },
    {
      id: 'user-demo-1',
      sender: 'user',
      text: 'What is the price of rice today?',
      timestamp: now - 45000,
    },
    {
      id: 'assistant-demo-1',
      sender: 'assistant',
      messageEn: 'Here is the latest rice price from Lahore Mandi:',
      messageUr: 'لاہور منڈی سے چاول کی تازہ ترین قیمت یہ ہے:',
      intent: 'GET_CROP_PRICE',
      timestamp: now - 30000,
      result: {
        cropName: 'Rice',
        marketName: 'Lahore Mandi',
        currentPrice: '3,850.00',
        avgPrice: '3,850.00',
        minPrice: '3,500.00',
        maxPrice: '4,200.00',
        source: 'Lahore Mandi (Live Market Data)',
      },
    },
  ];
};

const parseUserSafely = () => {
  const parsed = safeStorage.getJSON(STORAGE_KEYS.USER);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed;
};

// ══════════════════════════════════════════════════════
// Store
// ══════════════════════════════════════════════════════
export const useAppStore = create(
  devtools(
    (set, get) => ({
      // ─────────────────────────────────
      // Language
      // ─────────────────────────────────
      language: getInitialLanguage(),
      setLanguage: (lang) => {
        if (!VALID_LANGS.includes(lang)) {
          if (IS_DEV) console.warn(`[useAppStore] Invalid language: ${lang}`);
          return;
        }
        if (get().language === lang) return;
        safeStorage.set(STORAGE_KEYS.LANG, lang);
        applyDirToDocument(lang);
        set({ language: lang });
      },

      // ─────────────────────────────────
      // Session ID
      // ─────────────────────────────────
      sessionId: getOrCreateSessionId(),
      resetSessionId: () => {
        const newId = generateSessionId();
        safeStorage.set(STORAGE_KEYS.SESSION_ID, newId);
        set({ sessionId: newId, awaitingOtp: false, pendingPhone: '' });

        // Notify useChatStore to clear its multi-turn state too
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('agrimax:session-reset', {
                detail: { sessionId: newId },
              })
            );
          } catch {}
        }

        return newId;
      },

      // ─────────────────────────────────
      // Authentication
      // ─────────────────────────────────
      token: safeStorage.get(STORAGE_KEYS.TOKEN),
      refreshToken: safeStorage.get(STORAGE_KEYS.REFRESH_TOKEN),
      user: parseUserSafely(),
      isAuthenticated: !!safeStorage.get(STORAGE_KEYS.TOKEN),

      // ✅ Hydration flags (for ProtectedRoute flash prevention)
      isLoading: false,
      hydrated: true,

      login: (user, token, refreshToken) => {
        if (!token || typeof token !== 'string') {
          if (IS_DEV) console.warn('[useAppStore] login() called without valid token');
          return;
        }

        safeStorage.set(STORAGE_KEYS.TOKEN, token);
        if (refreshToken) safeStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        if (user) {
          try {
            safeStorage.set(STORAGE_KEYS.USER, JSON.stringify(user));
          } catch {}
        }

        set({
          user: user || null,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          awaitingOtp: false,
          pendingPhone: '',
          isLoading: false,
        });
      },

      logout: () => {
        safeStorage.remove(STORAGE_KEYS.TOKEN);
        safeStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        safeStorage.remove(STORAGE_KEYS.USER);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          awaitingOtp: false,
          pendingPhone: '',
        });
      },

      // ✅ NEW — ProfilePage ke liye zaroori
      updateUser: (updates) => {
        if (!updates || typeof updates !== 'object') return;
        const current = get().user;
        if (!current) {
          if (IS_DEV) console.warn('[useAppStore] updateUser() called with no user');
          return;
        }
        const merged = { ...current, ...updates };
        try {
          safeStorage.set(STORAGE_KEYS.USER, JSON.stringify(merged));
        } catch {}
        set({ user: merged });
      },

      setLoading: (isLoading) => set({ isLoading: Boolean(isLoading) }),

      // ─────────────────────────────────
      // User Helpers
      // ─────────────────────────────────
      getUserInitials: () => {
        const user = get().user;
        if (!user?.name || typeof user.name !== 'string') return '👨‍🌾';
        const initials = user.name
          .trim()
          .split(/\s+/)
          .map((n) => n[0] || '')
          .join('')
          .toUpperCase()
          .slice(0, 2);
        return initials || '👨‍🌾';
      },
      hasRole: (role) => get().user?.role === role,
      isAdmin: () => get().user?.role === 'ADMIN',
      isFarmer: () => {
        const role = get().user?.role;
        return role === 'FARMER' || !role;
      },

      // ─────────────────────────────────
      // ⚠️ DEPRECATED — should live in useChatStore only
      // Kept for backward compatibility. New code MUST use useChatStore.
      // ─────────────────────────────────
      awaitingOtp: false,
      pendingPhone: '',
      setAwaitingOtp: (awaitingOtp, pendingPhone = '') =>
        set({
          awaitingOtp: Boolean(awaitingOtp),
          pendingPhone: pendingPhone || '',
        }),

      isRecording: false,
      isListening: false,
      recordingDuration: 0,
      isProcessing: false,
      isSpeaking: false,
      transcript: '',
      error: null,
      permissionStatus: 'unknown',

      setRecording: (isRecording) =>
        set({ isRecording, isListening: isRecording }),
      setListening: (isListening) =>
        set({ isListening, isRecording: isListening }),
      setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
      setProcessing: (isProcessing) => set({ isProcessing }),
      setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
      setTranscript: (transcript) => set({ transcript }),
      setError: (error) =>
        set({
          error,
          isRecording: false,
          isListening: false,
          isProcessing: false,
          recordingDuration: 0,
        }),
      setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
      resetVoiceState: () =>
        set({
          isRecording: false,
          isListening: false,
          recordingDuration: 0,
          isProcessing: false,
          isSpeaking: false,
          transcript: '',
          error: null,
        }),

      // ⚠️ DEPRECATED — use useChatStore.messages instead
      chatHistory:
        safeStorage.getJSON(STORAGE_KEYS.CHAT_HISTORY) || createInitialChat(),

      addChatMessage: (message) => {
        if (!message || typeof message !== 'object') return null;
        const entry = {
          id:
            message.id ||
            `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          ...message,
        };
        const updated = [...get().chatHistory, entry].slice(-50);
        try {
          safeStorage.set(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(updated));
        } catch {}
        set({ chatHistory: updated });
        return entry;
      },

      clearChatHistory: () => {
        safeStorage.remove(STORAGE_KEYS.CHAT_HISTORY);
        set({ chatHistory: createInitialChat() });
      },

      // ─────────────────────────────────
      // Developer / Debug
      // ─────────────────────────────────
      __resetAll: () => {
        // ⚠️ DANGEROUS — wipes all auth/chat/voice state
        Object.values(STORAGE_KEYS).forEach((key) => safeStorage.remove(key));
        set({
          language: 'ur',
          sessionId: generateSessionId(),
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          awaitingOtp: false,
          pendingPhone: '',
          isRecording: false,
          isListening: false,
          recordingDuration: 0,
          isProcessing: false,
          isSpeaking: false,
          transcript: '',
          error: null,
          permissionStatus: 'unknown',
          chatHistory: createInitialChat(),
        });
      },
    }),
    {
      name: 'AgriMaxStore',
      enabled: IS_DEV,
    }
  )
);

// ══════════════════════════════════════════════════════
// Global event listeners
// (registered once, after store creation)
// ══════════════════════════════════════════════════════
if (typeof window !== 'undefined' && !window.__agrimax_store_listeners_registered__) {
  window.__agrimax_store_listeners_registered__ = true;

  // ✅ api.js dispatches this when refresh token fails
  window.addEventListener('agrimax:session-expired', () => {
    const state = useAppStore.getState();
    if (state.isAuthenticated) {
      if (IS_DEV) {
        console.warn('[useAppStore] Session expired — logging out');
      }
      state.logout();
    }
  });
}

export default useAppStore;