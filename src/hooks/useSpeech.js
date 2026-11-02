import { useCallback, useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * useSpeech — Advanced Text-to-Speech hook utilizing native browser SpeechSynthesis.
 * Features:
 * - Smart Chunking: Splits long text to prevent browser truncation (15s limit).
 * - High-Quality Voice Prioritization (Google/Microsoft Natural Voices).
 * - Safe state management & autoplay policy handling.
 * - Seamless integration with Zustand app store.
 */
export function useSpeech() {
  const { isSpeaking, setIsSpeaking, language } = useAppStore();
  const voicesRef = useRef([]);
  const queueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      // Sort voices to prioritize high-quality/natural ones
      const allVoices = window.speechSynthesis.getVoices() || [];
      voicesRef.current = allVoices.sort((a, b) => {
        const isNaturalA = a.name.includes('Natural') || a.name.includes('Google') ? 1 : 0;
        const isNaturalB = b.name.includes('Natural') || b.name.includes('Google') ? 1 : 0;
        return isNaturalB - isNaturalA;
      });
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Helper: Splits text into safe chunks to avoid browser 15s truncation.
   */
  const chunkText = (text, maxLength = 200) => {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    sentences.forEach((sentence) => {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ` ${sentence}`;
      }
    });
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  };

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || queueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    while (queueRef.current.length > 0) {
      const { text, lang, voice } = queueRef.current.shift();
      
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Perfect speed for farmers
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = lang;
        if (voice) utterance.voice = voice;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('SpeechSynthesis chunk error:', e.error);
          }
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    }

    isProcessingQueueRef.current = false;
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  const currentAudioRef = useRef(null);

  /**
   * Plays base64 audio returned by server TTS.
   */
  const playAudioBase64 = useCallback(
    (base64, format = 'audio/mp3') => {
      if (!base64 || typeof window === 'undefined') return false;

      // Cancel any ongoing speech synthesis or audio playback
      cancel();

      try {
        const audioSrc = `data:${format || 'audio/mp3'};base64,${base64}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;

        setIsSpeaking(true);

        audio.onended = () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };

        audio.onerror = (e) => {
          console.warn('[useSpeech] Server audio playback failed, falling back:', e);
          setIsSpeaking(false);
          currentAudioRef.current = null;
        };

        audio.play().catch((err) => {
          console.warn('[useSpeech] Autoplay blocked or playback error:', err);
          setIsSpeaking(false);
          currentAudioRef.current = null;
        });

        return true;
      } catch (err) {
        console.warn('[useSpeech] playAudioBase64 error:', err);
        setIsSpeaking(false);
        return false;
      }
    },
    [setIsSpeaking]
  );

  /**
   * Speaks given text in specified language ('ur' or 'en').
   */
  const speak = useCallback(
    (text, targetLang = null) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;

      const activeLang = targetLang || language || 'ur';

      // Cancel any existing speech and clear queue
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch {}
      }
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingQueueRef.current = false;

      // Clean text
      const cleanText = text.replace(/[*_#`~]/g, '').replace(/https?:\/\/\S+/g, '').trim();
      if (!cleanText) return;

      const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      let selectedVoice = null;
      let utteranceLang = 'en-US';

      if (activeLang === 'ur') {
        utteranceLang = 'ur-PK';
        selectedVoice = voices.find(v => v.lang === 'ur-PK' || v.lang.startsWith('ur')) || 
                        voices.find(v => v.lang.startsWith('hi')) || // Fallback to Hindi if Urdu missing
                        voices.find(v => v.lang.startsWith('en'));
      } else {
        selectedVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') || voices[0];
      }

      // Chunk the text and queue it
      const chunks = chunkText(cleanText);
      chunks.forEach(chunk => {
        queueRef.current.push({ text: chunk, lang: utteranceLang, voice: selectedVoice });
      });

      // Start processing
      processQueue();
    },
    [language, processQueue]
  );

  const cancel = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingQueueRef.current = false;
    }
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  return {
    speak,
    playAudioBase64,
    cancel,
    isSpeaking,
    isSupported: typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined'),
  };
}

export default useSpeech;