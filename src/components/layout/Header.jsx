import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HiGlobeAlt,
  HiChevronDown,
  HiChevronRight,
  HiUser,
  HiArrowRightOnRectangle,
  HiWallet,
  HiCog6Tooth,
  HiCheck,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';
import useSpeech from '../../hooks/useSpeech';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, language, setLanguage, logout } = useAppStore();
  const { speak } = useSpeech();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setLangMenuOpen(false);
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const displayName = user?.name || (language === 'ur' ? 'کسان بھائی' : 'Farmer');
  const userPhone = user?.phone || '03001234567';
  const isVerified = Boolean(user?.isVerified || user?.verified);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300">
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between min-w-0">
        
        {/* ── Brand Logo ── */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/');
          }}
          aria-label="AgriMax Home"
        >
          <div className="relative">
            <svg
              className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 select-none group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M18.8 4.2C12.2 5.5 7.1 11.5 6.2 18.8C5.5 25.8 9.5 31.5 17.8 31.8C19.8 31.9 21.5 31.3 22.8 30.2C20.8 25.8 21.5 20.2 24.8 15.2C27.8 10.8 24 3.8 18.8 4.2Z"
                fill="#059669" /* Slightly brighter emerald */
              />
              <path
                d="M11.2 26.5C14.5 22.8 18.2 18.2 22 15.2"
                stroke="#047857"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M28.5 9.8C23.8 10.8 20.8 15 20.5 19.5C20 24.2 22.5 27.8 27.5 28C28.8 28 30 27.6 30.8 26.8C29.2 23.5 29.8 19.2 32.2 15.8C34.2 12.5 31.8 9.5 28.5 9.8Z"
                fill="#10B981"
              />
            </svg>
          </div>
          <span className="text-2xl sm:text-[26px] font-black tracking-tighter leading-none block">
            <span className="text-emerald-700">Agri</span>
            <span className="text-slate-800">Max</span>
          </span>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setUserMenuOpen(false);
              }}
              className={`h-10 px-3 sm:px-4 rounded-full flex items-center gap-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                langMenuOpen 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
              aria-label="Select language"
              aria-expanded={langMenuOpen}
              aria-haspopup="menu"
            >
              <HiGlobeAlt className={`text-base sm:text-lg shrink-0 ${langMenuOpen ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline-block">
                {language === 'ur' ? 'اردو' : 'English'}
              </span>
              <span className="sm:hidden">
                {language === 'ur' ? 'اردو' : 'EN'}
              </span>
              <HiChevronDown
                className={`text-xs shrink-0 transition-transform duration-300 ${
                  langMenuOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Language Dropdown */}
            {langMenuOpen && (
              <div
                role="menu"
                className="absolute end-0 mt-3 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 py-2 z-50 animate-fade-up origin-top-right"
              >
                <div className="px-3 pb-2 mb-1 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {language === 'ur' ? 'زبان منتخب کریں' : 'Select Language'}
                  </p>
                </div>
                
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className={`w-full px-3 py-2.5 mx-1 my-0.5 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer w-[calc(100%-8px)] ${
                    language === 'en'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-600 font-medium hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                  </span>
                  {language === 'en' && <HiCheck className="text-base text-emerald-600" />}
                </button>

                <button
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelectLanguage('ur')}
                  className={`w-full px-3 py-2.5 mx-1 my-0.5 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer w-[calc(100%-8px)] ${
                    language === 'ur'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-600 font-medium hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">🇵🇰</span>
                    <span className="urdu-text font-bold">اردو</span>
                  </span>
                  {language === 'ur' && <HiCheck className="text-base text-emerald-600" />}
                </button>
              </div>
            )}
          </div>

          {/* User Account / Sign In */}
          {isAuthenticated ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setLangMenuOpen(false);
                }}
                className={`h-10 pl-1.5 pr-2 sm:pr-3 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  userMenuOpen
                    ? 'bg-emerald-50 border border-emerald-200 shadow-inner'
                    : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
                aria-label="Farmer account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                {/* Avatar with Status Ring */}
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300 flex items-center justify-center text-sm shadow-sm shrink-0 overflow-hidden">
                    👨‍🌾
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                
                <span className="hidden sm:inline-block max-w-[100px] truncate text-slate-700 font-bold leading-none">
                  {displayName}
                </span>
                <HiChevronDown
                  className={`text-xs text-slate-400 transition-transform duration-300 ${
                    userMenuOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 mt-3 w-[300px] sm:w-[340px] max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-300/40 z-50 animate-fade-up overflow-hidden"
                >
                  {/* Profile Header Block */}
                  <div className="bg-slate-50/80 p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      👨‍🌾
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-extrabold text-slate-900 leading-tight truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate font-medium" dir="ltr">
                        {userPhone}
                      </p>
                      {isVerified && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/50 text-emerald-700 text-[10px] font-bold border border-emerald-200/50">
                          <HiOutlineShieldCheck className="text-xs" />
                          <span>{language === 'ur' ? 'تصدیق شدہ' : 'Verified'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        location.pathname === '/profile' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <HiUser className={`text-lg ${location.pathname === '/profile' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{language === 'ur' ? 'میری پروفائل' : 'My Profile'}</span>
                      </span>
                      <HiChevronRight className={`text-base ${location.pathname === '/profile' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/wallet'); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        location.pathname === '/wallet' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <HiWallet className={`text-lg ${location.pathname === '/wallet' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{language === 'ur' ? 'ڈیجیٹل والیٹ' : 'Digital Wallet'}</span>
                      </span>
                      <HiChevronRight className={`text-base ${location.pathname === '/wallet' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        location.pathname === '/settings' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <HiCog6Tooth className={`text-lg ${location.pathname === '/settings' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{language === 'ur' ? 'سیٹنگز' : 'Settings'}</span>
                      </span>
                      <HiChevronRight className={`text-base ${location.pathname === '/settings' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); navigate('/'); }}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold text-sm transition-all cursor-pointer group"
                    >
                      <HiArrowRightOnRectangle className="text-lg shrink-0 group-hover:-translate-x-1 transition-transform" />
                      <span>{language === 'ur' ? 'لاگ آؤٹ کریں' : 'Sign out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="h-10 px-4 sm:px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2 shrink-0 select-none active:scale-95 group"
            >
              <HiUser className="text-base sm:text-lg shrink-0 group-hover:scale-110 transition-transform" />
              <span>{language === 'ur' ? 'لاگ ان کریں' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}