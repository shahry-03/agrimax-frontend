import { useCallback, useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * useSpeech — Text-to-Speech hook utilizing native browser SpeechSynthesis.
 * 
 * Configured with:
 * - utterance.rate = 0.9 for clear and understandable farmer pacing
 * - Automatic search for 'ur-PK' or Urdu voice, falling back to English/default
 * - Seamless integration with Zustand app store (isSpeaking state)
 */
export function useSpeech() {
  const { isSpeaking, setIsSpeaking, language } = useAppStore();
  const voicesRef = useRef([]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices() || [];
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
   * Speaks given text in specified language ('ur' or 'en').
   */
  const speak = useCallback(
    (text, targetLang = null) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
        return;
      }

      const activeLang = targetLang || language || 'ur';

      // Cancel previous speech
      window.speechSynthesis.cancel();

      // Clean speech text (strip URLs, markdown artifacts if any)
      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Strict requirement: rate = 0.9 for farmer clarity
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = voicesRef.current.length > 0
        ? voicesRef.current
        : window.speechSynthesis.getVoices();

      if (activeLang === 'ur') {
        utterance.lang = 'ur-PK';
        // Look for ur-PK, ur, or Hindi/Arabic accents if Urdu is unavailable
        const urduVoice =
          voices.find((v) => v.lang === 'ur-PK' || v.lang.startsWith('ur')) ||
          voices.find((v) => v.lang.startsWith('hi')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (urduVoice) utterance.voice = urduVoice;
      } else {
        utterance.lang = 'en-US';
        const enVoice =
          voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en')) ||
          voices[0];
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        // SpeechSynthesis error like 'interrupted' is normal when canceled
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e.error);
        }
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [language, setIsSpeaking]
  );

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [setIsSpeaking]);

  return {
    speak,
    cancel,
    isSpeaking,
  };
}

export default useSpeech;
