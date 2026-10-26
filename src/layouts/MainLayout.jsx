import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HiShoppingBag,
  HiChartBar,
  HiWallet,
  HiUser,
  HiMicrophone,
  HiHome,
  HiXMark,
} from 'react-icons/hi2';
import useChatStore from '../store/useChatStore';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AIChatPanel from '../components/AIChatPanel';
import VoiceAssistant from '../components/voice/VoiceAssistant';

const MOBILE_NAV_ITEMS = [
  { path: '/', icon: HiHome, labelUr: 'ہوم', labelEn: 'Home' },
  { path: '/marketplace', icon: HiShoppingBag, labelUr: 'مارکیٹ', labelEn: 'Market' },
  { path: '/prices', icon: HiChartBar, labelUr: 'قیمتیں', labelEn: 'Prices' },
  { path: '/wallet', icon: HiWallet, labelUr: 'والیٹ', labelEn: 'Wallet' },
  { path: '/profile', icon: HiUser, labelUr: 'پروفائل', labelEn: 'Profile' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isOpen, setOpen, isRecording, isProcessing } = useChatStore();
  const isHomePage = location.pathname === '/';

  // 1. Advanced Responsive State (using matchMedia for better performance)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = (e) => setIsMobile(e.matches);
    
    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 2. Sync document dir & lang with Zustand language state
  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // 3. Industry Standard: Body Scroll Lock when Drawer is Open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent layout shift when scrollbar disappears
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)'; 
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
    };
  }, [isOpen]);

  // Close drawer handler
  const handleCloseDrawer = useCallback(() => setOpen(false), [setOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white antialiased">
      
      {/* ── Global Top Header ── */}
      <Header />

      {/* ── Main Layout Body ── */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex lg:grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-10 w-full items-start">
          
          {/* Desktop Left Navigation Sidebar (Sticky) */}
          <div className="hidden lg:block shrink-0 w-[260px] sticky top-[72px] h-[calc(100vh-72px)] pt-6">
            <Sidebar />
          </div>

          {/* Flexible Main Workspace Outlet */}
          <main className="flex-1 min-w-0 py-6 lg:py-8 pb-28 lg:pb-12">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP DRAWER (Slide-over for Secondary Routes)
          ═══════════════════════════════════════════════════════════ */}
      {!isHomePage && isOpen && !isMobile && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            onClick={handleCloseDrawer}
          />

          {/* Slide-over Panel */}
          <div className="relative z-10 w-full sm:w-[450px] max-w-full h-full bg-white shadow-2xl animate-slide-left flex flex-col border-l border-slate-200">
            {/* Custom Close Button for Desktop Drawer */}
            <div className="absolute top-4 left-4 z-50">
              <button 
                onClick={handleCloseDrawer}
                className="p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full transition-colors backdrop-blur-md"
              >
                <HiXMark className="text-xl" />
              </button>
            </div>
            <AIChatPanel isDrawer onClose={handleCloseDrawer} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MOBILE DRAWER (Slide-up Bottom Sheet)
          ═══════════════════════════════════════════════════════════ */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            onClick={handleCloseDrawer}
          />

          {/* Bottom Sheet Panel */}
          <div className="relative z-10 w-full max-h-[90vh] bg-white rounded-t-[2rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col border-t border-slate-200">
            {/* iOS-Style Drag Handle */}
            <div className="w-full flex justify-center py-3 bg-white cursor-pointer" onClick={handleCloseDrawer}>
               <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <AIChatPanel isDrawer onClose={handleCloseDrawer} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR 
          ═══════════════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 h-16">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`text-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] font-semibold truncate max-w-full ${isActive ? 'font-bold' : ''}`}>
                  {language === 'ur' ? item.labelUr : item.labelEn}
                </span>
                {/* Active Dot */}
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-scale-in" />
                )}
              </button>
            );
          })}

          {/* Center Floating Voice Action Button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`relative flex items-center justify-center w-14 h-14 -mt-8 rounded-full shadow-lg shadow-emerald-600/30 transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 animate-pulse ring-4 ring-red-500/20' 
                : isProcessing 
                ? 'bg-amber-500 ring-4 ring-amber-500/20'
                : 'bg-gradient-to-br from-emerald-500 to-emerald-700 hover:scale-105 active:scale-95 ring-4 ring-white'
            }`}
          >
            <HiMicrophone className="text-2xl text-white" />
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          FLOATING VOICE ASSISTANT (Only on non-home pages & when drawer is closed)
          ═══════════════════════════════════════════════════════════ */}
      {!isHomePage && !isOpen && <VoiceAssistant />}
      
    </div>
  );
}

export default MainLayout;