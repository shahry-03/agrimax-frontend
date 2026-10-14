import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiGlobeAlt,
  HiChevronDown,
  HiUser,
  HiArrowRightOnRectangle,
  HiWallet,
  HiCog6Tooth,
} from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';
import useSpeech from '../../hooks/useSpeech';

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, language, setLanguage, logout } = useAppStore();
  const { speak } = useSpeech();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef(null);
  const userRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang) => {
    if (lang === language) {
      setLangMenuOpen(false);
      return;
    }
    setLanguage(lang);
    setLangMenuOpen(false);
    if (lang === 'ur') {
      speak('اردو منتخب ہو گئی', 'ur');
    } else {
      speak('English selected', 'en');
    }
  };

  const displayName = user?.name || (language === 'ur' ? 'کسان شاہریار' : 'Shahrayar Ali');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2EAF0] shadow-2xs">
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        {/* ── Brand Logo & Tagline (Left) ── */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
        {/* Leaf Logo Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#078747] to-[#22C55E] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-extrabold text-[#078747] tracking-tight leading-none">
              AgriMax
            </span>
          </div>
          <p className="text-[11px] text-[#62758A] font-medium tracking-wide mt-0.5">
            Voice • AI • Better Farming
          </p>
        </div>
      </div>

      {/* ── Right Actions: Language Selector & User Profile / Login ── */}
      <div className="flex items-center gap-3">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="h-10 px-3.5 bg-white hover:bg-[#F8FAFC] border border-[#E2EAF0] rounded-full flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#102A43] shadow-2xs hover:border-[#078747] transition cursor-pointer"
            aria-label="Select language"
            aria-expanded={langMenuOpen}
          >
            <HiGlobeAlt className="text-base text-[#62758A]" />
            <span>{language === 'ur' ? 'اردو' : 'English'}</span>
            <HiChevronDown
              className={`text-xs text-[#62758A] transition-transform ${
                langMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E2EAF0] rounded-2xl shadow-xl py-2 z-50 animate-fade-up">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`w-full px-4 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-[#F0F8F2] hover:text-[#078747] transition cursor-pointer ${
                  language === 'en'
                    ? 'font-bold text-[#078747] bg-[#F0F8F2]'
                    : 'text-[#102A43]'
                }`}
              >
                <span>🇬🇧 English</span>
                {language === 'en' && <span className="text-xs">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('ur')}
                className={`w-full px-4 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-[#F0F8F2] hover:text-[#078747] transition cursor-pointer ${
                  language === 'ur'
                    ? 'font-bold text-[#078747] bg-[#F0F8F2]'
                    : 'text-[#102A43]'
                }`}
              >
                <span className="urdu-text font-semibold">🇵🇰 اردو</span>
                {language === 'ur' && <span className="text-xs">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* User Profile Dropdown or Login Action */}
        {isAuthenticated ? (
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-10 pl-2 pr-3 bg-white hover:bg-[#F8FAFC] border border-[#E2EAF0] rounded-full flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#102A43] shadow-2xs hover:border-[#078747] transition cursor-pointer"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              {/* Green Avatar Circle with User Icon */}
              <div className="w-7 h-7 rounded-full bg-[#078747] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <HiUser className="text-sm" />
              </div>
              <span className="max-w-[110px] truncate text-slate-800 font-semibold">
                {displayName}
              </span>
              <HiChevronDown
                className={`text-xs text-[#62758A] transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E2EAF0] rounded-2xl shadow-xl py-2 z-50 animate-fade-up">
                <div className="px-4 py-2 border-b border-[#E2EAF0]">
                  <p className="text-xs font-bold text-[#102A43] truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-[#62758A] truncate">
                    {user?.phone || '03001234567'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-xs sm:text-sm text-[#102A43] hover:bg-[#F0F8F2] hover:text-[#078747] flex items-center gap-2.5 transition cursor-pointer"
                >
                  <HiUser className="text-base text-[#62758A]" />
                  <span>{language === 'ur' ? 'پروفائل' : 'Profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/wallet');
                  }}
                  className="w-full px-4 py-2 text-left text-xs sm:text-sm text-[#102A43] hover:bg-[#F0F8F2] hover:text-[#078747] flex items-center gap-2.5 transition cursor-pointer"
                >
                  <HiWallet className="text-base text-[#62758A]" />
                  <span>{language === 'ur' ? 'والیٹ' : 'Wallet'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-xs sm:text-sm text-[#102A43] hover:bg-[#F0F8F2] hover:text-[#078747] flex items-center gap-2.5 transition cursor-pointer"
                >
                  <HiCog6Tooth className="text-base text-[#62758A]" />
                  <span>{language === 'ur' ? 'سیٹنگز' : 'Settings'}</span>
                </button>

                <div className="border-t border-[#E2EAF0] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full px-4 py-2 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <HiArrowRightOnRectangle className="text-base text-red-500" />
                  <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-10 px-5 bg-[#056B3B] hover:bg-[#078747] text-white rounded-full text-xs sm:text-sm font-semibold shadow-xs transition hover:shadow-md cursor-pointer flex items-center gap-2"
          >
            <HiUser className="text-base" />
            <span>{language === 'ur' ? 'لاگ ان' : 'Login'}</span>
          </button>
        )}
      </div>
      </div>
    </header>
  );
}
