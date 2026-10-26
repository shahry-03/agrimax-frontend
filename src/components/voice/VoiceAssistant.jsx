import { HiMicrophone, HiStop, HiXMark, HiOutlineSparkles } from 'react-icons/hi2';
import useVoice from '../../hooks/useVoice';
import useAppStore from '../../store/useAppStore';
import useChatStore from '../../store/useChatStore';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoiceAssistant() {
  const { startRecording, stopAndProcessAudio, cancelRecording } = useVoice();
  const { isRecording, recordingDuration, isProcessing, language } = useAppStore();
  const { setOpen: setChatOpen } = useChatStore();

  const showOverlay = isRecording || isProcessing;

  const handleToggle = async () => {
    if (isProcessing) return;
    setChatOpen(true);
    if (isRecording) {
      const hint = language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined;
      await stopAndProcessAudio(hint);
    } else {
      await startRecording();
    }
  };

  return (
    <>
      {/* ── Premium Glassmorphic Overlay (Recording / Processing) ── */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Dark Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
            onClick={() => !isProcessing && cancelRecording()}
          />

          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-8 shadow-2xl shadow-emerald-900/20 animate-scale-up flex flex-col items-center text-center">
            
            {/* Close Button */}
            <button
              onClick={cancelRecording}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100/50 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Close voice recording"
            >
              <HiXMark className="text-xl" />
            </button>

            {/* Premium Audio Visualizer */}
            <div className="flex items-end justify-center gap-1.5 h-16 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                      : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  }`}
                  style={{
                    height: isRecording 
                      ? `${Math.random() * 100}%` // Randomized height for realistic effect
                      : '20%',
                    animation: isRecording 
                      ? `wave-pulse 1s ease-in-out infinite alternate` 
                      : isProcessing ? `wave-pulse 1.5s ease-in-out infinite alternate` : 'none',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            {/* State Text & Timer */}
            {isRecording ? (
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-bold mb-3 border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {language === 'ur' ? 'ریکارڈنگ جاری ہے' : 'Recording'}
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-red-100 shadow-sm">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
                <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                  {language === 'ur'
                    ? 'بات مکمل ہونے پر مائیکروفون کا بٹن دوبارہ دبائیں'
                    : 'Tap the microphone button again when you finish speaking'}
                </p>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
                <p className="text-emerald-800 text-base font-bold mb-1">
                  {language === 'ur' ? 'آواز کا تجزیہ ہو رہا ہے...' : 'Analyzing voice...'}
                </p>
                <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <HiOutlineSparkles className="text-amber-500 animate-pulse" />
                  {language === 'ur' ? 'ایگری میکس آپ کی بات سمجھ رہا ہے' : 'AgriMax is understanding your query'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Advanced Floating "Talk to AgriMax" Pill ── */}
      <div className="fixed bottom-24 lg:bottom-8 right-4 sm:right-6 lg:right-8 z-[90] group">
        
        {/* Breathing Glow Effect behind the button (Idle State only) */}
        {!isRecording && !isProcessing && (
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 animate-pulse transition-opacity duration-500" />
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={isProcessing}
          aria-label="Talk to AgriMax voice assistant"
          className={`relative overflow-hidden transition-all duration-300 cursor-pointer select-none flex items-center gap-3 rounded-full shadow-2xl ${
            isRecording
              ? 'h-14 sm:h-16 pl-2 pr-5 sm:pr-6 bg-gradient-to-r from-red-600 to-red-700 border border-red-500 ring-4 ring-red-500/30 scale-105'
              : isProcessing
              ? 'h-14 sm:h-16 pl-2 pr-5 sm:pr-6 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 cursor-wait opacity-90 shadow-amber-500/20'
              : 'h-14 sm:h-16 pl-2 pr-5 sm:pr-6 bg-gradient-to-r from-[#065F38] to-[#0B854D] hover:from-[#054E2E] hover:to-[#096B3E] border border-emerald-400/30 hover:scale-105 active:scale-95 shadow-emerald-900/30'
          }`}
        >
          {/* Shimmer effect on hover */}
          {!isRecording && !isProcessing && (
             <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}

          {/* Icon Container */}
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner ${
              isRecording
                ? 'bg-red-500/30'
                : isProcessing
                ? 'bg-amber-400/30'
                : 'bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors'
            }`}
          >
            {isRecording ? (
              <HiStop className="text-xl sm:text-2xl animate-pulse" />
            ) : isProcessing ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <HiMicrophone className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300" />
            )}
          </div>

          {/* Text Label */}
          <div className="flex flex-col items-start justify-center">
            <span className="text-[13px] sm:text-[15px] font-bold text-white tracking-wide whitespace-nowrap">
              {isRecording
                ? `${language === 'ur' ? 'ریکارڈنگ' : 'Recording'} (${formatDuration(recordingDuration)})`
                : isProcessing
                ? language === 'ur' ? 'پروسیسنگ...' : 'Processing...'
                : language === 'ur' ? 'ایگری میکس سے بولیں' : 'Talk to AgriMax'}
            </span>
            
            {/* Live audio indicator text */}
            <span className="text-[10px] font-medium text-emerald-200/80 whitespace-nowrap flex items-center gap-1">
              {isRecording ? (
                 language === 'ur' ? 'بند کرنے کے لیے دبائیں' : 'Tap to stop'
              ) : isProcessing ? (
                language === 'ur' ? 'براہ کرم انتظار کریں' : 'Please wait'
              ) : (
                <>
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                 {language === 'ur' ? 'مائیک کھلا ہے' : 'Mic is ready'}
                </>
              )}
            </span>
          </div>
          
          {/* Equalizer Bars (Idle state) */}
          {!isRecording && !isProcessing && (
            <div className="flex items-center gap-0.5 h-4 ml-1 select-none" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span 
                  key={i}
                  className="w-1 bg-emerald-300/80 rounded-full animate-eq" 
                  style={{ animationDelay: `${i * 0.15}s` }} 
                />
              ))}
            </div>
          )}
        </button>
      </div>

      {/* Custom keyframes for visualizer and equalizer (Inject into index.css if not present) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave-pulse {
          0% { height: 15%; opacity: 0.7; }
          100% { height: 100%; opacity: 1; }
        }
        @keyframes eq-bounce {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-eq {
          animation: eq-bounce 1s ease-in-out infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}} />
    </>
  );
}