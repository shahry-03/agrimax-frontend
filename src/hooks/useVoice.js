import { useCallback, useRef, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import useChatStore from '../store/useChatStore';
import useAppStore from '../store/useAppStore';
import voiceService from '../services/voiceService';
import useSpeech from './useSpeech';
import useVoiceAction from './useVoiceAction';

// --- Constants ---
const MAX_RECORDING_DURATION_MS = 30000;
const AUDIO_BITRATE = 64000; // ✅ Improved from 16000 for better STT accuracy
const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/aac',
];

function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  for (const type of AUDIO_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function useVoice() {
  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const resolveStopPromiseRef = useRef(null);
  
  // ✅ NEW: Race condition guards
  const isStartingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Shallow Store Selector
  const {
    language,
    sessionId,
    isRecording,
    recordingDuration,
    isProcessing,
    awaitingOtp,
    pendingPhone,
    setRecording,
    setRecordingDuration,
    setProcessing,
    setError,
    setAwaitingOtp,
    addMessage,
  } = useChatStore(
    useShallow((state) => ({
      language: state.language,
      sessionId: state.sessionId,
      isRecording: state.isRecording,
      recordingDuration: state.recordingDuration,
      isProcessing: state.isProcessing,
      awaitingOtp: state.awaitingOtp,
      pendingPhone: state.pendingPhone,
      setRecording: state.setRecording,
      setRecordingDuration: state.setRecordingDuration,
      setProcessing: state.setProcessing,
      setError: state.setError,
      setAwaitingOtp: state.setAwaitingOtp,
      addMessage: state.addMessage,
    }))
  );

  const { login } = useAppStore();
  const { speak, cancel: cancelSpeech } = useSpeech();
  const { executeAction } = useVoiceAction();

  const [isSupported] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
    );
  });

  // ✅ NEW: Warn user on tab close during recording
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const releaseMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const requestMicPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError({
        en: 'Microphone recording is not supported in this browser.',
        ur: 'یہ براؤزر مائیکروفون ریکارڈنگ کو سپورٹ نہیں کرتا۔',
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      return true;
    } catch (err) {
      console.warn('[useVoice] Mic permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          en: 'Microphone permission denied. Please allow in browser settings.',
          ur: 'مائیکروفون کی اجازت نہیں ملی۔ براؤزر سیٹنگز میں اجازت دیں۔',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({
          en: 'No microphone found. Please connect a microphone.',
          ur: 'کوئی مائیکروفون نہیں ملا۔ برائے مہربانی مائیکروفون منسلک کریں۔',
        });
      } else {
        setError({
          en: `Microphone error: ${err.message || 'Could not access audio'}`,
          ur: 'مائیکروفون دستیاب نہیں ہے۔',
        });
      }
      return false;
    }
  }, [setError]);

  const handleVoiceResponse = useCallback(async (response) => {
    const data = response?.data;
    const transcriptText = data?.transcript || '';
    const intent = data?.intent || 'UNKNOWN';
    const result = data?.result || null;
    const confidence = data?.confidence || null;
    const detectedLanguage = data?.detectedLanguage || null;

    if (response?.isAudioCommand) {
      addMessage({
        sender: 'user',
        text: transcriptText.trim() || (language === 'ur' ? '🎤 صوتی پیغام' : '🎤 Voice Command'),
      });
    }

    addMessage({
      sender: 'assistant',
      messageEn: response?.messageEn,
      messageUr: response?.messageUr,
      intent,
      confidence,
      detectedLanguage,
      result,
      data,
      success: response?.success,
    });

    const speechText = language === 'ur'
      ? response?.messageUr || response?.messageEn
      : response?.messageEn || response?.messageUr;

    if (speechText) {
      try { speak(speechText, language); } catch { /* ignore TTS error */ }
    }

    if (intent === 'LOGIN' && response?.success) {
      setAwaitingOtp(true, data?.parameters?.phone || '');
    }

    if (intent === 'VERIFY_OTP' && response?.success && result?.accessToken) {
      localStorage.setItem('agrimax_token', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('agrimax_refresh_token', result.refreshToken);
      }
      login(
        { id: result.userId, name: result.name || 'Farmer', phone: pendingPhone || '' },
        result.accessToken,
        result.refreshToken
      );
      setAwaitingOtp(false, '');
      toast.success(
        language === 'ur' ? 'لاگ ان کامیاب ہو گیا!' : 'Logged in successfully!',
        { icon: '🌾' }
      );
    }

    executeAction(result, intent);
    return response;
  }, [addMessage, executeAction, language, login, pendingPhone, setAwaitingOtp, speak]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }

      setRecording(false);

      const recorder = mediaRecorderRef.current;
      const mimeType = getSupportedMimeType() || 'audio/webm';

      if (!recorder || recorder.state === 'inactive') {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        releaseMicrophone();
        resolve(blob);
        return;
      }

      resolveStopPromiseRef.current = resolve;

      try {
        recorder.stop();
      } catch (err) {
        console.warn('[useVoice] Error stopping recorder:', err);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        releaseMicrophone();
        resolve(blob);
      }
    });
  }, [setRecording, releaseMicrophone]);

  const processAudio = useCallback(async (blob, preferredLangHint = null) => {
    if (!blob || blob.size === 0) return null;

    cancelSpeech();
    setProcessing(true);
    setError(null);

    // ✅ NEW: Fresh AbortController for this request
    abortControllerRef.current = new AbortController();

    const hint = preferredLangHint || (language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined);

    try {
      const response = await voiceService.sendAudioCommand({
        audioBlob: blob,
        sessionId,
        languageHint: hint,
        signal: abortControllerRef.current.signal, // ✅ Pass signal
      });

      if (response) response.isAudioCommand = true;
      return await handleVoiceResponse(response);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.info('[useVoice] Request aborted by user');
        return null;
      }
      console.error('[useVoice] Audio processing error:', err);
      setError({
        en: 'Failed to process voice command. Please try again.',
        ur: 'کمانڈ پر عمل نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
      });
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  }, [cancelSpeech, handleVoiceResponse, language, sessionId, setError, setProcessing]);

  const stopAndProcessAudio = useCallback(async (preferredLangHint = null) => {
    const blob = await stopRecording();
    if (blob && blob.size > 0) {
      return await processAudio(blob, preferredLangHint);
    }
    return null;
  }, [stopRecording, processAudio]);

  const startRecording = useCallback(async () => {
    // ✅ NEW: Race condition guard - prevent double-click starting 2 recorders
    if (isStartingRef.current || isRecording) {
      console.warn('[useVoice] Recording already in progress');
      return false;
    }
    isStartingRef.current = true;

    try {
      cancelSpeech();
      setError(null);

      const hasMic = await requestMicPermission();
      if (!hasMic || !streamRef.current) return false;

      audioChunksRef.current = [];
      setRecordingDuration(0);

      const mimeType = getSupportedMimeType();
      const options = { audioBitsPerSecond: AUDIO_BITRATE }; // ✅ Improved bitrate
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(streamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        audioChunksRef.current = [];
        releaseMicrophone();

        if (resolveStopPromiseRef.current) {
          resolveStopPromiseRef.current(blob);
          resolveStopPromiseRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.warn('[useVoice] MediaRecorder runtime error:', event.error);
        setError({
          en: 'Recording error occurred. Please try again.',
          ur: 'ریکارڈنگ میں خرابی پیش آئی۔ دوبارہ کوشش کریں۔',
        });
        stopRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      autoStopTimerRef.current = setTimeout(async () => {
        await stopAndProcessAudio();
      }, MAX_RECORDING_DURATION_MS);

      return true;
    } catch (err) {
      console.warn('[useVoice] Failed to start MediaRecorder:', err);
      setError({
        en: 'Could not start audio recorder. Please try typing your command.',
        ur: 'آڈیو ریکارڈر شروع نہیں ہو سکا۔ برائے مہربانی لکھ کر کمانڈ دیں۔',
      });
      setRecording(false);
      releaseMicrophone();
      return false;
    } finally {
      isStartingRef.current = false; // ✅ Always reset
    }
  }, [cancelSpeech, requestMicPermission, setError, setRecording, setRecordingDuration, stopRecording, stopAndProcessAudio, releaseMicrophone, isRecording]);

  const cancelRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

    // ✅ NEW: Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }

    releaseMicrophone();
    audioChunksRef.current = [];
    resolveStopPromiseRef.current = null;
    setRecording(false);
    setRecordingDuration(0);
  }, [setRecording, setRecordingDuration, releaseMicrophone]);

  const processCommand = useCallback(async (text) => {
    if (!text?.trim()) return;

    const trimmedText = text.trim();
    cancelSpeech();
    setProcessing(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    addMessage({ sender: 'user', text: trimmedText });

    try {
      const response = await voiceService.sendTextCommand({
        transcript: trimmedText,
        sessionId,
        signal: abortControllerRef.current.signal,
      });
      return await handleVoiceResponse(response);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.info('[useVoice] Text command aborted');
        return null;
      }
      console.error('[useVoice] Text command processing error:', err);
      setError({
        en: 'Failed to process command. Please try again.',
        ur: 'کمانڈ پر عمل نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
      });
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  }, [addMessage, cancelSpeech, handleVoiceResponse, sessionId, setError, setProcessing]);

  return {
    isSupported,
    isRecording,
    recordingDuration,
    isProcessing,
    awaitingOtp,
    pendingPhone,
    startRecording,
    stopRecording,
    stopAndProcessAudio,
    cancelRecording,
    processAudio,
    processCommand,
    isListening: isRecording,
    startListening: startRecording,
    stopListening: stopAndProcessAudio,
  };
}

export default useVoice;