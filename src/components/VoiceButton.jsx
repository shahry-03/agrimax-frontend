import { HiMicrophone, HiStop } from 'react-icons/hi2';
import useChatStore from '../store/useChatStore';

/**
 * Format elapsed seconds as "M:SS" (e.g. "0:05")
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * VoiceButton — Premium Industry-Standard Microphone Button.
 * Features: Smooth pulse animations, dynamic states (Recording, Processing, Idle), and Timer.
 */
export function VoiceButton({
  onStart,
  onStop,
  isRecording: propIsRecording,
  disabled = false,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const {
    isRecording: storeIsRecording,
    recordingDuration,
    isProcessing,
    language,
  } = useChatStore();

  const activeRecording = propIsRecording !== undefined ? propIsRecording : storeIsRecording;

  const handleClick = () => {
    if (disabled || isProcessing) return;
    if (activeRecording) {
      if (onStop) onStop();
    } else {
      if (onStart) onStart();
    }
  };

  // Dimensions based on size prop - mobile-safe touch targets
  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] sm:min-w-[44px]',
    md: 'w-12 h-12 sm:w-14 sm:h-14 min-w-[48px] sm:min-w-[56px]',
    lg: 'w-16 h-16 sm:w-20 sm:h-20 min-w-[64px] sm:min-w-[80px]',
  }[size];

  const pulseSize1 = { sm: 'w-14 h-14', md: 'w-20 h-20', lg: 'w-28 h-28' }[size];
  const pulseSize2 = { sm: 'w-18 h-18', md: 'w-24 h-24', lg: 'w-32 h-32' }[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Recording Pulse Rings */}
      {activeRecording && (
        <>
          <span className={`absolute ${pulseSize1} rounded-full bg-red-500/20 animate-ping pointer-events-none`} style={{ animationDuration: '1.5s' }} />
          <span className={`absolute ${pulseSize2} rounded-full bg-red-500/10 animate-pulse pointer-events-none`} style={{ animationDuration: '2s' }} />
        </>
      )}

      {/* Main Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        aria-label={
          activeRecording
            ? language === 'ur' ? 'ریکارڈنگ بند کریں' : 'Stop recording'
            : language === 'ur' ? 'بولنے کے لیے دبائیں' : 'Press to speak'
        }
        className={`relative z-10 ${sizeClasses} rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-offset-2 ${
          activeRecording
            ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500/30 shadow-red-500/30 scale-105'
            : isProcessing
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 cursor-wait opacity-90 shadow-amber-500/30 focus:ring-amber-500/30'
            : 'bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 focus:ring-emerald-500/30 shadow-emerald-500/30 hover:-translate-y-0.5'
        }`}
      >
        {activeRecording ? (
          <div className="flex flex-col items-center justify-center">
            <HiStop className={`${size === 'sm' ? 'text-lg' : 'text-2xl'} animate-pulse`} />
            <span className="text-[9px] font-mono font-bold tracking-wider text-white/90 mt-0.5">
              {formatDuration(recordingDuration)}
            </span>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-white/30 border-t-white rounded-full animate-spin`} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <HiMicrophone className={`${size === 'sm' ? 'text-lg' : 'text-2xl'} group-hover:scale-110 transition-transform`} />
            {size !== 'sm' && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-50 opacity-90 leading-tight mt-0.5">
                {language === 'ur' ? 'بولیں' : 'Speak'}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

export default VoiceButton;