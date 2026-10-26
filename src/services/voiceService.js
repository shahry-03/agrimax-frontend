import { voiceApi } from './api';

// ══════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════
const MAX_AUDIO_SIZE_MB = 10;
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
const MAX_TEXT_LENGTH = 1000;
const VALID_LANGUAGE_HINTS = new Set(['ur', 'en']);

// ══════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function generateRequestId() {
  return `vr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Detect abort errors from BOTH axios (CanceledError) and native (AbortError)
 */
function isAbortError(error) {
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||  // Axios v1.x
    error?.name === 'AbortError'        // Fetch / signal.throwIfAborted
  );
}

/**
 * Determine audio file extension with proper fallbacks
 * Order matters: check specific codecs BEFORE generic containers
 */
function getAudioExtension(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') return 'webm';
  const m = mimeType.toLowerCase();
  if (m.includes('wav')) return 'wav';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mp3') || m.includes('mpeg')) return 'mp3';
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'm4a';
  return 'webm';
}

function sanitizeLanguageHint(hint) {
  if (!hint || typeof hint !== 'string') return undefined;
  const cleaned = hint.trim().toLowerCase();
  return VALID_LANGUAGE_HINTS.has(cleaned) ? cleaned : undefined;
}

/**
 * Canonical failure response — used by all validation & abort paths
 */
function failureResult({ error, messageEn, messageUr, isAborted = false }) {
  return {
    success: false,
    messageEn,
    messageUr,
    data: null,
    intent: null,
    confidence: null,
    detectedLanguage: null,
    transcript: '',
    error,
    isAborted,
  };
}

const ABORTED_RESULT = {
  success: false,
  messageEn: 'Request cancelled.',
  messageUr: 'درخواست منسوخ ہو گئی۔',
  data: null,
  intent: null,
  confidence: null,
  detectedLanguage: null,
  transcript: '',
  error: 'ABORTED',
  isAborted: true,
};

/**
 * Normalize a successful/parsed backend response
 */
function normalizeResponse(resData) {
  if (!resData || typeof resData !== 'object') {
    return failureResult({
      error: 'INVALID_RESPONSE_SHAPE',
      messageEn: 'Invalid server response. Please try again.',
      messageUr: 'سرور سے غلط جواب ملا۔ دوبارہ کوشش کریں۔',
    });
  }

  const data =
    resData.data && typeof resData.data === 'object' ? resData.data : null;

  // Transcript: prefer nested, then top-level, then empty
  const transcript =
    (typeof data?.transcript === 'string' && data.transcript) ||
    (typeof resData.transcript === 'string' && resData.transcript) ||
    '';

  return {
    success: resData.success !== false,
    messageEn: typeof resData.messageEn === 'string' ? resData.messageEn : '',
    messageUr: typeof resData.messageUr === 'string' ? resData.messageUr : '',
    data,
    intent: data?.intent || resData.intent || null,
    confidence: data?.confidence ?? resData.confidence ?? null,
    detectedLanguage: data?.detectedLanguage || resData.detectedLanguage || null,
    transcript,
    error: null,
    isAborted: false,
  };
}

/**
 * Normalize a thrown error (from axios or validation)
 */
function normalizeError(error) {
  const friendly = error?.friendlyMessage || {
    en: 'Could not process the voice command. Please try again.',
    ur: 'کمانڈ پر عمل نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
  };

  return {
    success: false,
    messageEn: friendly.en,
    messageUr: friendly.ur,
    data: null,
    intent: null,
    confidence: null,
    detectedLanguage: null,
    transcript: '',
    error: error?.code || error?.message || 'UNKNOWN_ERROR',
    errorCode: error?.code || null,
    status: error?.status || null,
    isAborted: false,
  };
}

// ══════════════════════════════════════════════════════
// Service
// ══════════════════════════════════════════════════════

export const voiceService = {
  /**
   * Send recorded audio to POST /api/v1/voice/audio
   *
   * ⚠️ NO AUTO-RETRY: Voice commands may create side effects
   * (marketplace posts, wallet transactions). Retrying on
   * network failure would duplicate these actions.
   *
   * Future: If backend adds Idempotency-Key support, safe retry
   * becomes possible. Until then, failures are surfaced to user
   * who can manually retry.
   */
  async sendAudioCommand({
    audioBlob,
    sessionId,
    languageHint,
    signal,
    onProgress,
  } = {}) {
    // ── Early abort check (avoid work if already cancelled) ──
    if (signal?.aborted) return ABORTED_RESULT;

    // ── Validation ──
    if (!audioBlob || !(audioBlob instanceof Blob) || audioBlob.size === 0) {
      return failureResult({
        error: 'EMPTY_AUDIO',
        messageEn: 'No audio was recorded. Please tap the mic and speak again.',
        messageUr: 'کوئی آواز ریکارڈ نہیں ہوئی۔ براہ کرم دوبارہ بولیں۔',
      });
    }

    if (audioBlob.size > MAX_AUDIO_SIZE_BYTES) {
      return failureResult({
        error: 'AUDIO_TOO_LARGE',
        messageEn: `Audio is too large (max ${MAX_AUDIO_SIZE_MB}MB). Please record a shorter message.`,
        messageUr: `آواز بہت بڑی ہے (زیادہ سے زیادہ ${MAX_AUDIO_SIZE_MB}MB)۔ چھوٹا پیغام ریکارڈ کریں۔`,
      });
    }

    if (!sessionId) {
      return failureResult({
        error: 'MISSING_SESSION',
        messageEn: 'Session ID is missing. Please refresh the page.',
        messageUr: 'سیشن ID غائب ہے۔ صفحہ تازہ کریں۔',
      });
    }

    if (isOffline()) {
      return failureResult({
        error: 'OFFLINE',
        messageEn:
          'You appear to be offline. Please check your internet connection.',
        messageUr: 'آپ آف لائن ہیں۔ اپنا انٹرنیٹ کنکشن چیک کریں۔',
      });
    }

    const requestId = generateRequestId();
    const cleanLangHint = sanitizeLanguageHint(languageHint);
    const extension = getAudioExtension(audioBlob.type);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `voice_command.${extension}`);
      formData.append('sessionId', sessionId);
      if (cleanLangHint) formData.append('languageHint', cleanLangHint);

      // ⚠️ Single call — NO RETRY (non-idempotent POST)
      const response = await voiceApi.sendAudio(formData, {
        signal,
        onUploadProgress: onProgress
          ? (evt) => {
              // ✅ Safe: callback errors won't break the upload
              try {
                if (evt.total) {
                  onProgress(Math.round((evt.loaded * 100) / evt.total));
                }
              } catch (e) {
                if (import.meta.env.DEV) {
                  console.warn('[voiceService] onProgress threw:', e);
                }
              }
            }
          : undefined,
      });

      return { ...normalizeResponse(response.data), requestId };
    } catch (error) {
      if (isAbortError(error)) return ABORTED_RESULT;

      if (import.meta.env.DEV) {
        console.warn(`[voiceService:${requestId}] Audio upload failed:`, error);
      }
      return { ...normalizeError(error), requestId };
    }
  },

  /**
   * Send text command to POST /api/v1/voice/command
   *
   * ⚠️ NO AUTO-RETRY: Same reason as audio — side effects possible.
   */
  async sendTextCommand(params, maybeSessionId, maybeSignal) {
    let transcript, sessionId, signal;

    if (typeof params === 'string') {
      transcript = params;
      sessionId = maybeSessionId;
      signal = maybeSignal;
    } else if (params && typeof params === 'object') {
      transcript = params.transcript;
      sessionId = params.sessionId;
      signal = params.signal;
    }

    // ── Early abort check ──
    if (signal?.aborted) return ABORTED_RESULT;

    // ── Validation ──
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return failureResult({
        error: 'EMPTY_TRANSCRIPT',
        messageEn: 'Please speak or type a command.',
        messageUr: 'براہ کرم کچھ بولیں یا لکھیں۔',
      });
    }

    const cleanTranscript = transcript.trim().slice(0, MAX_TEXT_LENGTH);

    if (!sessionId) {
      return failureResult({
        error: 'MISSING_SESSION',
        messageEn: 'Session ID is missing. Please refresh the page.',
        messageUr: 'سیشن ID غائب ہے۔ صفحہ تازہ کریں۔',
      });
    }

    if (isOffline()) {
      return failureResult({
        error: 'OFFLINE',
        messageEn:
          'You appear to be offline. Please check your internet connection.',
        messageUr: 'آپ آف لائن ہیں۔ اپنا انٹرنیٹ کنکشن چیک کریں۔',
      });
    }

    const requestId = generateRequestId();

    try {
      // ⚠️ Single call — NO RETRY (non-idempotent POST)
      const response = await voiceApi.sendCommand(cleanTranscript, sessionId, {
        signal,
      });

      const normalized = normalizeResponse(response.data);
      return {
        ...normalized,
        requestId,
        transcript: normalized.transcript || cleanTranscript,
      };
    } catch (error) {
      if (isAbortError(error)) return ABORTED_RESULT;

      if (import.meta.env.DEV) {
        console.warn(`[voiceService:${requestId}] Text command failed:`, error);
      }
      return { ...normalizeError(error), requestId };
    }
  },

  /**
   * Backwards-compatible alias (uses explicit reference, NOT `this`)
   */
  async sendCommand(transcript, sessionId, signal) {
    return voiceService.sendTextCommand({ transcript, sessionId, signal });
  },

  // ══════════════════════════════════════════════════════
  // Diagnostics
  // ══════════════════════════════════════════════════════

  getConfig() {
    return {
      maxAudioSizeMB: MAX_AUDIO_SIZE_MB,
      maxTextLength: MAX_TEXT_LENGTH,
      validLanguages: [...VALID_LANGUAGE_HINTS],
      isOffline: isOffline(),
      retryPolicy: 'disabled', // POST is non-idempotent
    };
  },
};

export default voiceService;