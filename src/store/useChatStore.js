import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ══════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════
const STORAGE_KEYS = {
  SESSION_ID: 'agrimax_session_id',
  LANGUAGE: 'agrimax_lang',
  MESSAGES: 'agrimax_chat_history',
  MESSAGES_VERSION: 'agrimax_chat_version',
  PANEL_OPEN: 'agrimax_panel_open',
};

const CHAT_SCHEMA_VERSION = 2;
const MAX_MESSAGES = 50;
const IS_DEV = import.meta.env.DEV;

// ══════════════════════════════════════════════════════
// Safe localStorage — SSR / incognito / quota safe
// ══════════════════════════════════════════════════════
const safeStorage = {
  get(key, fallback = null) {
    if (typeof window === 'undefined') return fallback;
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  getJSON(key, fallback = null) {
    if (typeof window === 'undefined') return fallback;
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (IS_DEV) console.warn(`[useChatStore] Storage set failed for ${key}:`, e?.message);
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

const getInitialLanguage = () => {
  const saved = safeStorage.get(STORAGE_KEYS.LANGUAGE);
  return saved === 'en' || saved === 'ur' ? saved : 'ur';
};

const applyDocumentLanguage = (lang) => {
  if (typeof document === 'undefined') return;
  try {
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  } catch {}
};

// ✅ Factory — fresh timestamps every call (not frozen at module load)
const createInitialMessages = () => {
  const now = Date.now();
  return [
    {
      id: 'welcome-1',
      sender: 'assistant',
      messageUr:
        'اسلام علیکم! میں ایگری میکس ہوں۔ فصلوں کی قیمت پوچھیں، فصلیں بیچیں، یا کسی صفحے پر جانے کے لیے بولیں (جیسے "مارکیٹ کھولو")۔',
      messageEn:
        'Assalam-o-Alaikum! I am AgriMax. Ask for crop prices, sell crops, or speak to navigate (e.g. "open market").',
      intent: 'GREETING',
      confidence: 1.0,
      timestamp: now,
    },
  ];
};

/**
 * ✅ Normalize a message:
 * - Validates sender is 'user' | 'assistant'
 * - Generates ID if missing
 * - Clamps future timestamps to `now` (handles client clock skew)
 * - Preserves bilingual text fields if valid strings
 */
const normalizeMessage = (msg, fallbackId = null) => {
  if (!msg || typeof msg !== 'object') return null;

  const sender =
    msg.sender === 'user' || msg.sender === 'assistant' ? msg.sender : 'assistant';

  const id =
    typeof msg.id === 'string' && msg.id.length > 0
      ? msg.id
      : fallbackId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // ✅ Clamp future timestamps — prevents "in 5 minutes" from clock-skewed servers
  const now = Date.now();
  const timestamp =
    typeof msg.timestamp === 'number' && msg.timestamp > 0
      ? Math.min(msg.timestamp, now)
      : now;

  return {
    ...msg,
    id,
    sender,
    timestamp,
    text: typeof msg.text === 'string' ? msg.text : undefined,
    messageEn: typeof msg.messageEn === 'string' ? msg.messageEn : undefined,
    messageUr: typeof msg.messageUr === 'string' ? msg.messageUr : undefined,
  };
};

/**
 * ✅ Load messages from storage with:
 * - Schema validation (drops invalid entries)
 * - Deduplication by ID
 * - Legacy migration support
 * - Fallback to welcome message on any failure
 */
const loadMessages = () => {
  const savedVersion = Number(safeStorage.get(STORAGE_KEYS.MESSAGES_VERSION, '0'));
  const saved = safeStorage.getJSON(STORAGE_KEYS.MESSAGES);

  if (!Array.isArray(saved) || saved.length === 0) {
    return createInitialMessages();
  }

  const seen = new Set();
  const normalized = [];
  saved.forEach((raw, idx) => {
    const msg = normalizeMessage(raw, `legacy_${idx}`);
    if (!msg) return;
    if (seen.has(msg.id)) return; // dedupe
    seen.add(msg.id);
    normalized.push(msg);
  });

  if (normalized.length === 0) return createInitialMessages();

  if (IS_DEV && savedVersion < CHAT_SCHEMA_VERSION) {
    console.info(
      `[useChatStore] Migrated chat schema v${savedVersion} → v${CHAT_SCHEMA_VERSION}`
    );
  }

  return normalized.slice(-MAX_MESSAGES);
};

// ✅ Debounced persistence — coalesces rapid addMessage/updateMessage calls
let saveTimer = null;
const scheduleSave = (messages) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      safeStorage.set(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      safeStorage.set(STORAGE_KEYS.MESSAGES_VERSION, String(CHAT_SCHEMA_VERSION));
    } catch {}
    saveTimer = null;
  }, 100);
};

// ✅ Cancel pending save — used by clearChat and __resetAll
const cancelPendingSave = () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
};

