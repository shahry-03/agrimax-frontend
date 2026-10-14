import { create } from 'zustand';

/**
 * Voice assistant state store.
 */
const useVoiceStore = create((set) => ({
  isListening: false,
  isProcessing: false,
  transcript: '',
  aiResponse: null,
  error: null,
  permissionStatus: 'unknown',  // 'unknown' | 'granted' | 'denied' | 'unsupported'
  language: 'ur',               // Current recognition language
  history: [],                  // Last 5 interactions
  responseAt: null,             // Timestamp when AI responded (for auto-dismiss)

  setListening: (isListening) => set({ isListening }),

  setTranscript: (transcript) => set({ transcript }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setAiResponse: (aiResponse) => set({
    aiResponse,
    isProcessing: false,
    responseAt: Date.now(),
  }),

  setError: (error) => set({
    error,
    isProcessing: false,
    isListening: false,
  }),

  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),

  setLanguage: (language) => set({ language }),

  /** Adds a completed interaction to history (max 5 entries). */
  addToHistory: (transcript, response) => set((state) => {
    const entry = {
      transcript,
      response,
      timestamp: Date.now(),
    };
    const history = [entry, ...state.history].slice(0, 5);
    return { history };
  }),

  /** Clears the overlay — keeps history. */
  dismiss: () => set({
    isListening: false,
    transcript: '',
    aiResponse: null,
    isProcessing: false,
    error: null,
    responseAt: null,
  }),

  /** Full reset including history. */
  reset: () => set({
    isListening: false,
    transcript: '',
    aiResponse: null,
    isProcessing: false,
    error: null,
    responseAt: null,
  }),
}));

export default useVoiceStore;
