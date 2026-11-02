/**
 * Voice WebSocket Client for continuous streaming audio interaction.
 * Connects to /ws/voice/stream on AgriMax backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');
const WS_STREAM_URL = `${WS_BASE_URL}/ws/voice/stream`;

export class VoiceWebSocketClient {
  constructor({ onStateChange, onResponse, onError, onSessionEnd } = {}) {
    this.url = WS_STREAM_URL;
    this.ws = null;
    this.state = 'DISCONNECTED'; // DISCONNECTED | CONNECTING | CONNECTED | ENDED
    this.onStateChange = onStateChange || (() => {});
    this.onResponse = onResponse || (() => {});
    this.onError = onError || (() => {});
    this.onSessionEnd = onSessionEnd || (() => {});
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          this.state = 'CONNECTED';
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[VoiceWS] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[VoiceWS] WebSocket error:', err);
          this.onError(err);
          reject(err);
        };

        this.ws.onclose = () => {
          this.state = 'DISCONNECTED';
          this.onStateChange('DISCONNECTED');
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'state':
        this.onStateChange(msg.state);
        break;
      case 'response':
        this.onResponse(msg);
        break;
      case 'error':
        this.onError(msg);
        break;
      case 'session_ended':
        this.onSessionEnd(msg);
        this.disconnect();
        break;
      default:
        break;
    }
  }

  startSession({ sessionId, languageHint = 'ur', token = null } = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'start',
        sessionId,
        languageHint,
        token: token || localStorage.getItem('agrimax_token') || null,
      })
    );
  }

  sendAudioChunk(arrayBufferOrUint8Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(arrayBufferOrUint8Array);
  }

  finishUtterance(mimeType = 'audio/webm') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'audio_end',
        mimeType,
      })
    );
  }

  notifyPlaybackDone() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'playback_done' }));
  }

  interrupt() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'interrupt' }));
  }

  stopListening() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'stop' }));
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.state = 'DISCONNECTED';
  }
}

export default VoiceWebSocketClient;
