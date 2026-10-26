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
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';
import useChatStore from '../store/useChatStore';
import useVoice from '../hooks/useVoice';
import useSpeech from '../hooks/useSpeech';
import VoiceButton from './VoiceButton';
import AIAdviceCard from './AIAdviceCard';
import AIContextRenderer, { BdiSpan } from './AIContextRenderer';

const PAGE_NAMES = {
  '/': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  '/marketplace': { en: 'Marketplace', ur: 'مارکیٹ' },
  '/prices': { en: 'Mandi Rates', ur: 'منڈی ریٹس' },
  '/wallet': { en: 'Digital Wallet', ur: 'والیٹ' },
  '/profile': { en: 'Farmer Profile', ur: 'پروفائل' },
  '/settings': { en: 'Settings', ur: 'ترتیبات' },
  '/my-posts': { en: 'My Sell Posts', ur: 'میری پوسٹس' },
  '/notifications': { en: 'Notifications', ur: 'اطلاعات' },
  '/login': { en: 'Farmer Login', ur: 'لاگ ان' },
};

const INTENT_LABELS = {
  GET_CROP_PRICE: { en: 'Market Price', ur: 'منڈی ریٹ' },
  GET_RECOMMENDATION: { en: 'Crop Guidance', ur: 'زرعی مشورہ' },
  GET_WALLET_BALANCE: { en: 'Wallet Balance', ur: 'والیٹ بیلنس' },
  SELL_CROP: { en: 'Sell Produce', ur: 'فصل فروخت' },
  WEATHER: { en: 'Weather', ur: 'موسم' },
  NAVIGATION: { en: 'Navigation', ur: 'رہنمائی' },
};

