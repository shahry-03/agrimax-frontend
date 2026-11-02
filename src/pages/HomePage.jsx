import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import useChatStore from '../store/useChatStore';
import useVoice from '../hooks/useVoice';

// Components
import HeroSection from '../components/dashboard/HeroSection';
import QuickActions from '../components/dashboard/QuickActions';
import VoiceRobotAssistant from '../components/dashboard/VoiceRobotAssistant';
import MarketPriceWidget from '../components/dashboard/MarketPriceWidget';
import FarmerGrowthCard from '../components/dashboard/FarmerGrowthCard';
import FeatureStrip from '../components/dashboard/FeatureStrip';

import { HiOutlineShieldCheck, HiMicrophone } from 'react-icons/hi2';

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Store state (optimized with useShallow) ──
  const {
    language,
    isRecording,
    isProcessing,
    awaitingOtp,
    pendingPhone,
  } = useChatStore(
    useShallow((state) => ({
      language: state.language,
      isRecording: state.isRecording,
      isProcessing: state.isProcessing,
      awaitingOtp: state.awaitingOtp,
      pendingPhone: state.pendingPhone,
    }))
  );

  // ── Voice hook: SINGLE call, all handlers destructured once ──
  const { startRecording, stopAndProcessAudio, processCommand } = useVoice();

  const isUrdu = language === 'ur';

  // ── Consume auto-command from navigation state (fires exactly once) ──
  const hasConsumedAutoCmdRef = useRef(false);

  useEffect(() => {
    const cmd = location.state?.autoVoiceCommand;

    // Guard: no command, or already consumed
    if (!cmd || hasConsumedAutoCmdRef.current) return;

    // Mark consumed IMMEDIATELY (before async work)
    hasConsumedAutoCmdRef.current = true;

    // Fire-and-forget. Internal useVoice error handling surfaces to UI.
    processCommand(cmd).catch((err) => {
      console.error('[HomePage] Auto voice command failed:', err);
    });

    // Clear navigation state so a browser refresh doesn't re-trigger.
    // Use React Router's navigate (NOT history.replaceState — that breaks RR v7).
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, processCommand, navigate]);

  // ── Handlers (memoized) ──
  const handleStartVoice = useCallback(async () => {
    if (isProcessing) return;
    try {
      if (isRecording) {
        const hint = language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined;
        await stopAndProcessAudio(hint);
      } else {
        await startRecording();
      }
    } catch (err) {
      console.error('[HomePage] Voice action failed:', err);
    }
  }, [isProcessing, isRecording, language, stopAndProcessAudio, startRecording]);

  const handleActionQuery = useCallback(
    async (queryText) => {
      if (isProcessing || !queryText?.trim()) return;
      try {
        await processCommand(queryText.trim());
      } catch (err) {
        console.error('[HomePage] Action query failed:', err);
      }
    },
    [isProcessing, processCommand]
  );

  const handleSelectCrop = useCallback(() => {
    navigate('/prices');
  }, [navigate]);

  // ── Scroll to top on mount ──
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {
      /* ignore — some environments don't support scrollTo */
    }
  }, []);

  return (
    <div className="w-full min-w-0 pb-10" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* ── Multi-turn OTP Alert Banner ── */}
      {awaitingOtp && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm motion-safe:animate-fade-up relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 shadow-sm">
              <HiOutlineShieldCheck className="text-amber-600 text-xl animate-pulse" />
            </div>
            <div>
              <p className="text-amber-900 font-extrabold text-sm sm:text-base leading-tight">
                {isUrdu ? 'لاگ ان کی تصدیق باقی ہے' : 'Authentication Required'}
              </p>
              <p className="text-amber-700 text-xs sm:text-sm font-medium mt-1">
                {isUrdu
                  ? 'مائیک دبا کر اپنا OTP کوڈ بولیں یا چیٹ میں لکھیں۔'
                  : 'Speak or type your OTP below to complete secure login.'}
                {pendingPhone && (
                  <span className="block mt-0.5 font-mono text-amber-600" dir="ltr">
                    {pendingPhone}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartVoice}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 relative z-10 shrink-0"
          >
            <HiMicrophone className="text-base" />
            {isUrdu ? 'OTP بولیں' : 'Speak OTP'}
          </button>
        </div>
      )}

      {/* ── Main Dashboard Content (Staggered Animation) ── */}
      <div className="space-y-6 sm:space-y-8 w-full min-w-0">
        {/* 1. Hero Banner */}
        <div className="motion-safe:animate-fade-up">
          <HeroSection onStartVoiceChat={handleStartVoice} />
        </div>

        {/* 2. Quick Actions Grid */}
        <div className="motion-safe:animate-fade-up [animation-delay:100ms]">
          <QuickActions onActionQuery={handleActionQuery} />
        </div>

        {/* 3. Main Workspace: Voice Robot Assistant & Market Price Widget */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start w-full motion-safe:animate-fade-up [animation-delay:200ms]">
          <div className="xl:col-span-8 min-w-0 w-full">
            <VoiceRobotAssistant />
          </div>

          <div className="xl:col-span-4 min-w-0 w-full xl:sticky xl:top-24 space-y-6">
            <MarketPriceWidget onSelectCrop={handleSelectCrop} />
            <div className="hidden xl:block">
              <FarmerGrowthCard />
            </div>
          </div>
        </div>

        {/* 5. Platform Features Strip */}
        <div className="motion-safe:animate-fade-up [animation-delay:400ms]">
          <FeatureStrip />
        </div>
      </div>
    </div>
  );
}

export default HomePage;