// ══════════════════════════════════════════════════════
// Store
// ══════════════════════════════════════════════════════
export const useChatStore = create(
  devtools(
    (set, get) => ({
      // ─────────────────────────────────
      // Session & Language
      // ─────────────────────────────────
      sessionId: getOrCreateSessionId(),
      language: getInitialLanguage(),

      setLanguage: (lang) => {
        if (lang !== 'ur' && lang !== 'en') return;
        if (get().language === lang) return;
        safeStorage.set(STORAGE_KEYS.LANGUAGE, lang);
        set({ language: lang });
        applyDocumentLanguage(lang);

        // Broadcast so useAppStore and other listeners can sync
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('agrimax:language-changed', {
                detail: { language: lang },
              })
            );
          } catch {}
        }
      },

      resetSessionId: () => {
        const newId = generateSessionId();
        safeStorage.set(STORAGE_KEYS.SESSION_ID, newId);
        set({ sessionId: newId, awaitingOtp: false, pendingPhone: '' });

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
      // Conversation Messages
      // ─────────────────────────────────
      messages: loadMessages(),

      /**
       * Add a message. If ID already exists, merges into existing
       * (preserves original id/sender — patch cannot override).
       * Returns the ACTUAL stored entry (not a stale copy).
       */
      addMessage: (message) => {
        const entry = normalizeMessage(message);
        if (!entry) return null;

        const current = get().messages;
        const existingIdx = current.findIndex((m) => m.id === entry.id);
        let updated;
        let finalEntry;

        if (existingIdx !== -1) {
          // ✅ Merge — but preserve immutable fields (id, sender)
          finalEntry = {
            ...current[existingIdx],
            ...entry,
            id: current[existingIdx].id,
            sender: current[existingIdx].sender,
          };
          updated = [...current];
          updated[existingIdx] = finalEntry;

          if (IS_DEV) {
            console.warn(`[useChatStore] Replacing duplicate message: ${entry.id}`);
          }
        } else {
          finalEntry = entry;
          updated = [...current, entry];
        }

        updated = updated.slice(-MAX_MESSAGES);
        set({ messages: updated });
        scheduleSave(updated);
        return finalEntry; // ✅ Returns what's actually stored
      },

      /**
       * Update an existing message by ID.
       * ✅ id and sender are immutable — patch cannot override them.
       * ✅ timestamp is clamped to prevent future-dating.
       */
      updateMessage: (id, patch) => {
        if (!id || !patch || typeof patch !== 'object') return;
        const current = get().messages;
        const idx = current.findIndex((m) => m.id === id);
        if (idx === -1) return;

        const existing = current[idx];
        const merged = {
          ...existing,
          ...patch,
          // ✅ Lock immutable fields
          id: existing.id,
          sender: existing.sender,
          // ✅ Clamp timestamp if patch provides one
          timestamp:
            typeof patch.timestamp === 'number' && patch.timestamp > 0
              ? Math.min(patch.timestamp, Date.now())
              : existing.timestamp,
        };

        const updated = [...current];
        updated[idx] = merged;
        set({ messages: updated });
        scheduleSave(updated);
      },

      /**
       * Delete a single message by ID.
       */
      deleteMessage: (id) => {
        if (!id) return;
        const current = get().messages;
        const updated = current.filter((m) => m.id !== id);
        if (updated.length === current.length) return; // no change
        set({ messages: updated });
        scheduleSave(updated);
      },

      /**
       * Clear chat — resets messages, OTP flow, and pending saves.
       * ✅ Cancels debounced save first to prevent old state rewrite.
       * ✅ Writes fresh state synchronously (no debounce).
       */
      clearChat: () => {
        // Cancel pending debounce — prevents old messages reappearing
        cancelPendingSave();

        safeStorage.remove(STORAGE_KEYS.MESSAGES);
        safeStorage.remove(STORAGE_KEYS.MESSAGES_VERSION);

        const fresh = createInitialMessages();
        set({
          messages: fresh,
          awaitingOtp: false,
          pendingPhone: '',
        });

        // Immediate synchronous write (no debounce)
        safeStorage.set(STORAGE_KEYS.MESSAGES, JSON.stringify(fresh));
        safeStorage.set(STORAGE_KEYS.MESSAGES_VERSION, String(CHAT_SCHEMA_VERSION));
      },

      // ─────────────────────────────────
      // Panel Visibility
      // ─────────────────────────────────
      isOpen: (() => {
        if (typeof window === 'undefined') return true;
        const saved = safeStorage.get(STORAGE_KEYS.PANEL_OPEN);
        if (saved === 'true') return true;
        if (saved === 'false') return false;
        return window.innerWidth >= 1024;
      })(),

      setOpen: (isOpen) => {
        const val = Boolean(isOpen);
        set({ isOpen: val });
        safeStorage.set(STORAGE_KEYS.PANEL_OPEN, String(val));
      },

      toggleOpen: () => {
        const next = !get().isOpen;
        set({ isOpen: next });
        safeStorage.set(STORAGE_KEYS.PANEL_OPEN, String(next));
      },

      // ─────────────────────────────────
      // Voice State
      // ─────────────────────────────────
      isRecording: false,
      recordingDuration: 0,
      isProcessing: false,
      isSpeaking: false,
      error: null,
      typing: false,

      setRecording: (isRecording) => {
        const val = Boolean(isRecording);
        set({
          isRecording: val,
          // Starting a new recording clears stale errors + resets timer
          ...(val ? { error: null, recordingDuration: 0 } : {}),
        });
      },

      setRecordingDuration: (recordingDuration) => {
        const num = Number(recordingDuration);
        set({ recordingDuration: Number.isFinite(num) && num >= 0 ? num : 0 });
      },

      setProcessing: (isProcessing) => set({ isProcessing: Boolean(isProcessing) }),
      setIsSpeaking: (isSpeaking) => set({ isSpeaking: Boolean(isSpeaking) }),
      setTyping: (typing) => set({ typing: Boolean(typing) }),

      setError: (error) => {
        set({
          error,
          isRecording: false,
          isProcessing: false,
          recordingDuration: 0,
          typing: false,
        });
      },

      clearError: () => {
        if (get().error !== null) set({ error: null });
      },

      resetVoiceState: () =>
        set({
          isRecording: false,
          recordingDuration: 0,
          isProcessing: false,
          isSpeaking: false,
          error: null,
          typing: false,
        }),

      // ─────────────────────────────────
      // Multi-turn Auth State
      // ─────────────────────────────────
      awaitingOtp: false,
      pendingPhone: '',

      setAwaitingOtp: (awaitingOtp, pendingPhone = '') =>
        set({
          awaitingOtp: Boolean(awaitingOtp),
          pendingPhone: typeof pendingPhone === 'string' ? pendingPhone : '',
        }),

      // ─────────────────────────────────
      // Debug
      // ─────────────────────────────────
      __resetAll: () => {
        cancelPendingSave();
        Object.values(STORAGE_KEYS).forEach((k) => safeStorage.remove(k));
        const fresh = createInitialMessages();
        set({
          sessionId: generateSessionId(),
          language: 'ur',
          messages: fresh,
          isOpen: true,
          isRecording: false,
          recordingDuration: 0,
          isProcessing: false,
          isSpeaking: false,
          error: null,
          typing: false,
          awaitingOtp: false,
          pendingPhone: '',
        });
        applyDocumentLanguage('ur');
        safeStorage.set(STORAGE_KEYS.MESSAGES, JSON.stringify(fresh));
        safeStorage.set(STORAGE_KEYS.MESSAGES_VERSION, String(CHAT_SCHEMA_VERSION));
      },
    }),
    { name: 'ChatStore', enabled: IS_DEV }
  )
);