const QUICK_SUGGESTIONS = [
  { en: 'Wheat Price', ur: 'گندم کی قیمت' },
  { en: 'Sell 50 kg Wheat', ur: '50 کلو گندم بیچنی ہے' },
  { en: 'My Wallet', ur: 'میرا والیٹ' },
  { en: 'Farming Advice', ur: 'فصل کا مشورہ' },
];

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

  const { startRecording, stopAndProcessAudio, processCommand } = useVoice();
  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeech();

  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const currentPage = PAGE_NAMES[location.pathname] || {
    en: location.pathname.replace('/', '') || 'Dashboard',
    ur: location.pathname.replace('/', '') || 'ڈیش بورڈ',
  };

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

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

  const handleQuickAction = (text) => {
    if (isProcessing) return;
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
    const textToSpeak = language === 'ur' ? msg.messageUr || msg.messageEn : msg.messageEn || msg.messageUr;
    if (textToSpeak) speak(textToSpeak, language);
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
      className={`bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${
        isDrawer ? 'h-full w-full max-w-full' : 'rounded-[1.5rem] h-[600px] sm:h-[680px] w-full max-w-full'
      }`}
    >
      {/* ── Premium Header ── */}
      <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white/80 flex items-center justify-between gap-3 min-w-0 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-200/60 text-[#166534] flex items-center justify-center shrink-0 shadow-sm">
              <HiSparkles className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white animate-pulse" title="Online" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-800 truncate leading-tight flex items-center gap-2">
              AgriMax AI
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
              {language === 'ur' ? `سیاق و سباق: ${currentPage.ur}` : `Context: ${currentPage.en}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={toggleLanguage} className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-[#166534] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
            <HiLanguage className="text-sm text-[#166534]" />
            <span>{language === 'ur' ? 'EN' : 'اردو'}</span>
          </button>
          <button onClick={toggleSound} className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${soundEnabled ? 'border-slate-200 bg-white text-slate-500 hover:text-[#166534]' : 'border-amber-200 bg-amber-50 text-amber-600'}`} title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled ? <HiSpeakerWave className="text-sm" /> : <HiSpeakerXMark className="text-sm" />}
          </button>
          <button onClick={clearChat} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 text-sm transition-all cursor-pointer shadow-sm" title="Clear Chat">
            <HiArrowPath className="text-sm" />
          </button>
          {isDrawer && onClose && (
            <button onClick={onClose} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 text-sm transition-all cursor-pointer shadow-sm">
              <HiXMark className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* ── OTP Notice ── */}
      {awaitingOtp && (
        <div className="shrink-0 px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2 text-xs text-amber-900 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🔐</span>
            <span className="font-semibold truncate">
              {language === 'ur' ? 'لاگ ان کے لیے OTP بولیں یا لکھیں' : 'Speak or type your OTP'} {pendingPhone ? `(${pendingPhone})` : ''}
            </span>
          </div>
          <button onClick={handleToggleVoice} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] shrink-0 transition-colors shadow-sm cursor-pointer">
            {language === 'ur' ? 'OTP بولیں 🎤' : 'Speak OTP 🎤'}
          </button>
        </div>
      )}

      {/* ── Message Stream ── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-smooth min-w-0 bg-slate-50/50 relative"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

          if (isUser) {
            return (
              <div key={msg.id || idx} className="flex items-start justify-end gap-2.5 animate-fade-up min-w-0">
                <div className="max-w-[85%] sm:max-w-[75%] bg-[#166534] text-white rounded-[1.25rem] rounded-tr-sm px-4 py-3 shadow-md shadow-green-900/10 min-w-0 break-words">
                  <p className="text-[13.5px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-green-100/80 text-[10px]">
                    <BdiSpan>{timeStr}</BdiSpan>
                    <span className="flex items-center"><HiCheck className="text-xs" /><HiCheck className="text-xs -ml-1.5" /></span>
                  </div>
                </div>
              </div>
            );
          }

          const intent = msg.intent || msg.data?.intent;
          const result = msg.result || msg.data?.result;

          if (intent === 'GET_RECOMMENDATION') {
            return (
              <div key={msg.id || idx} className="w-full min-w-0 animate-fade-up">
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

          const primaryText = language === 'ur' ? msg.messageUr || msg.messageEn : msg.messageEn || msg.messageUr;
          const secondaryText = language === 'ur' ? msg.messageEn : msg.messageUr;
          const badgeInfo = intent && INTENT_LABELS[intent];

          return (
            <div key={msg.id || idx} className="flex items-start gap-3 animate-fade-up min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-[#166534] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm mt-1 select-none">
                🌾
              </div>
              <div className="max-w-[90%] sm:max-w-[80%] space-y-2 min-w-0 flex-1">
                <div className="bg-white border border-slate-200/80 text-slate-800 rounded-[1.25rem] rounded-tl-sm p-4 sm:p-5 shadow-sm min-w-0">
                  {badgeInfo && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
                        {language === 'ur' ? badgeInfo.ur : badgeInfo.en}
                      </span>
                    </div>
                  )}

                  <div className={`text-[13.5px] leading-relaxed break-words whitespace-pre-wrap text-slate-700 font-medium ${language === 'ur' ? 'urdu-text text-right text-[15px] leading-loose' : 'text-left'}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    {primaryText}
                  </div>

                  {secondaryText && secondaryText !== primaryText && (
                    <p className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed italic" dir={language === 'ur' ? 'ltr' : 'rtl'}>
                      {secondaryText}
                    </p>
                  )}

                  {result && (
                    <div className="mt-3 pt-3 border-t border-slate-100 min-w-0">
                      <AIContextRenderer intent={intent} result={result} onSelectAction={handleQuickAction} language={language} />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <BdiSpan className="font-medium">{timeStr}</BdiSpan>
                    <button onClick={() => handleReplay(msg)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-50 text-slate-500 hover:text-[#166534] transition-colors cursor-pointer">
                      <HiSpeakerWave className="text-xs" />
                      <span className="font-semibold">{language === 'ur' ? 'سنیں' : 'Listen'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 shadow-sm animate-fade-up w-fit">
            <div className="w-4 h-4 border-2 border-[#166534] border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-medium">{language === 'ur' ? 'ایگری میکس سوچ رہا ہے...' : 'AgriMax is thinking...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Suggestions (Sticky above composer) ── */}
      {messages.length <= 4 && !isProcessing && (
        <div className="shrink-0 px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HiOutlineChatBubbleLeftRight /> {language === 'ur' ? 'تجویز:' : 'Try:'}
          </span>
          {QUICK_SUGGESTIONS.map((item, idx) => {
            const label = language === 'ur' ? item.ur : item.en;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickAction(label)}
                className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 hover:border-[#166534] hover:text-[#166534] hover:bg-green-50 text-[11px] font-medium text-slate-600 shrink-0 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Premium Composer ── */}
      <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-100 min-w-0">
        <div className="flex items-end gap-2.5 min-w-0">
          <VoiceButton
            size="sm"
            onStart={handleToggleVoice}
            onStop={handleToggleVoice}
            isRecording={isRecording}
            disabled={isProcessing}
            className="mb-0.5"
          />

          <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2 min-w-0 bg-slate-50 border border-slate-200 rounded-[1.25rem] p-1.5 focus-within:bg-white focus-within:border-[#166534] focus-within:ring-4 focus-within:ring-green-500/10 transition-all shadow-sm">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing || isRecording}
              placeholder={
                isRecording ? (language === 'ur' ? 'آواز ریکارڈ ہو رہی ہے...' : 'Recording voice...')
                : language === 'ur' ? 'ایگری میکس سے کچھ بھی پوچھیں...' : 'Ask AgriMax anything...'
              }
              className="flex-1 bg-transparent border-0 px-3 py-2 text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 min-w-0 font-medium"
              dir={language === 'ur' ? 'rtl' : 'ltr'}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing || isRecording}
              className="p-2.5 bg-[#166534] hover:bg-[#14532D] disabled:opacity-40 disabled:hover:bg-[#166534] text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm active:scale-95 group"
              aria-label="Send message"
            >
              <HiPaperAirplane className="text-sm sm:text-base -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mt-2 px-1 min-w-0 font-medium">
          <span className="truncate flex items-center gap-1">
            {isRecording ? <span className="text-red-500 animate-pulse">● {language === 'ur' ? 'ریکارڈنگ جاری ہے...' : 'Recording...'}</span>
              : language === 'ur' ? 'مائیک دبا کر بولیں یا لکھیں' : 'Tap mic to speak or type'}
          </span>
          <span className="hidden sm:inline text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">Enter ↵</span>
        </div>
      </div>
    </div>
  );
}

export default AIChatPanel;