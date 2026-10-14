import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/useChatStore';
import useVoice from '../hooks/useVoice';
import HeroSection from '../components/dashboard/HeroSection';
import AIChatPanel from '../components/AIChatPanel';
import MarketPriceWidget from '../components/dashboard/MarketPriceWidget';
import QuickActions from '../components/dashboard/QuickActions';
import FarmerGrowthCard from '../components/dashboard/FarmerGrowthCard';
import FeatureStrip from '../components/dashboard/FeatureStrip';

export function HomePage() {
  const navigate = useNavigate();
  const {
    language,
    isRecording,
    isProcessing,
    awaitingOtp,
    pendingPhone,
  } = useChatStore();

  const { startRecording, stopAndProcessAudio } = useVoice();

  const handleStartVoice = async () => {
    if (isProcessing) return;
    if (isRecording) {
      const hint = language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined;
      await stopAndProcessAudio(hint);
    } else {
      await startRecording();
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-6 animate-fade-up w-full min-w-0">
      {/* ── Multi-turn OTP Alert Banner ── */}
      {awaitingOtp && (
        <div className="bg-[#FEF3C7] border border-[#FCD34D] p-4 rounded-2xl flex items-center justify-between shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <p className="text-[#92400E] font-bold text-sm sm:text-base">
                {language === 'ur'
                  ? 'لاگ ان کے لیے مائیک دبا کر OTP بولیں یا چیٹ میں لکھیں'
                  : 'Speak or type your OTP below to complete login'}
              </p>
              <p className="text-[#B45309] text-xs">
                {pendingPhone
                  ? `${language === 'ur' ? 'فون نمبر:' : 'Phone:'} ${pendingPhone}`
                  : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartVoice}
            className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            {language === 'ur' ? 'OTP بولیں 🎤' : 'Speak OTP 🎤'}
          </button>
        </div>
      )}

      {/* ── Main Dashboard Workspace ──
          At ultra-wide widths (>=1536px), layout supports 2 tracks (Main + Side cards).
          At standard desktop widths (1200–1440px, e.g. 1280x720, 1366x768), information cards move below the chat
          to guarantee that both the Hero and the AI Assistant have ample, un-cramped width.
      ── */}
      <div className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start w-full">
        {/* ── Primary Column: 1. Hero Banner + 2. AI Assistant Panel ── */}
        <div className="flex flex-col gap-6 min-w-0 w-full">
          {/* 1. Hero Banner */}
          <HeroSection onStartVoiceChat={handleStartVoice} />

          {/* 2. AI Assistant Panel */}
          <AIChatPanel />

          {/* On standard widths (<1536px), show the information cards right below the main workspace */}
          <div className="2xl:hidden flex flex-col gap-6 w-full pt-1">
            {/* 3. Market Price and Quick Actions (2-column grid at standard desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <MarketPriceWidget onSelectCrop={() => navigate('/prices')} />
              <QuickActions onStartVoice={handleStartVoice} />
            </div>

            {/* 4. Farmer Growth Promotional Card */}
            <FarmerGrowthCard />
          </div>
        </div>

        {/* ── Secondary Column (visible at >=1536px wide desktop): 3. Market Info + Quick Actions + 4. Growth Card ── */}
        <div className="hidden 2xl:flex flex-col gap-5 min-w-0 w-full sticky top-24">
          {/* 3. Market Price Information */}
          <MarketPriceWidget onSelectCrop={() => navigate('/prices')} />

          {/* Quick Actions */}
          <QuickActions onStartVoice={handleStartVoice} />

          {/* 4. Farmer Growth Card */}
          <FarmerGrowthCard />
        </div>
      </div>

      {/* ── Supporting Information Strip (5 Platform Pillars) ── */}
      <FeatureStrip />
    </div>
  );
}

export default HomePage;
