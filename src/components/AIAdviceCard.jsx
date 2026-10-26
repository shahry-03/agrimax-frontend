import { useState } from 'react';
import {
  HiBookmark,
  HiSpeakerWave,
  HiMicrophone,
  HiArrowPath,
  HiSparkles,
  HiCheck,
  HiChevronDown,
  HiChevronUp,
  HiOutlineLightBulb,
  HiOutlineArrowPathRoundedSquare,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useSpeech from '../hooks/useSpeech';
import { getHumanKeyLabel } from '../utils/aiSchemaMapper';

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
  weather: { en: 'Weather Advice', ur: 'موسم کی رہنمائی' },
  pest: { en: 'Pest Control', ur: 'کیڑوں کا انسداد' },
  fertilizer: { en: 'Fertilizer Advice', ur: 'کھاد کا مشورہ' },
  general: { en: 'Farming Advice', ur: 'زرعی رہنمائی' },
};

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

  const primaryText = language === 'ur' ? adviceUr || adviceEn : adviceEn || adviceUr;
  const secondaryText = language === 'ur' ? adviceEn : adviceUr;

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

  const resolvedContexts = Array.isArray(contextUsed)
    ? contextUsed
        .map((key) => ({
          key,
          label: getHumanKeyLabel(key, language),
        }))
        .filter((item) => item.label && item.label.trim())
    : [];

  return (
    <div className="w-full max-w-full bg-white border border-emerald-100/60 rounded-[1.5rem] p-1 shadow-lg shadow-emerald-900/5 my-3 min-w-0 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/10">
      
      {/* Decorative Top Gradient Border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600 opacity-80" />

      <div className="p-4 sm:p-6 relative z-10">
        
        {/* ── Top Header Row ── */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Glowing Topic Icon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center text-2xl shrink-0 shadow-inner select-none z-10 relative">
                {icon}
              </div>
              {/* Subtle glow behind icon */}
              <div className="absolute inset-0 bg-emerald-400 blur-md opacity-20 rounded-2xl" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <HiSparkles className="text-emerald-600 text-base shrink-0 animate-pulse" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-tight truncate tracking-tight">
                  {language === 'ur' ? 'ایگری میکس زرعی رہنمائی' : 'AgriMax Farming Advice'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {language === 'ur' ? topicLabel.ur : topicLabel.en}
                </span>
                {crop && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                    <span>🌱</span> {crop}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Premium Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSpeak}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 shadow-sm transition-all flex items-center justify-center cursor-pointer active:scale-95 group/btn"
              title={language === 'ur' ? 'مشورہ سنیں' : 'Listen'}
            >
              <HiSpeakerWave className="text-sm sm:text-base group-hover/btn:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`h-8 sm:h-9 px-3 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                saved
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {saved ? <HiCheck className="text-sm" /> : <HiBookmark className="text-sm" />}
              <span className="hidden sm:inline">
                {saved ? (language === 'ur' ? 'محفوظ' : 'Saved') : (language === 'ur' ? 'محفوظ کریں' : 'Save')}
              </span>
            </button>
          </div>
        </div>

        {/* ── Body: Core Advice Text ── */}
        <div className="py-4">
          <div
            className={`text-[14px] sm:text-[15.5px] font-medium leading-relaxed sm:leading-loose text-slate-700 whitespace-pre-wrap break-words ${
              language === 'ur' ? 'urdu-text text-right text-base sm:text-[17px] leading-[2]' : 'text-left'
            }`}
            dir={language === 'ur' ? 'rtl' : 'ltr'}
          >
            {primaryText}
          </div>

          {/* Elegant Translation Accordion */}
          {secondaryText && secondaryText !== primaryText && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowSecondary(!showSecondary)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer border border-transparent hover:border-emerald-100"
              >
                {showSecondary ? <HiChevronUp className="text-sm" /> : <HiChevronDown className="text-sm" />}
                <span>
                  {language === 'ur'
                    ? showSecondary ? 'ترجمہ چھپائیں' : 'انگریزی ترجمہ دیکھیں'
                    : showSecondary ? 'Hide Translation' : 'View Urdu Translation'}
                </span>
              </button>

              {/* Smooth expandable area */}
              <div className={`grid transition-all duration-300 ease-in-out ${showSecondary ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                <div className="overflow-hidden">
                  <div
                    className={`p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[13px] text-slate-600 leading-relaxed ${
                      language === 'ur' ? 'text-left font-sans' : 'text-right urdu-text'
                    }`}
                    dir={language === 'ur' ? 'ltr' : 'rtl'}
                  >
                    {secondaryText}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Context Data (Based on real-time data) ── */}
        {resolvedContexts.length > 0 && (
          <div className="py-3 border-t border-slate-100/80">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <HiOutlineLightBulb className="text-amber-500 text-sm" />
              <span>{language === 'ur' ? 'معلومات کی بنیاد' : 'Based on real-time data'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resolvedContexts.map((ctx, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-sm flex items-center gap-1"
                >
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  {ctx.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5 mt-1">
          <button
            type="button"
            onClick={onAskMore}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group/mic"
          >
            <HiMicrophone className="text-base group-hover/mic:animate-bounce" />
            <span>{language === 'ur' ? 'مزید پوچھیں' : 'Ask Follow-up'}</span>
          </button>

          <button
            type="button"
            onClick={onAskMore}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <HiOutlineArrowPathRoundedSquare className="text-base text-slate-400" />
            <span>{language === 'ur' ? 'نیا مشورہ لیں' : 'New Advice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAdviceCard;