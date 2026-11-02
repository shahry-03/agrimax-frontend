import {
  HiMicrophone,
  HiStop,
  HiSpeakerWave,
  HiExclamationTriangle,
  HiXMark,
} from 'react-icons/hi2';
import { useShallow } from 'zustand/react/shallow';
import useChatStore from '../../store/useChatStore';
import useAppStore from '../../store/useAppStore';
import useVoice from '../../hooks/useVoice';
import useSpeech from '../../hooks/useSpeech';
import AIContextRenderer from '../AIContextRenderer';

/**
 * Animated Agricultural Robot Mascot (AgriBot)
 * Changes visual expression, antenna glow, and acoustic soundwaves
 * based on assistant state: 'idle' | 'listening' | 'processing' | 'speaking'
 */
function AgriBotMascot({ state = 'idle', duration = 0 }) {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';

  // Format recording seconds into M:SS
  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* ── Acoustic Pulse Rings (radiates during listening or speaking) ── */}
      {(isListening || isSpeaking) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 animate-ping opacity-25 ${
              isListening ? 'border-red-500' : 'border-[#16A34A]'
            }`}
          />
          <div
            className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 animate-pulse opacity-20 ${
              isListening ? 'border-red-400' : 'border-[#22C55E]'
            }`}
          />
        </div>
      )}

      {/* ── Robot Mascot SVG Avatar ── */}
      <div
        className={`relative z-10 transition-transform duration-300 ${
          isListening ? 'scale-105' : isSpeaking ? 'animate-bounce [animation-duration:2s]' : 'hover:scale-102'
        }`}
      >
        <svg
          className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-md"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Antenna Stem */}
          <path
            d="M80 34V20"
            stroke="#166534"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Antenna Sprout Leaves (AgriMax Brand Signature) */}
          <g
            className={`transition-all duration-300 ${
              isListening
                ? 'animate-pulse text-red-500'
                : isProcessing
                ? 'animate-spin origin-[80px_16px]'
                : isSpeaking
                ? 'animate-bounce'
                : ''
            }`}
          >
            {/* Primary Left Leaf */}
            <path
              d="M80 18C74 12 70 14 68 18C68 22 72 24 80 20Z"
              fill={isListening ? '#DC2626' : isSpeaking ? '#22C55E' : '#166534'}
            />
            {/* Secondary Right Leaf */}
            <path
              d="M80 18C86 11 92 12 94 17C94 21 89 23 80 20Z"
              fill={isListening ? '#EF4444' : isSpeaking ? '#4ADE80' : '#15803D'}
            />
            {/* Glowing Antenna Tip Beacon */}
            <circle
              cx="80"
              cy="18"
              r={isListening ? '5' : isSpeaking ? '4.5' : '3.5'}
              fill={isListening ? '#F87171' : isProcessing ? '#F59E0B' : '#86EFAC'}
              className={isListening ? 'animate-ping' : ''}
            />
          </g>

          {/* Robot Head Outer Shell (Creamy Off-white with crisp border) */}
          <rect
            x="30"
            y="34"
            width="100"
            height="86"
            rx="28"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="3"
          />

          {/* Head Shadow Underneath */}
          <ellipse cx="80" cy="115" rx="35" ry="4" fill="#E2E8F0" opacity="0.6" />

          {/* Side Ears / Audio Receivers */}
          <rect
            x="22"
            y="62"
            width="9"
            height="26"
            rx="4.5"
            fill={isListening ? '#DC2626' : isSpeaking ? '#166534' : '#64748B'}
            className={isListening ? 'animate-pulse' : ''}
          />
          <rect
            x="129"
            y="62"
            width="9"
            height="26"
            rx="4.5"
            fill={isListening ? '#DC2626' : isSpeaking ? '#166534' : '#64748B'}
            className={isListening ? 'animate-pulse' : ''}
          />

          {/* Digital Face Visor Screen (Deep Slate Screen with Emerald Tint) */}
          <rect
            x="40"
            y="46"
            width="80"
            height="62"
            rx="18"
            fill="#0F172A"
          />

          {/* Visor Glare / Reflection for depth */}
          <path
            d="M48 52C58 49 74 48 84 48C90 48 102 50 110 54"
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* ── Expressive Eyes ── */}
          {isProcessing ? (
            /* Thinking State: Orbital pulsing dots */
            <g className="animate-pulse">
              <circle cx="62" cy="72" r="5" fill="#F59E0B" />
              <circle cx="80" cy="72" r="5" fill="#FBBF24" />
              <circle cx="98" cy="72" r="5" fill="#F59E0B" />
            </g>
          ) : isListening ? (
            /* Listening State: Alert wide green/red concentric rings */
            <g>
              <circle cx="62" cy="72" r="8" fill="#166534" />
              <circle cx="62" cy="72" r="5" fill="#4ADE80" className="animate-ping" />
              <circle cx="62" cy="72" r="3" fill="#FFFFFF" />

              <circle cx="98" cy="72" r="8" fill="#166534" />
              <circle cx="98" cy="72" r="5" fill="#4ADE80" className="animate-ping" />
              <circle cx="98" cy="72" r="3" fill="#FFFFFF" />
            </g>
          ) : isSpeaking ? (
            /* Speaking State: Cheerful happy inverted-U curved eyes */
            <g>
              <path
                d="M55 74C55 67 69 67 69 74"
                stroke="#4ADE80"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M91 74C91 67 105 67 105 74"
                stroke="#4ADE80"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* Idle State: Friendly smiling oval eyes */
            <g>
              <ellipse cx="62" cy="72" rx="6" ry="7" fill="#22C55E" />
              <circle cx="64" cy="70" r="2" fill="#FFFFFF" />

              <ellipse cx="98" cy="72" rx="6" ry="7" fill="#22C55E" />
              <circle cx="100" cy="70" r="2" fill="#FFFFFF" />
            </g>
          )}

          {/* ── Expressive Mouth ── */}
          {isSpeaking ? (
            /* Speaking Waveform Mouth */
            <g>
              <line x1="68" y1="94" x2="68" y2="98" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
              <line x1="74" y1="91" x2="74" y2="101" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
              <line x1="80" y1="88" x2="80" y2="104" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="86" y1="91" x2="86" y2="101" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
              <line x1="92" y1="94" x2="92" y2="98" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : isListening ? (
            /* Listening: Attentive circle 'o' */
            <circle cx="80" cy="96" r="4.5" fill="#4ADE80" />
          ) : isProcessing ? (
            /* Processing: Horizontal subtle bar */
            <rect x="73" y="94" width="14" height="3" rx="1.5" fill="#FBBF24" />
          ) : (
            /* Idle: Friendly gentle smile */
            <path
              d="M71 93C75 97 85 97 89 93"
              stroke="#22C55E"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Cheerful Rosy Blush on Cheeks */}
          <circle cx="48" cy="85" r="4" fill="#F43F5E" opacity="0.4" />
          <circle cx="112" cy="85" r="4" fill="#F43F5E" opacity="0.4" />
        </svg>
      </div>

      {/* ── Live Active State Badge Under Robot ── */}
      <div className="mt-2.5 flex items-center justify-center">
        {isListening ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>سن رہے ہیں... ({formatTime(duration)}) بولیں</span>
          </div>
        ) : isProcessing ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold">
            <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span>ایگری میکس سوچ رہا ہے...</span>
          </div>
        ) : isSpeaking ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-[#166534] border border-emerald-200 text-xs font-bold">
            <HiSpeakerWave className="text-sm text-[#166534] animate-bounce" />
            <span>ایگری میکس بول رہا ہے...</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>ایگری بوٹ تیار ہے — مائیک دبائیں</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * VoiceRobotAssistant — Production-grade voice-first assistant interface.
 * Replaces text chat history on the AgriMax dashboard for low-literacy farmers.
 */
export default function VoiceRobotAssistant() {
  const { language } = useAppStore();
  const isUrdu = language === 'ur';

  // State from chat store
  const {
    messages,
    isRecording,
    recordingDuration,
    isProcessing,
    error,
    setError,
  } = useChatStore(
    useShallow((state) => ({
      messages: state.messages,
      isRecording: state.isRecording,
      recordingDuration: state.recordingDuration,
      isProcessing: state.isProcessing,
      error: state.error,
      setError: state.setError,
    }))
  );

  // Voice & TTS hooks
  const { startRecording, stopAndProcessAudio, processCommand } = useVoice();
  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeech();

  // Find the latest assistant response
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.sender === 'assistant' || m.sender === 'bot');

  // Assistant status determination
  const robotState = isRecording
    ? 'listening'
    : isProcessing
    ? 'processing'
    : isSpeaking
    ? 'speaking'
    : 'idle';

  // Toggle voice recording
  const handleMicClick = async () => {
    if (isProcessing) return;
    if (isRecording) {
      const hint = isUrdu ? 'ur' : 'en';
      await stopAndProcessAudio(hint);
    } else {
      if (isSpeaking) cancelSpeech();
      await startRecording();
    }
  };

  // Replay speech response
  const handleReplay = () => {
    if (!latestAssistantMessage) return;
    const textToSpeak = isUrdu
      ? latestAssistantMessage.messageUr || latestAssistantMessage.messageEn
      : latestAssistantMessage.messageEn || latestAssistantMessage.messageUr;
    if (textToSpeak) {
      speak(textToSpeak, language);
    }
  };

  // Quick voice query prompts (single tap voice commands)
  const handlePromptClick = async (queryText) => {
    if (isProcessing || isRecording) return;
    if (isSpeaking) cancelSpeech();
    await processCommand(queryText);
  };

  const PROMPTS = isUrdu
    ? [
        { label: 'گندم کی قیمت', query: 'آج گندم کی قیمت کیا ہے؟', icon: '🌾' },
        { label: 'موسم کا حال', query: 'آج موسم کا کیا حال ہے؟', icon: '🌦️' },
        { label: 'کھاد کا مشورہ', query: 'میری فصل کے لیے کھاد کا مشورہ دیں', icon: '🌱' },
        { label: 'مارکیٹ کھولو', query: 'مارکیٹ کھولو', icon: '🛒' },
      ]
    : [
        { label: 'Wheat Price', query: "What is today's wheat price?", icon: '🌾' },
        { label: 'Weather Forecast', query: "What's the weather forecast today?", icon: '🌦️' },
        { label: 'Fertilizer Advice', query: 'Give me fertilizer advice for crops', icon: '🌱' },
        { label: 'Open Market', query: 'Open marketplace', icon: '🛒' },
      ];

  // Latest spoken response text
  const responseText = latestAssistantMessage
    ? isUrdu
      ? latestAssistantMessage.messageUr || latestAssistantMessage.messageEn
      : latestAssistantMessage.messageEn || latestAssistantMessage.messageUr
    : null;

  const resultData = latestAssistantMessage?.result;
  const intent = latestAssistantMessage?.intent;

  return (
    <div className="w-full bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-4 sm:p-6 transition-all min-w-0">
      {/* ── Top Header: Mascot Title & Spoken Status ── */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] flex items-center justify-center font-bold text-sm shrink-0">
            🤖
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#1F2937] leading-tight">
              {isUrdu ? 'ایگری میکس صوتی معاون' : 'AgriMax Voice Assistant'}
            </h2>
            <p className="text-[11px] text-[#64748B]">
              {isUrdu ? 'صرف آواز کے ذریعے سوال پوچھیں اور جواب سنیں' : 'Ask questions and listen to spoken advice'}
            </p>
          </div>
        </div>

        {/* Audio Speaker Mute/Cancel Indicator */}
        {isSpeaking && (
          <button
            type="button"
            onClick={cancelSpeech}
            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Stop audio playback"
          >
            <HiStop className="text-xs text-red-600" />
            <span>{isUrdu ? 'آواز بند کریں' : 'Stop Audio'}</span>
          </button>
        )}
      </div>

      {/* ── Microphone Permission Warning (if blocked) ── */}
      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 animate-fade-up">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="text-amber-600 text-base shrink-0" />
            <span>
              {isUrdu
                ? 'مائیکروفون کی اجازت درکار ہے۔ براہ کرم براؤزر سیٹنگز میں مائیک کی اجازت دیں۔'
                : 'Microphone access is required. Please allow microphone permissions in your browser.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-amber-100 rounded-lg text-amber-700 transition cursor-pointer"
            aria-label="Dismiss error"
          >
            <HiXMark className="text-sm" />
          </button>
        </div>
      )}

      {/* ── Main Voice Centerpiece: Animated Robot Mascot & Audio Waves ── */}
      <div className="flex flex-col items-center justify-center py-2 sm:py-4">
        <AgriBotMascot state={robotState} duration={recordingDuration} />

        {/* Large Tactile Primary Microphone Button */}
        <div className="mt-4 flex flex-col items-center">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            aria-label={
              isRecording
                ? isUrdu
                  ? 'ریکارڈنگ بند کریں'
                  : 'Stop recording'
                : isUrdu
                ? 'بول کر پوچھیں'
                : 'Tap to speak'
            }
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer select-none active:scale-95 ${
              isRecording
                ? 'bg-[#DC2626] text-white ring-8 ring-red-200 animate-pulse scale-105'
                : isProcessing
                ? 'bg-slate-200 text-slate-400 cursor-wait'
                : isSpeaking
                ? 'bg-[#15803D] text-white ring-6 ring-emerald-200 animate-bounce [animation-duration:1.5s]'
                : 'bg-[#166534] hover:bg-[#14532D] text-white hover:scale-105 hover:shadow-lg ring-4 ring-[#DCFCE7]'
            }`}
          >
            {isRecording ? (
              <HiStop className="text-3xl sm:text-4xl" />
            ) : isProcessing ? (
              <div className="w-8 h-8 border-3 border-[#166534] border-t-transparent rounded-full animate-spin" />
            ) : isSpeaking ? (
              <HiSpeakerWave className="text-3xl sm:text-4xl animate-pulse" />
            ) : (
              <HiMicrophone className="text-3xl sm:text-4xl" />
            )}
          </button>

          {/* Direct Tap Instructions for Low-Literacy Farmers */}
          <p className="mt-2.5 text-xs sm:text-sm font-bold text-[#1F2937] text-center">
            {isRecording
              ? isUrdu
                ? 'سن رہے ہیں... بولنا ختم کر کے دوبارہ دبائیں'
                : 'Listening... Tap again when finished speaking'
              : isProcessing
              ? isUrdu
                ? 'آپ کی بات کا جواب تیار ہو رہا ہے...'
                : 'Processing your request...'
              : isSpeaking
              ? isUrdu
                ? 'جواب سنیں (دوبارہ بولنے کے لیے مائیک دبائیں)'
                : 'Listening to response (Tap mic to ask again)'
              : isUrdu
              ? 'بات کرنے کے لیے مائیک دبائیں'
              : 'Tap microphone to speak'}
          </p>
        </div>
      </div>

      {/* ── Spoken Response Display & In-Place Data Cards ── */}
      <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
        {responseText ? (
          <div className="space-y-3 animate-fade-up">
            {/* Spoken Audio Response Card */}
            <div className="bg-[#F7FAF7] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">
                    {isUrdu ? 'ایگری میکس کا جواب' : 'AgriMax Spoken Answer'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] font-medium">
                    🔊 {isUrdu ? 'صوتی جواب' : 'Spoken'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#1F2937] leading-relaxed break-words whitespace-pre-wrap">
                  {responseText}
                </p>
              </div>

              {/* Replay Audio Button */}
              <button
                type="button"
                onClick={handleReplay}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F0FDF4] text-[#166534] border border-[#E2E8F0] hover:border-[#166534] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <HiSpeakerWave className="text-base text-[#166534]" />
                <span>{isUrdu ? 'دوبارہ سنیں' : 'Listen Again'}</span>
              </button>
            </div>

            {/* In-Place Structured Data Card (e.g., Crop Price Card or Advice Card without page jump) */}
            {resultData && (
              <div className="mt-3">
                <AIContextRenderer
                  intent={intent}
                  result={resultData}
                  language={language}
                />
              </div>
            )}
          </div>
        ) : (
          /* Welcoming Prompt for First-Time or Empty State */
          <div className="text-center py-2 text-xs sm:text-sm text-[#64748B]">
            <p>
              {isUrdu
                ? 'فصل کی قیمت، کھاد کا مشورہ یا موسم کا حال معلوم کرنے کے لیے مائیک دبا کر بولیں'
                : 'Tap the microphone to ask about crop prices, fertilizer advice, or weather updates'}
            </p>
          </div>
        )}
      </div>

      {/* ── Quick Voice Prompts for Farmers ── */}
      <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            {isUrdu ? 'فوری صوتی سوالات' : 'Quick Voice Prompts'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptClick(p.query)}
              disabled={isProcessing || isRecording}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-[#F0FDF4] border border-[#E2E8F0] hover:border-[#166534] text-[#1F2937] hover:text-[#166534] transition-all text-xs font-bold shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 min-h-[44px]"
            >
              <span className="text-base">{p.icon}</span>
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
