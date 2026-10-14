import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HiShoppingBag,
  HiChartBar,
  HiWallet,
  HiUser,
} from 'react-icons/hi2';
import useChatStore from '../store/useChatStore';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AIChatPanel from '../components/AIChatPanel';

const MOBILE_NAV_ITEMS = [
  { path: '/', icon: null, labelUr: 'صوتی معاون', labelEn: 'Voice AI', isVoice: true },
  { path: '/marketplace', icon: HiShoppingBag, labelUr: 'مارکیٹ', labelEn: 'Market' },
  { path: '/prices', icon: HiChartBar, labelUr: 'قیمتیں', labelEn: 'Prices' },
  { path: '/wallet', icon: HiWallet, labelUr: 'والیٹ', labelEn: 'Wallet' },
  { path: '/profile', icon: HiUser, labelUr: 'پروفائل', labelEn: 'Profile' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isOpen, setOpen } = useChatStore();
  const isHomePage = location.pathname === '/';

  // Responsive state for mobile/tablet
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync document dir attribute with language
  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#102A43] flex flex-col font-sans selection:bg-[#078747] selection:text-white">
      {/* ── Global Top Header Spanning the Application ── */}
      <Header />

      {/* ── Main Layout Body: Fixed Left Sidebar (240px) + Flexible Main Workspace (minmax(0, 1fr)) ── */}
      <div className="flex-1 max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex lg:grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 w-full items-start">
          {/* Desktop Left Navigation Sidebar (240px, sticky top-24) */}
          <div className="hidden lg:block shrink-0 w-[240px] sticky top-24">
            <Sidebar />
          </div>

          {/* Flexible Main Workspace Outlet */}
          <main className="flex-1 min-w-0 py-4 sm:py-5 lg:py-6 pb-24 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── Persistent Slide-Over Drawer for Secondary Routes (/marketplace, /wallet, /prices, etc.) ──
          On HomePage, the AI Chat Panel is embedded directly in the visual hierarchy.
          On other pages, opening AI assistant slides out an overlay panel so the page grid is preserved.
      ── */}
      {!isHomePage && isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="relative z-10 w-full sm:w-[420px] max-w-full h-full bg-white shadow-2xl animate-slide-left">
            <AIChatPanel isDrawer onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Mobile Slide-Up Drawer (<1024px) for Voice Tab ── */}
      {isMobile && isHomePage && isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">
            <AIChatPanel isDrawer onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Bottom Mobile Navigation Bar (visible <1024px) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2EAF0] py-1.5 px-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path && !item.isVoice;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  if (item.isVoice) {
                    setOpen(true);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#078747] font-bold'
                    : 'text-[#62758A] hover:text-[#102A43]'
                }`}
              >
                {item.isVoice ? (
                  <div className="w-11 h-11 -mt-4 rounded-full flex items-center justify-center text-xl shadow-md transition-transform bg-[#078747] text-white ring-4 ring-white shadow-green-900/30">
                    <span>🎤</span>
                  </div>
                ) : (
                  <Icon className="text-xl" />
                )}

                <span className="text-[10px] mt-0.5 truncate max-w-[55px]">
                  {language === 'ur' ? item.labelUr : item.labelEn}
                </span>

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#078747] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default MainLayout;
