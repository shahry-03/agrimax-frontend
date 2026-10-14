import { voiceApi } from './api';

/**
 * voiceService — Handles sending audio recordings (Whisper STT) and text commands
 * to the AgriMax Spring Boot backend, standardizing responses, and handling errors gracefully.
 */
export const voiceService = {
  /**
   * Sends audio blob (Whisper STT) to POST /api/v1/voice/audio via multipart/form-data.
   *
   * @param {Object} params
   * @param {Blob} params.audioBlob Recorded audio blob from MediaRecorder
   * @param {string} params.sessionId Unique browser session ID for conversation memory
   * @param {string} [params.languageHint] Optional language hint ("ur" or "en")
   * @returns {Promise<{success: boolean, messageEn: string, messageUr: string, data?: any, error?: string}>}
   */
  async sendAudioCommand({ audioBlob, sessionId, languageHint }) {
    if (!audioBlob || audioBlob.size === 0) {
      return {
        success: false,
        messageEn: 'No audio was recorded. Please tap the mic and speak again.',
        messageUr: 'کوئی آواز ریکارڈ نہیں ہوئی۔ براہ کرم دوبارہ بولیں۔',
        data: null,
      };
    }

    try {
      const formData = new FormData();
      // Determine filename extension based on blob mimeType
      const extension = audioBlob.type.includes('wav')
        ? 'wav'
        : audioBlob.type.includes('mp4')
        ? 'm4a'
        : 'webm';
      formData.append('audio', audioBlob, `voice_command.${extension}`);

      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      if (languageHint && languageHint.trim()) {
        formData.append('languageHint', languageHint.trim());
      }

      const response = await voiceApi.sendAudio(formData);
      const resData = response.data;

      return {
        success: resData.success !== false,
        messageEn: resData.messageEn || '',
        messageUr: resData.messageUr || '',
        data: resData.data || null,
      };
    } catch (error) {
      console.warn('Audio command upload error:', error);

      const friendly = error.friendlyMessage || {
        en: 'Could not process audio command. Please check server or internet.',
        ur: 'آواز پر عمل نہیں ہو سکا۔ برائے مہربانی انٹرنیٹ یا سرور چیک کریں۔',
      };

      return {
        success: false,
        messageEn: friendly.en,
        messageUr: friendly.ur,
        data: null,
        error: error.message,
      };
    }
  },

  /**
   * Sends text command transcript to POST /api/v1/voice/command (text fallback).
   *
   * @param {Object|string} params Either { transcript, sessionId } or transcript string
   * @param {string} [maybeSessionId] Session ID if first param is string
   * @returns {Promise<{success: boolean, messageEn: string, messageUr: string, data?: any, error?: string}>}
   */
  async sendTextCommand(params, maybeSessionId) {
    let transcript;
    let sessionId;

    if (typeof params === 'string') {
      transcript = params;
      sessionId = maybeSessionId;
    } else if (params && typeof params === 'object') {
      transcript = params.transcript;
      sessionId = params.sessionId;
    }

    if (!transcript || !transcript.trim()) {
      return {
        success: false,
        messageEn: 'Please speak or enter a command.',
        messageUr: 'براہ کرم کچھ بولیں یا لکھیں۔',
        data: null,
      };
    }

    try {
      const response = await voiceApi.sendCommand(transcript.trim(), sessionId);
      const resData = response.data;

      return {
        success: resData.success !== false,
        messageEn: resData.messageEn || '',
        messageUr: resData.messageUr || '',
        data: resData.data || null,
      };
    } catch (error) {
      console.warn('Voice command error:', error);

      const friendly = error.friendlyMessage || {
        en: 'Could not process command. Please check server connection.',
        ur: 'کمانڈ پر عمل نہیں ہو سکا۔ سرور کنکشن چیک کریں۔',
      };

      return {
        success: false,
        messageEn: friendly.en,
        messageUr: friendly.ur,
        data: null,
        error: error.message,
      };
    }
  },

  /**
   * Alias for sendTextCommand for backwards compatibility.
   */
  async sendCommand(transcript, sessionId) {
    return this.sendTextCommand({ transcript, sessionId });
  },
};

export default voiceService;
