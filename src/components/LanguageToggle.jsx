import useAppStore from '../store/useAppStore';
import useSpeech from '../hooks/useSpeech';

/**
 * LanguageToggle — Switches between Urdu (🇵🇰) and English (🇬🇧).
 * Updates UI text direction, active language in Zustand store, and speech synthesis.
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
      className={`inline-flex items-center p-1 rounded-full bg-slate-800 border border-slate-700/80 shadow-inner ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => handleToggle('ur')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          language === 'ur'
            ? 'bg-green-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
        }`}
        aria-pressed={language === 'ur'}
      >
        <span>🇵🇰</span>
        <span className="urdu-text font-bold">اردو</span>
      </button>

      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          language === 'en'
            ? 'bg-green-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
        }`}
        aria-pressed={language === 'en'}
      >
        <span>🇬🇧</span>
        <span>English</span>
      </button>
    </div>
  );
}

export default LanguageToggle;