// ══════════════════════════════════════════════════════
// Cross-store & Cross-tab Listeners
// (registered once — HMR-safe)
// ══════════════════════════════════════════════════════
if (
  typeof window !== 'undefined' &&
  !window.__agrimax_chat_listeners_registered__
) {
  window.__agrimax_chat_listeners_registered__ = true;

  // 1. Language change — sync state + DOM
  window.addEventListener('agrimax:language-changed', (e) => {
    const lang = e.detail?.language;
    if (!lang || (lang !== 'ur' && lang !== 'en')) return;
    if (useChatStore.getState().language !== lang) {
      useChatStore.setState({ language: lang });
    }
    applyDocumentLanguage(lang);
  });

  // 2. Session reset — clear multi-turn auth state
  window.addEventListener('agrimax:session-reset', () => {
    const state = useChatStore.getState();
    if (state.awaitingOtp || state.pendingPhone) {
      state.setAwaitingOtp(false, '');
    }
  });

  // 3. Session expired — hard reset voice + OTP
  window.addEventListener('agrimax:session-expired', () => {
    const state = useChatStore.getState();
    state.resetVoiceState();
    state.setAwaitingOtp(false, '');
  });

  // 4. Cross-tab sync (messages + language)
  // ✅ Handles both newValue AND null (removal — e.g. clearChat from another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.MESSAGES) {
      try {
        useChatStore.setState({ messages: loadMessages() });
      } catch (err) {
        if (IS_DEV) {
          console.warn('[useChatStore] Cross-tab sync failed:', err);
        }
      }
    } else if (e.key === STORAGE_KEYS.LANGUAGE) {
      const lang = e.newValue;
      if (lang === 'ur' || lang === 'en') {
        useChatStore.setState({ language: lang });
        applyDocumentLanguage(lang);
      }
    }
  });
}

export default useChatStore;