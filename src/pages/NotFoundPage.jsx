import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiOutlineHome,
  HiOutlineArrowUturnLeft,
  HiOutlineMicrophone,
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineWallet,
  HiOutlineUser,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import useAppStore from '../store/useAppStore';

// Quick link suggestions for recovery
const QUICK_LINKS = [
  { path: '/', icon: HiOutlineHome, labelEn: 'Dashboard', labelUr: 'ڈیش بورڈ' },
  { path: '/marketplace', icon: HiOutlineShoppingBag, labelEn: 'Marketplace', labelUr: 'مارکیٹ' },
  { path: '/prices', icon: HiOutlineChartBar, labelEn: 'Mandi Rates', labelUr: 'منڈی ریٹس' },
  { path: '/wallet', icon: HiOutlineWallet, labelEn: 'Wallet', labelUr: 'والیٹ' },
  { path: '/profile', icon: HiOutlineUser, labelEn: 'Profile', labelUr: 'پروفائل' },
];

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAppStore(
    useShallow((s) => ({ language: s.language }))
  );
  const isUrdu = language === 'ur';

  const [canGoBack] = useState(() => window.history.length > 2);
  const [countdown, setCountdown] = useState(30);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);

  // Auto-redirect countdown (pauses on hover/interaction)
  useEffect(() => {
    if (autoRedirectPaused) return;
    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, autoRedirectPaused, navigate]);

  const handleGoHome = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    if (canGoBack) navigate(-1);
    else navigate('/', { replace: true });
  }, [canGoBack, navigate]);

  const handleVoiceAssist = useCallback(() => {
    // Navigate home with auto command to open chat
    navigate('/', {
      state: {
        autoVoiceCommand: isUrdu ? 'مجھے مدد چاہیے' : 'I need help',
      },
    });
    toast.success(
      isUrdu ? 'واپس ڈیش بورڈ پر — چیٹ کھل رہا ہے' : 'Back to dashboard — opening chat',
      { icon: '🌾', id: 'nf-voice-toast' }
    );
  }, [navigate, isUrdu]);

  const handleRetry = useCallback(() => {
    toast.promise(
      new Promise((res) => setTimeout(res, 800)),
      {
        loading: isUrdu ? 'دوبارہ کوشش...' : 'Retrying...',
        success: isUrdu ? 'لوڈ ہو گیا!' : 'Reloaded!',
        error: isUrdu ? 'ناکام' : 'Failed',
      },
      { id: 'nf-retry' }
    ).then(() => {
      window.location.reload();
    });
  }, [isUrdu]);

  // Extract attempted path for display
  const attemptedPath = location.pathname.length > 1
    ? location.pathname
    : '/unknown';

  return (
    <main
      role="main"
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 relative overflow-hidden"
      onMouseEnter={() => setAutoRedirectPaused(true)}
      onMouseLeave={() => setAutoRedirectPaused(false)}
    >
      {/* ═══════════════ DECORATIVE BACKGROUND ═══════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large blurred blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        
        {/* Floating leaves (motion-safe) */}
        <div className="motion-safe:animate-float-slow absolute top-[15%] left-[10%] text-4xl opacity-20 select-none">🌿</div>
        <div className="motion-safe:animate-float-slow absolute top-[25%] right-[15%] text-3xl opacity-15 select-none" style={{ animationDelay: '1s' }}>🌾</div>
        <div className="motion-safe:animate-float-slow absolute bottom-[20%] left-[20%] text-3xl opacity-15 select-none" style={{ animationDelay: '2s' }}>🍃</div>
        <div className="motion-safe:animate-float-slow absolute bottom-[30%] right-[10%] text-2xl opacity-20 select-none" style={{ animationDelay: '1.5s' }}>🌱</div>
      </div>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 motion-safe:animate-fade-up">

        {/* ── Icon with Pulses ── */}
        <div className="relative inline-flex items-center justify-center">
          {/* Pulse rings */}
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-emerald-400/20 animate-ping motion-safe:opacity-100 opacity-0" />
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-emerald-400/10 animate-pulse" style={{ animationDuration: '2s' }} />
          
          {/* Main icon container */}
          <div className="relative w-28 h-28 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-500/30 flex items-center justify-center">
            <span className="text-5xl select-none">🌾</span>
          </div>
        </div>

        {/* ── 404 Heading ── */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {isUrdu ? 'صفحہ نہیں ملا' : 'Page Not Found'}
          </div>
          
          <h1 className="text-7xl sm:text-8xl font-black text-slate-800 tracking-tighter leading-none">
            <span className="text-emerald-600">4</span>
            <span className="text-slate-300">0</span>
            <span className="text-emerald-600">4</span>
          </h1>
          
          <h2 className={`text-xl sm:text-2xl font-bold text-slate-700 ${isUrdu ? 'urdu-text' : ''}`}>
            {isUrdu ? 'یہ صفحہ موجود نہیں ہے' : "This page doesn't exist"}
          </h2>
          
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {isUrdu
              ? 'شاید آپ نے غلط ایڈریس ٹائپ کیا ہے، یا یہ صفحہ منتقل ہو گیا ہے۔'
              : "The URL you followed may be broken, or the page may have been moved."}
          </p>
        </div>

        {/* ── Attempted Path (Technical Info) ── */}
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg max-w-full overflow-hidden">
          <HiOutlineMagnifyingGlass className="text-slate-400 text-sm shrink-0" />
          <code className="text-xs font-mono text-slate-600 truncate" dir="ltr">
            {attemptedPath}
          </code>
        </div>

        {/* ── Primary Action Buttons ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoHome}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
          >
            <HiOutlineHome className="text-lg group-hover:scale-110 transition-transform" />
            <span>{isUrdu ? 'ڈیش بورڈ پر جائیں' : 'Go to Dashboard'}</span>
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border-2 border-slate-200 hover:border-emerald-200 hover:text-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <HiOutlineArrowUturnLeft className="text-lg rtl:rotate-180" />
            <span>{isUrdu ? 'واپس جائیں' : 'Go Back'}</span>
          </button>
        </div>

        {/* ── Voice Assist CTA (USP Highlight) ── */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <HiOutlineMicrophone className="text-emerald-600 text-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">
                {isUrdu ? 'یا صرف بول کر پوچھیں' : 'Or just ask by voice'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isUrdu ? '"مجھے مدد چاہیے" بولیں' : 'Say "I need help"'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleVoiceAssist}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            {isUrdu ? '🎤 آواز سے مدد' : '🎤 Voice Help'}
          </button>
        </div>

        {/* ── Quick Links Grid ── */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            {isUrdu ? 'مقبول صفحات' : 'Popular Pages'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              const label = isUrdu ? link.labelUr : link.labelEn;
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-500 flex items-center justify-center transition-all">
                    <Icon className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-emerald-700 transition-colors text-center leading-tight">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Retry + Auto Redirect ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <HiOutlineArrowPath className="text-sm" />
            {isUrdu ? 'صفحہ ری لوڈ کریں' : 'Reload page'}
          </button>

          <span className="hidden sm:inline text-slate-300">•</span>

          <p className="text-[11px] text-slate-400 font-medium">
            {autoRedirectPaused
              ? (isUrdu ? 'خودکار واپسی روکی گئی' : 'Auto-redirect paused')
              : isUrdu
              ? `${countdown} سیکنڈ میں خودکار واپسی...`
              : `Redirecting in ${countdown}s...`}
          </p>
        </div>

      </div>

      {/* ═══════════════ FOOTER HINT ═══════════════ */}
      <p className="relative z-10 text-[10px] text-slate-300 mt-12 font-medium">
        {isUrdu
          ? 'اگر آپ کو یقین ہے کہ یہ غلطی ہے، تو سپورٹ سے رابطہ کریں۔'
          : "If you're sure this is a mistake, contact support."}
      </p>
    </main>
  );
}