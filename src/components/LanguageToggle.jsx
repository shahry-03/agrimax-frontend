import useAppStore from '../store/useAppStore';
import useSpeech from '../hooks/useSpeech';

/**
 * LanguageToggle — Premium Segmented Control for switching between Urdu (🇵🇰) and English (🇬🇧).
 * Features:
 * - Sliding indicator animation (iOS/macOS style)
 * - Light theme integration (matches new AgriMax UI)
 * - Smooth color & shadow transitions
 * - Updates UI text direction, Zustand store, and triggers Speech Synthesis
 */
export function LanguageToggle({ className = '' }) {
  const { language, setLanguage } = useAppStore();
  const { speak } = useSpeech();

  const handleToggle = (lang) => {
    if (lang === language) return;
    setLanguage(lang);
    if (lang === 'ur') {
      speak('اردو منتخب ہو گئی', 'ur');
    } else {
      speak('English selected', 'en');
    }
  };

  return (
    <div
      className={`relative inline-flex items-center p-1 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200 shadow-inner w-fit ${className}`}
      role="group"
      aria-label="Language selection"
    >
      {/* Animated Sliding Background */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white border border-slate-200/80 rounded-full shadow-sm transition-all duration-300 ease-out z-0 ${
          language === 'ur' ? 'left-1' : 'left-[calc(50%+2px)]'
        }`}
      />

      {/* Urdu Button */}
      <button
        type="button"
        onClick={() => handleToggle('ur')}
        className={`relative z-10 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 cursor-pointer w-1/2 min-w-[80px] sm:min-w-[95px] ${
          language === 'ur'
            ? 'text-emerald-700'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        aria-pressed={language === 'ur'}
      >
        <span className="text-sm select-none">🇵🇰</span>
        <span className="urdu-text tracking-wide mt-0.5">اردو</span>
      </button>

      {/* English Button */}
      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`relative z-10 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 cursor-pointer w-1/2 min-w-[80px] sm:min-w-[95px] ${
          language === 'en'
            ? 'text-emerald-700'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        aria-pressed={language === 'en'}
      >
        <span className="text-sm select-none">🇬🇧</span>
        <span>English</span>
      </button>
    </div>
  );
}

export default LanguageToggle;