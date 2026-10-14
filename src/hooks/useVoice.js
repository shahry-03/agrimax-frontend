import { useCallback, useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useChatStore from '../store/useChatStore';
import useAppStore from '../store/useAppStore';
import voiceService from '../services/voiceService';
import useSpeech from './useSpeech';
import useVoiceAction from './useVoiceAction';

/**
 * Detect best supported audio MIME type for MediaRecorder.
 */
function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return '';
  }
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

/**
 * useVoice — Core voice interaction hook powered by browser MediaRecorder,
 * backend Whisper STT, Gemini Intent Detection, and speech synthesis TTS.
 */
export function useVoice() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const resolveStopPromiseRef = useRef(null);

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
  } = useChatStore();

  const { login } = useAppStore();
  const { speak, cancel: cancelSpeech } = useSpeech();
  const { executeAction } = useVoiceAction();

  // Check MediaRecorder & getUserMedia browser support
  const [isSupported] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
    );
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  /**
   * Request / verify microphone permission
   */
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
      console.warn('Microphone permission error:', err);
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

  /**
   * Stop MediaRecorder and return a Promise resolving to recorded audio Blob.
   */
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
      if (!recorder || recorder.state === 'inactive') {
        const mimeType = getSupportedMimeType() || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        resolve(blob);
        return;
      }

      resolveStopPromiseRef.current = resolve;

      try {
        recorder.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
        const mimeType = getSupportedMimeType() || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        resolve(blob);
      }

      // Stop audio tracks to release microphone hardware
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    });
  }, [setRecording]);

  /**
   * Process recorded audio blob with backend Whisper STT (POST /api/v1/voice/audio)
   */
  const processAudio = useCallback(
    async (blob, preferredLangHint = null) => {
      if (!blob || blob.size === 0) return null;

      cancelSpeech();
      setProcessing(true);
      setError(null);

      const hint =
        preferredLangHint || (language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined);

      try {
        const response = await voiceService.sendAudioCommand({
          audioBlob: blob,
          sessionId,
          languageHint: hint,
        });

        const data = response.data;
        const transcriptText = data?.transcript || '';

        // Add user chat message with Whisper transcript
        if (transcriptText.trim()) {
          addMessage({
            sender: 'user',
            text: transcriptText.trim(),
          });
        } else {
          addMessage({
            sender: 'user',
            text: language === 'ur' ? '🎤 صوتی پیغام' : '🎤 Voice Command',
          });
        }

        // Add assistant response to persistent chat store
        const intent = data?.intent || 'UNKNOWN';
        const result = data?.result || null;
        const confidence = data?.confidence || null;
        const detectedLanguage = data?.detectedLanguage || null;

        addMessage({
          sender: 'assistant',
          messageEn: response.messageEn,
          messageUr: response.messageUr,
          intent,
          confidence,
          detectedLanguage,
          result,
          data,
          success: response.success,
        });

        // Speak the response via SpeechSynthesis TTS
        const speechText =
          language === 'ur'
            ? response.messageUr || response.messageEn
            : response.messageEn || response.messageUr;
        if (speechText) {
          try {
            speak(speechText, language);
          } catch {
            // SpeechSynthesis failure shouldn't crash app
          }
        }

        // Multi-turn State Handling:
        // Turn 1: LOGIN intent -> Backend sends OTP, asks for OTP
        if (intent === 'LOGIN' && response.success) {
          const phone = data?.parameters?.phone || '';
          setAwaitingOtp(true, phone);
        }

        // Turn 2: VERIFY_OTP intent -> Backend returns JWT token in result
        if (intent === 'VERIFY_OTP' && response.success && result?.accessToken) {
          localStorage.setItem('agrimax_token', result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem('agrimax_refresh_token', result.refreshToken);
          }
          const userObj = {
            id: result.userId,
            name: result.name || 'Farmer',
            phone: pendingPhone || '',
          };
          login(userObj, result.accessToken, result.refreshToken);
          setAwaitingOtp(false, '');
          toast.success(
            language === 'ur' ? 'لاگ ان کامیاب ہو گیا!' : 'Logged in successfully!',
            { icon: '🌾' }
          );
        }

        // Execute website control / navigation action if returned
        executeAction(result, intent);

        return response;
      } catch (err) {
        console.error('Audio processing error:', err);
        const errMsg = {
          en: 'Failed to process voice command. Please try again.',
          ur: 'کمانڈ پر عمل نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
        };
        setError(errMsg);
      } finally {
        setProcessing(false);
      }
    },
    [
      addMessage,
      cancelSpeech,
      executeAction,
      language,
      login,
      pendingPhone,
      sessionId,
      setAwaitingOtp,
      setError,
      setProcessing,
      speak,
    ]
  );

  /**
   * Stop recording and immediately process audio
   */
  const stopAndProcessAudio = useCallback(
    async (preferredLangHint = null) => {
      const blob = await stopRecording();
      if (blob && blob.size > 0) {
        return await processAudio(blob, preferredLangHint);
      }
      return null;
    },
    [stopRecording, processAudio]
  );

  /**
   * Start MediaRecorder audio recording.
   */
  const startRecording = useCallback(async () => {
    cancelSpeech();
    setError(null);

    const hasMic = await requestMicPermission();
    if (!hasMic || !streamRef.current) return false;

    audioChunksRef.current = [];
    setRecordingDuration(0);

    const mimeType = getSupportedMimeType();
    const options = {
      audioBitsPerSecond: 16000,
    };
    if (mimeType) {
      options.mimeType = mimeType;
    }

    try {
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

        if (resolveStopPromiseRef.current) {
          resolveStopPromiseRef.current(blob);
          resolveStopPromiseRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.warn('MediaRecorder error:', event.error);
        setError({
          en: 'Recording error occurred. Please try again.',
          ur: 'ریکارڈنگ میں خرابی پیش آئی۔ دوبارہ کوشش کریں۔',
        });
        stopRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect in 250ms chunks
      setRecording(true);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsedSeconds);
      }, 1000);

      // Auto-stop after 30 seconds max duration
      autoStopTimerRef.current = setTimeout(async () => {
        console.info('Auto-stopping recording at max 30s limit');
        await stopAndProcessAudio();
      }, 30000);

      return true;
    } catch (err) {
      console.warn('Failed to start MediaRecorder:', err);
      setError({
        en: 'Could not start audio recorder. Please try typing your command.',
        ur: 'آڈیو ریکارڈر شروع نہیں ہو سکا۔ برائے مہربانی لکھ کر کمانڈ دیں۔',
      });
      setRecording(false);
      return false;
    }
  }, [
    cancelSpeech,
    requestMicPermission,
    setError,
    setRecording,
    setRecordingDuration,
    stopRecording,
    stopAndProcessAudio,
  ]);

  /**
   * Cancel recording without returning audio
   */
  const cancelRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    resolveStopPromiseRef.current = null;
    setRecording(false);
    setRecordingDuration(0);
  }, [setRecording, setRecordingDuration]);

  /**
   * Process a text command (fallback for typing)
   */
  const processCommand = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;

      const trimmedText = text.trim();
      cancelSpeech();
      setProcessing(true);
      setError(null);

      // Add user message to persistent chat
      addMessage({
        sender: 'user',
        text: trimmedText,
      });

      try {
        const response = await voiceService.sendTextCommand({
          transcript: trimmedText,
          sessionId,
        });

        const data = response.data;
        const intent = data?.intent || 'UNKNOWN';
        const result = data?.result || null;
        const confidence = data?.confidence || null;

        addMessage({
          sender: 'assistant',
          messageEn: response.messageEn,
          messageUr: response.messageUr,
          intent,
          confidence,
          result,
          data,
          success: response.success,
        });

        const speechText =
          language === 'ur'
            ? response.messageUr || response.messageEn
            : response.messageEn || response.messageUr;
        if (speechText) {
          try {
            speak(speechText, language);
          } catch {
            // ignore TTS error
          }
        }

        // Multi-turn State Handling
        if (intent === 'LOGIN' && response.success) {
          const phone = data?.parameters?.phone || '';
          setAwaitingOtp(true, phone);
        }

        if (intent === 'VERIFY_OTP' && response.success && result?.accessToken) {
          localStorage.setItem('agrimax_token', result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem('agrimax_refresh_token', result.refreshToken);
          }
          const userObj = {
            id: result.userId,
            name: result.name || 'Farmer',
            phone: pendingPhone || '',
          };
          login(userObj, result.accessToken, result.refreshToken);
          setAwaitingOtp(false, '');
          toast.success(
            language === 'ur' ? 'لاگ ان کامیاب ہو گیا!' : 'Logged in successfully!',
            { icon: '🌾' }
          );
        }

        // Execute website control / navigation action
        executeAction(result, intent);

        return response;
      } catch (err) {
        console.error('Text command processing error:', err);
        const errMsg = {
          en: 'Failed to process command. Please try again.',
          ur: 'کمانڈ پر عمل نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
        };
        setError(errMsg);
      } finally {
        setProcessing(false);
      }
    },
    [
      addMessage,
      cancelSpeech,
      executeAction,
      language,
      login,
      pendingPhone,
      sessionId,
      setAwaitingOtp,
      setError,
      setProcessing,
      speak,
    ]
  );

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
    // Backwards compatibility aliases
    isListening: isRecording,
    startListening: startRecording,
    stopListening: stopAndProcessAudio,
  };
}

export default useVoice;
