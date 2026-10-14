import { create } from 'zustand';

// Helper to generate or load a persistent browser sessionId (UUID)
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

// Initial welcome conversation in chat history matching reference screenshot
const INITIAL_CHAT = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    messageUr: 'اسلام علیکم! میں ایگری میکس ہوں۔ فصلوں کی قیمت، پوچھیں، فصلیں بیچیں، یا لاگ ان کریں۔',
    messageEn: 'Assalam-o-Alaikum! I am AgriMax. Ask for crop prices, sell crops, or login.',
    intent: 'GREETING',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'user-demo-1',
    sender: 'user',
    text: 'What is the price of rice today?',
    timestamp: Date.now() - 45000,
  },
  {
    id: 'assistant-demo-1',
    sender: 'assistant',
    messageEn: 'Here is the latest rice price from Lahore Mandi:',
    messageUr: 'لاہور منڈی سے چاول کی تازہ ترین قیمت یہ ہے:',
    intent: 'GET_CROP_PRICE',
    timestamp: Date.now() - 30000,
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

export const useAppStore = create((set, get) => ({
  // ── Language ──
  language: localStorage.getItem('agrimax_lang') || 'ur', // 'ur' | 'en'
  setLanguage: (lang) => {
    localStorage.setItem('agrimax_lang', lang);
    set({ language: lang });
    // Update document dir and lang attributes
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  },

  // ── Session ID ──
  sessionId: getOrCreateSessionId(),
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

  // ── Authentication ──
  token: localStorage.getItem('agrimax_token') || null,
  user: JSON.parse(localStorage.getItem('agrimax_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('agrimax_token'),

  login: (user, token, refreshToken) => {
    localStorage.setItem('agrimax_token', token);
    if (refreshToken) {
      localStorage.setItem('agrimax_refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('agrimax_user', JSON.stringify(user));
    }
    set({
      user,
      token,
      isAuthenticated: true,
      awaitingOtp: false,
      pendingPhone: '',
    });
  },

  logout: () => {
    localStorage.removeItem('agrimax_token');
    localStorage.removeItem('agrimax_refresh_token');
    localStorage.removeItem('agrimax_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      awaitingOtp: false,
      pendingPhone: '',
    });
  },

  // ── Multi-turn State (e.g. Login Turn 1 -> Turn 2 OTP) ──
  awaitingOtp: false,
  pendingPhone: '',
  setAwaitingOtp: (awaitingOtp, pendingPhone = '') =>
    set({ awaitingOtp, pendingPhone }),

  // ── Voice Interaction UI States (Whisper MediaRecorder) ──
  isRecording: false,
  isListening: false, // alias for backwards compatibility
  recordingDuration: 0, // seconds elapsed while recording
  isProcessing: false,
  isSpeaking: false,
  transcript: '',
  error: null,
  permissionStatus: 'unknown', // 'unknown' | 'granted' | 'denied' | 'unsupported'

  setRecording: (isRecording) => set({ isRecording, isListening: isRecording }),
  setListening: (isListening) => set({ isListening, isRecording: isListening }),
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

  // ── Chat History ──
  chatHistory: JSON.parse(localStorage.getItem('agrimax_chat_history') || 'null') || INITIAL_CHAT,

  addChatMessage: (message) => {
    const entry = {
      id: message.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      ...message,
    };
    const updated = [...get().chatHistory, entry].slice(-50); // Keep last 50 turns
    try {
      localStorage.setItem('agrimax_chat_history', JSON.stringify(updated));
    } catch {
      // Ignore localStorage quotas
    }
    set({ chatHistory: updated });
    return entry;
  },

  clearChatHistory: () => {
    localStorage.removeItem('agrimax_chat_history');
    set({ chatHistory: INITIAL_CHAT });
  },
}));

export default useAppStore;
