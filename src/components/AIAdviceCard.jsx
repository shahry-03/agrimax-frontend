import { useState } from 'react';
import {
  HiBookmark,
  HiSpeakerWave,
  HiMicrophone,
  HiArrowPath,
  HiSparkles,
  HiCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useSpeech from '../hooks/useSpeech';

const TOPIC_ICONS = {
  selling: '🌾',
  planting: '🌱',
  weather: '☁️',
  pest: '🐛',
  fertilizer: '💧',
  general: '🧠',
};

const TOPIC_LABELS = {
  selling: { en: 'Selling Advice', ur: 'فروخت کا مشورہ' },
  planting: { en: 'Planting Advice', ur: 'بوائی کا مشورہ' },
  weather: { en: 'Weather Update', ur: 'موسم کی معلومات' },
  pest: { en: 'Pest Control', ur: 'کیڑوں کا علاج' },
  fertilizer: { en: 'Fertilizer Tip', ur: 'کھاد کا مشورہ' },
  general: { en: 'AI Farming Advice', ur: 'AI زرعی مشورہ' },
};

const CONTEXT_LABELS = {
  currentDate: { en: 'Today', ur: 'آج کی تاریخ' },
  season: { en: 'Season', ur: 'موسم' },
  currentAvgPrice: { en: 'Market Rates', ur: 'مارکیٹ ریٹس' },
  marketName: { en: 'Mandi Data', ur: 'منڈی کا ڈیٹا' },
  cropNameEn: { en: 'Crop Variety', ur: 'فصل کی قسم' },
  cropCategory: { en: 'Category', ur: 'کیٹیگری' },
};

/**
 * AIAdviceCard — Visually rich card component for GET_RECOMMENDATION AI responses.
 * Highlights personalized crop recommendations with topic icons, readable typography,
 * contextual data pills, and interactive follow-up controls.
 */
export function AIAdviceCard({
  adviceEn,
  adviceUr,
  crop = null,
  topic = 'general',
  language = 'ur',
  contextUsed = [],
  onAskMore,
  onSave,
}) {
  const [saved, setSaved] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const { speak } = useSpeech();

  const safeTopic = (topic || 'general').toLowerCase();
  const icon = TOPIC_ICONS[safeTopic] || TOPIC_ICONS.general;
  const topicLabel = TOPIC_LABELS[safeTopic] || TOPIC_LABELS.general;

  // Primary text depending on current language
  const primaryText =
    language === 'ur'
      ? adviceUr || adviceEn
      : adviceEn || adviceUr;

  // Alternate language translation
  const secondaryText =
    language === 'ur' ? adviceEn : adviceUr;

  const handleSave = () => {
    setSaved(!saved);
    if (!saved) {
      toast.success(
        language === 'ur' ? 'مشورہ محفوظ کر لیا گیا!' : 'Advice saved to notes!',
        { icon: '📌', id: 'save-advice-toast' }
      );
      if (onSave) onSave();
    }
  };

  const handleSpeak = () => {
    if (primaryText) {
      speak(primaryText, language);
    }
  };

  // Human-friendly context labels
  const resolvedContexts = Array.isArray(contextUsed)
    ? contextUsed.map((key) => {
        const item = CONTEXT_LABELS[key];
        return item ? (language === 'ur' ? item.ur : item.en) : key;
      })
    : [];

  return (
    <div className="w-full max-w-full bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border border-[#C8E6C9] border-l-4 border-l-[#16a34a] rounded-2xl p-4 sm:p-5 shadow-sm text-[#102A43] transition-all my-2 animate-fade-up">
      {/* ── Top Header Row ── */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#C8E6C9]/80">
        <div className="flex items-center gap-3">
          {/* 48px Circular Topic Icon Badge */}
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-[#C8E6C9] flex items-center justify-center text-2xl shrink-0 select-none">
            {icon}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <HiSparkles className="text-[#16a34a] text-sm" />
              <h3 className="text-sm sm:text-base font-extrabold text-[#056B3B] leading-tight">
                {language === 'ur' ? 'AI زرعی مشورہ' : 'AI Farming Advice'}
              </h3>
            </div>
            <p className="text-xs font-semibold text-[#334E68] mt-0.5">
              {language === 'ur' ? topicLabel.ur : topicLabel.en}
            </p>
          </div>
        </div>

        {/* Action Controls: Audio Speak & Save */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSpeak}
            className="p-2 rounded-xl bg-white hover:bg-[#E8F5E9] text-[#078747] border border-[#C8E6C9] shadow-2xs transition cursor-pointer"
            title={language === 'ur' ? 'مشورہ سنیں' : 'Listen to advice'}
            aria-label="Listen"
          >
            <HiSpeakerWave className="text-base" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              saved
                ? 'bg-[#16a34a] text-white border-[#16a34a]'
                : 'bg-white hover:bg-[#E8F5E9] text-[#056B3B] border-[#C8E6C9]'
            }`}
            title="Save advice"
            aria-label="Save"
          >
            {saved ? <HiCheck className="text-sm" /> : <HiBookmark className="text-sm" />}
            <span className="hidden sm:inline">
              {saved
                ? (language === 'ur' ? 'محفوظ شدہ' : 'Saved')
                : (language === 'ur' ? 'محفوظ کریں' : 'Save')}
            </span>
          </button>
        </div>
      </div>

      {/* ── Metadata Row: Crop & Topic tags ── */}
      <div className="flex flex-wrap items-center gap-2 py-2.5 text-xs text-[#334E68]">
        {crop && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 border border-[#C8E6C9] font-bold text-[#056B3B]">
            <span>🌱</span>
            <span>
              {language === 'ur' ? `فصل: ${crop}` : `Crop: ${crop}`}
            </span>
          </span>
        )}

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 border border-[#C8E6C9] font-medium text-[#486581]">
          <span>📌</span>
          <span>
            {language === 'ur'
              ? `موضوع: ${topicLabel.ur}`
              : `Topic: ${topicLabel.en}`}
          </span>
        </span>
      </div>

      {/* ── Body: Large Readability Advice Text ── */}
      <div className="py-2.5">
        <div
          className={`text-[15px] sm:text-[17px] font-medium leading-relaxed text-[#102A43] whitespace-pre-wrap break-words ${
            language === 'ur' ? 'urdu-text text-right text-lg leading-loose' : 'text-left'
          }`}
          dir={language === 'ur' ? 'rtl' : 'ltr'}
        >
          {primaryText}
        </div>

        {/* Translation Switch Accordion */}
        {secondaryText && secondaryText !== primaryText && (
          <div className="mt-3 pt-2.5 border-t border-[#C8E6C9]/80">
            <button
              type="button"
              onClick={() => setShowSecondary(!showSecondary)}
              className="text-xs font-bold text-[#056B3B] hover:text-[#078747] inline-flex items-center gap-1 cursor-pointer transition"
            >
              <span>{showSecondary ? '▲' : '▼'}</span>
              <span>
                {language === 'ur'
                  ? showSecondary ? 'انگریزی ترجمہ چھپائیں' : 'انگریزی ترجمہ دیکھیں (View English)'
                  : showSecondary ? 'Hide Urdu Translation' : 'اردو ترجمہ دیکھیں (View Urdu)'}
              </span>
            </button>

            {showSecondary && (
              <div
                className={`mt-2 p-3 bg-white/95 rounded-xl border border-[#C8E6C9] text-xs sm:text-sm text-[#334E68] leading-relaxed italic ${
                  language === 'ur' ? 'text-left font-sans' : 'text-right urdu-text'
                }`}
                dir={language === 'ur' ? 'ltr' : 'rtl'}
              >
                {secondaryText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Context Used Row ── */}
      {resolvedContexts.length > 0 && (
        <div className="py-2.5 border-t border-[#C8E6C9]/80 flex flex-wrap items-center gap-1.5 text-xs text-[#486581]">
          <span className="font-bold text-[#056B3B] mr-1">
            {language === 'ur' ? '💡 بنیاد:' : '💡 Based on:'}
          </span>
          {resolvedContexts.map((ctx, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-lg bg-white/90 border border-[#C8E6C9] text-[11px] font-semibold text-[#078747]"
            >
              {ctx}
            </span>
          ))}
        </div>
      )}

      {/* ── Action Buttons Footer ── */}
      <div className="pt-3 border-t border-[#C8E6C9]/80 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onAskMore}
          className="px-3.5 py-2 rounded-xl bg-[#078747] hover:bg-[#056B3B] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <HiMicrophone className="text-sm" />
          <span>{language === 'ur' ? 'مزید سوال پوچھیں 🎤' : 'Ask Follow-up 🎤'}</span>
        </button>

        <button
          type="button"
          onClick={onAskMore}
          className="px-3 py-2 rounded-xl bg-white hover:bg-[#E8F5E9] text-[#056B3B] border border-[#C8E6C9] text-xs sm:text-sm font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <HiArrowPath className="text-sm" />
          <span>{language === 'ur' ? 'دوسرا مشورہ لیں 🔄' : 'Get Another Advice 🔄'}</span>
        </button>
      </div>
    </div>
  );
}

export default AIAdviceCard;
