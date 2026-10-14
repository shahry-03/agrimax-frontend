import { create } from 'zustand';

/**
 * Helper to generate or load persistent browser sessionId (UUID)
 */
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('agrimax_session_id');
  if (!sessionId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    }
    localStorage.setItem('agrimax_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Initial bilingual welcome conversation in chat history
 */
const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    messageUr: 'اسلام علیکم! میں ایگری میکس ہوں۔ فصلوں کی قیمت پوچھیں، فصلیں بیچیں، یا کسی صفحے پر جانے کے لیے بولیں (جیسے "مارکیٹ کھولو")۔',
    messageEn: 'Assalam-o-Alaikum! I am AgriMax. Ask for crop prices, sell crops, or speak to navigate (e.g. "open market").',
    intent: 'GREETING',
    confidence: 1.0,
    timestamp: Date.now() - 60000,
  },
];

/**
 * useChatStore — Global Zustand store managing persistent conversation state,
 * voice recording lifecycle, language preference, and AI panel visibility.
 */
export const useChatStore = create((set, get) => ({
  // ── Session & Language ──
  sessionId: getOrCreateSessionId(),
  language: localStorage.getItem('agrimax_lang') || 'ur', // 'ur' | 'en'

  setLanguage: (lang) => {
    localStorage.setItem('agrimax_lang', lang);
    set({ language: lang });
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  },

  resetSessionId: () => {
    let newId;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newId = crypto.randomUUID();
    } else {
      newId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    }
    localStorage.setItem('agrimax_session_id', newId);
    set({ sessionId: newId, awaitingOtp: false, pendingPhone: '' });
    return newId;
  },

  // ── Conversation Messages ──
  messages: (() => {
    try {
      const saved = localStorage.getItem('agrimax_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MESSAGES;
  })(),

  addMessage: (message) => {
    const entry = {
      id: message.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      ...message,
    };
    const updated = [...get().messages, entry].slice(-50); // Keep last 50 turns
    try {
      localStorage.setItem('agrimax_chat_history', JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }
    set({ messages: updated });
    return entry;
  },

  clearChat: () => {
    localStorage.removeItem('agrimax_chat_history');
    set({ messages: INITIAL_MESSAGES });
  },

  // ── Persistent Panel UI Visibility ──
  // On desktop: expanded/collapsed right panel. On mobile: bottom sheet drawer.
  isOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  // ── Voice Recording & Processing State ──
  isRecording: false,
  recordingDuration: 0,
  isProcessing: false,
  isSpeaking: false,
  error: null,

  setRecording: (isRecording) => set({ isRecording }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setError: (error) =>
    set({
      error,
      isRecording: false,
      isProcessing: false,
      recordingDuration: 0,
    }),

  resetVoiceState: () =>
    set({
      isRecording: false,
      recordingDuration: 0,
      isProcessing: false,
      isSpeaking: false,
      error: null,
    }),

  // ── Multi-turn Authentication Flow State ──
  awaitingOtp: false,
  pendingPhone: '',
  setAwaitingOtp: (awaitingOtp, pendingPhone = '') =>
    set({ awaitingOtp, pendingPhone }),
}));

export default useChatStore;
