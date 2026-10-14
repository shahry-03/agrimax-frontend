import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HiPaperAirplane,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiCheck,
  HiXMark,
  HiArrowPath,
  HiLanguage,
  HiSparkles,
} from 'react-icons/hi2';
import useChatStore from '../store/useChatStore';
import useVoice from '../hooks/useVoice';
import useSpeech from '../hooks/useSpeech';
import VoiceButton from './VoiceButton';
import AIAdviceCard from './AIAdviceCard';

const PAGE_NAMES = {
  '/': { en: 'Home', ur: 'ہوم' },
  '/marketplace': { en: 'Marketplace', ur: 'مارکیٹ' },
  '/prices': { en: 'Prices', ur: 'قیمتیں' },
  '/wallet': { en: 'Wallet', ur: 'والیٹ' },
  '/profile': { en: 'Profile', ur: 'پروفائل' },
  '/settings': { en: 'Settings', ur: 'ترتیبات' },
  '/my-posts': { en: 'My Posts', ur: 'میری پوسٹس' },
  '/notifications': { en: 'Notifications', ur: 'اطلاعات' },
  '/login': { en: 'Login', ur: 'لاگ ان' },
};

const INTENT_BADGES = {
  NAVIGATE: 'bg-blue-100 text-blue-800 border-blue-200',
  GO_BACK: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  HELP: 'bg-purple-100 text-purple-800 border-purple-200',
  GET_CROP_PRICE: 'bg-amber-100 text-amber-800 border-amber-200',
  VIEW_WALLET: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LOGIN: 'bg-orange-100 text-orange-800 border-orange-200',
  VERIFY_OTP: 'bg-green-100 text-green-800 border-green-200',
  CREATE_SELL_POST: 'bg-teal-100 text-teal-800 border-teal-200',
  DEFAULT: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * AIChatPanel — AI Voice & Text chat assistant panel.
 * Designed with a rigid flex-column layout:
 * - Fixed header
 * - Scrollable message list (flex: 1, min-height: 0, overflow-y: auto)
 * - Anchored bottom composer (shrink: 0)
 */
export function AIChatPanel({ isDrawer = false, onClose }) {
  const location = useLocation();
  const {
    messages,
    language,
    setLanguage,
    clearChat,
    isRecording,
    isProcessing,
    awaitingOtp,
    pendingPhone,
  } = useChatStore();

  const {
    startRecording,
    stopAndProcessAudio,
    processCommand,
  } = useVoice();

  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeech();

  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Current page name
  const currentPage =
    PAGE_NAMES[location.pathname] || {
      en: location.pathname.replace('/', '') || 'Home',
      ur: location.pathname.replace('/', '') || 'ہوم',
    };

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  // Auto-scroll to bottom on new messages if user was near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRecording, isProcessing]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    isNearBottomRef.current = true;
    processCommand(text);
  };

  const handleToggleVoice = async () => {
    if (isProcessing) return;
    if (isRecording) {
      const hint = language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined;
      await stopAndProcessAudio(hint);
    } else {
      await startRecording();
    }
  };

  const handleReplay = (msg) => {
    if (!soundEnabled) return;
    const textToSpeak =
      language === 'ur'
        ? msg.messageUr || msg.messageEn
        : msg.messageEn || msg.messageUr;
    if (textToSpeak) {
      speak(textToSpeak, language);
    }
  };

  const toggleSound = () => {
    if (isSpeaking) cancelSpeech();
    setSoundEnabled(!soundEnabled);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ur' ? 'en' : 'ur');
  };

  const handleSaveAdvice = useCallback((msg) => {
    try {
      const existing = JSON.parse(localStorage.getItem('agrimax_saved_advice') || '[]');
      const result = msg.result || msg.data?.result;
      const now = Date.now();
      const entry = {
        id: msg.id || 'adv_' + now,
        savedAt: now,
        adviceEn: result?.adviceEn || msg.messageEn,
        adviceUr: result?.adviceUr || msg.messageUr,
        crop: result?.crop || null,
        topic: result?.topic || 'general',
        contextUsed: result?.contextUsed || [],
      };
      const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 30);
      localStorage.setItem('agrimax_saved_advice', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save advice:', err);
    }
  }, []);

  return (
    <div
      className={`bg-white border border-[#E2EAF0] shadow-xs flex flex-col min-w-0 ${
        isDrawer
          ? 'h-full w-full'
          : 'rounded-2xl h-[480px] sm:h-[500px] w-full'
      }`}
    >
      {/* ── Stable Header (shrink-0) ── */}
      <div className="shrink-0 p-3.5 sm:p-4 border-b border-[#E2EAF0] bg-white rounded-t-2xl flex items-center justify-between gap-2.5">
        {/* Assistant Info & Live Page Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#E8F5E9] text-[#078747] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
            <HiSparkles className="w-5 h-5 text-[#078747]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#102A43] truncate leading-tight flex items-center gap-1.5">
              <span>AgriMax AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shrink-0" />
            </h2>
            <p className="text-[11px] text-[#62758A] truncate mt-0.5">
              {language === 'ur'
                ? `آپ یہاں ہیں: ${currentPage.ur}`
                : `You are on: ${currentPage.en}`}
            </p>
          </div>
        </div>

        {/* Action Controls: Language Toggle, Audio Mute, Clear, Close Drawer */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-lg border border-[#E2EAF0] text-[11px] font-bold text-[#334E68] hover:bg-[#F0F8F2] hover:text-[#078747] transition flex items-center gap-1 cursor-pointer"
            title="Toggle Urdu/English"
            aria-label="Toggle language"
          >
            <HiLanguage className="text-sm text-[#078747]" />
            <span>{language === 'ur' ? 'EN' : 'اردو'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border text-sm transition cursor-pointer ${
              soundEnabled
                ? 'border-[#E2EAF0] text-[#62758A] hover:text-[#078747] hover:bg-[#F0F8F2]'
                : 'border-red-200 text-red-500 bg-red-50'
            }`}
            title={soundEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
            aria-label="Toggle voice"
          >
            {soundEnabled ? <HiSpeakerWave /> : <HiSpeakerXMark />}
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={clearChat}
            className="p-1.5 rounded-lg border border-[#E2EAF0] text-[#62758A] hover:text-[#102A43] hover:bg-gray-50 text-sm transition cursor-pointer"
            title="Clear conversation"
            aria-label="Clear chat"
          >
            <HiArrowPath />
          </button>

          {/* Close button if rendered in drawer */}
          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#E2EAF0] text-[#62758A] hover:text-red-600 hover:bg-red-50 text-sm transition cursor-pointer"
              title="Close assistant"
              aria-label="Close"
            >
              <HiXMark className="text-base" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-turn OTP Notice if awaiting OTP */}
      {awaitingOtp && (
        <div className="shrink-0 px-4 py-2 bg-[#FEF3C7] border-b border-[#FCD34D] flex items-center gap-2 text-xs text-[#92400E] animate-pulse">
          <span>🔐</span>
          <span className="font-semibold truncate">
            {language === 'ur'
              ? 'OTP بولیں یا نیچے ٹائپ کریں'
              : 'Speak or type your OTP below'}
            {pendingPhone ? ` (${pendingPhone})` : ''}
          </span>
        </div>
      )}

      {/* ── Conversation Message Stream (flex-1 min-h-0 overflow-y-auto) ── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 scroll-smooth"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const timeStr = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          if (isUser) {
            return (
              <div
                key={msg.id || idx}
                className="flex items-start justify-end gap-2 animate-fade-up"
              >
                <div className="max-w-[85%] sm:max-w-[75%] bg-[#078747] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-2xs min-w-0 break-words">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-1 text-green-100/90 text-[10px]">
                    <span>{timeStr}</span>
                    <span className="flex items-center">
                      <HiCheck className="text-xs" />
                      <HiCheck className="text-xs -ml-1.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // AI Message
          const intent = msg.intent || msg.data?.intent;
          const result = msg.result || msg.data?.result;

          // Special Render: Rich AI Farming Advice Card for GET_RECOMMENDATION
          if (intent === 'GET_RECOMMENDATION') {
            return (
              <div key={msg.id || idx} className="w-full">
                <AIAdviceCard
                  adviceEn={result?.adviceEn || msg.messageEn}
                  adviceUr={result?.adviceUr || msg.messageUr}
                  crop={result?.crop || null}
                  topic={result?.topic || 'general'}
                  language={language}
                  contextUsed={result?.contextUsed || []}
                  onAskMore={handleToggleVoice}
                  onSave={() => handleSaveAdvice(msg)}
                />
              </div>
            );
          }

          const primaryText =
            language === 'ur'
              ? msg.messageUr || msg.messageEn
              : msg.messageEn || msg.messageUr;
          const secondaryText =
            language === 'ur' ? msg.messageEn : msg.messageUr;
          const intentBadgeClass =
            INTENT_BADGES[msg.intent] || INTENT_BADGES.DEFAULT;

          return (
            <div
              key={msg.id || idx}
              className="flex items-start gap-2.5 animate-fade-up"
            >
              {/* Bot Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#078747] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs mt-0.5">
                🌾
              </div>

              <div className="max-w-[90%] sm:max-w-[82%] space-y-2 min-w-0">
                {/* AI Bubble (Dark Bubble #102A43) */}
                <div className="bg-[#102A43] text-white rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-2xs">
                  {/* Top Bar: Intent Badge & Confidence */}
                  {msg.intent && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${intentBadgeClass}`}
                      >
                        {msg.intent}
                      </span>
                      {msg.confidence !== undefined && msg.confidence !== null && (
                        <span className="text-[10px] font-semibold text-gray-300">
                          {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <div
                    className={`text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap text-white font-normal ${
                      language === 'ur' ? 'urdu-text text-right text-base leading-normal' : ''
                    }`}
                    dir={language === 'ur' ? 'rtl' : 'ltr'}
                  >
                    {primaryText}
                  </div>

                  {/* Secondary Translation Subtext */}
                  {secondaryText && secondaryText !== primaryText && (
                    <p
                      className="mt-2 pt-2 border-t border-white/10 text-[11px] text-gray-300/80 leading-normal italic"
                      dir={language === 'ur' ? 'ltr' : 'rtl'}
                    >
                      {secondaryText}
                    </p>
                  )}

                  {/* Rich Data Cards (Prices, Wallet, Capabilities) */}
                  {result && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 text-xs">
                      {/* Crop Price Card */}
                      {result.cropName && (
                        <div className="bg-white/10 p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between font-bold text-green-300">
                            <span>{result.cropName}</span>
                            <span>PKR {result.currentPrice}</span>
                          </div>
                          {result.marketName && (
                            <p className="text-[11px] text-gray-300">{result.marketName}</p>
                          )}
                        </div>
                      )}

                      {/* Wallet Balance Card */}
                      {result.balance !== undefined && (
                        <div className="bg-white/10 p-2.5 rounded-xl flex items-center justify-between font-bold text-emerald-300">
                          <span>{language === 'ur' ? 'موجودہ بیلنس:' : 'Balance:'}</span>
                          <span>PKR {result.balance}</span>
                        </div>
                      )}

                      {/* Capabilities List for HELP */}
                      {Array.isArray(result.capabilities) && (
                        <div className="bg-white/10 p-2.5 rounded-xl">
                          <p className="font-semibold text-gray-200 mb-1.5">
                            {language === 'ur' ? 'ممکنہ سہولیات:' : 'Supported actions:'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {result.capabilities.map((cap, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] text-gray-200 font-mono"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation Action Result */}
                      {result.action === 'navigate' && (
                        <div className="bg-blue-900/40 border border-blue-500/30 p-2 rounded-xl text-[11px] text-blue-200 flex items-center gap-1.5">
                          <span>🧭</span>
                          <span>
                            {language === 'ur'
                              ? `${result.label || result.target} پر جا رہے ہیں...`
                              : `Navigating to ${result.label || result.target}...`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Timestamp & Audio Replay Button */}
                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-1.5 border-t border-white/10 text-[10px] text-gray-400">
                    <span>{timeStr}</span>
                    <button
                      type="button"
                      onClick={() => handleReplay(msg)}
                      className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition cursor-pointer"
                      title="Listen again"
                    >
                      <HiSpeakerWave className="text-xs text-green-400" />
                      <span>{language === 'ur' ? 'سنیں' : 'Listen'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-200 animate-pulse text-xs text-gray-600">
            <div className="w-4 h-4 border-2 border-[#078747] border-t-transparent rounded-full animate-spin" />
            <span>
              {language === 'ur' ? 'سوچ رہا ہوں...' : 'AgriMax is thinking...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Anchored Bottom Composer (shrink-0) ── */}
      <div className="shrink-0 p-3 sm:p-3.5 bg-gray-50/90 border-t border-[#E2EAF0] rounded-b-2xl">
        <div className="flex items-center gap-2.5">
          {/* Integrated Compact Voice Button */}
          <VoiceButton
            size="sm"
            onStart={handleToggleVoice}
            onStop={handleToggleVoice}
            isRecording={isRecording}
            disabled={isProcessing}
          />

          {/* Text Input Composer */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing || isRecording}
              placeholder={
                isRecording
                  ? language === 'ur'
                    ? 'آواز ریکارڈ ہو رہی ہے...'
                    : 'Recording voice...'
                  : language === 'ur'
                  ? 'کمانڈ بولیں یا یہاں لکھیں (جیسے: "مارکیٹ کھولو")...'
                  : 'Speak or type a command (e.g. "open market")...'
              }
              className="flex-1 bg-white border border-[#E2EAF0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#102A43] placeholder-[#9FB3C8] focus:outline-none focus:ring-2 focus:ring-[#078747]/30 focus:border-[#078747] transition disabled:bg-gray-100 min-w-0 shadow-2xs"
              dir={language === 'ur' ? 'rtl' : 'ltr'}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing || isRecording}
              className="p-2.5 bg-[#078747] hover:bg-[#056B3B] disabled:opacity-40 disabled:hover:bg-[#078747] text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
              aria-label="Send message"
            >
              <HiPaperAirplane className="text-base -rotate-45" />
            </button>
          </form>
        </div>

        {/* Compact helper status caption */}
        <div className="flex items-center justify-between text-[11px] text-[#62758A] mt-1.5 px-0.5">
          <span className="truncate">
            {isRecording
              ? language === 'ur'
                ? '⏹️ مکمل کرنے پر مائیک دوبارہ دبائیں'
                : '⏹️ Tap mic again when finished'
              : language === 'ur'
              ? 'مائیک دبا کر بولیں یا لکھیں'
              : 'Tap mic to speak or type command'}
          </span>
          <span className="hidden sm:inline text-[10px] text-[#9FB3C8] shrink-0">
            Enter ↵ to send
          </span>
        </div>
      </div>
    </div>
  );
}

export default AIChatPanel;
