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
 * VoiceButton — Circular voice interaction button with pulsing animation,
 * elapsed recording timer, and disabled loading state.
 */
export function VoiceButton({
  onStart,
  onStop,
  isRecording: propIsRecording,
  disabled = false,
  className = '',
  size = 'md', // 'sm' (48px) | 'md' (64px) | 'lg' (80px)
}) {
  const {
    isRecording: storeIsRecording,
    recordingDuration,
    isProcessing,
    language,
  } = useChatStore();

  const activeRecording =
    propIsRecording !== undefined ? propIsRecording : storeIsRecording;

  const handleClick = () => {
    if (disabled || isProcessing) return;
    if (activeRecording) {
      if (onStop) onStop();
    } else {
      if (onStart) onStart();
    }
  };

  // Dimensions based on size prop
  const sizeClasses =
    size === 'sm'
      ? 'w-12 h-12 min-w-[48px] min-h-[48px]'
      : size === 'lg'
      ? 'w-20 h-20 min-w-[80px] min-h-[80px]'
      : 'w-16 h-16 min-w-[64px] min-h-[64px]';

  const pulseSize1 =
    size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-28 h-28' : 'w-24 h-24';
  const pulseSize2 =
    size === 'sm' ? 'w-20 h-20' : size === 'lg' ? 'w-36 h-36' : 'w-28 h-28';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Concentric Animated Pulse Rings when recording */}
      {activeRecording && (
        <>
          <span className={`absolute ${pulseSize1} rounded-full bg-red-500/25 animate-ping pointer-events-none`} />
          <span className={`absolute ${pulseSize2} rounded-full bg-red-600/15 animate-pulse pointer-events-none`} />
        </>
      )}

      {/* Main Mic Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        aria-label={
          activeRecording
            ? language === 'ur'
              ? 'ریکارڈنگ بند کریں'
              : 'Stop recording'
            : language === 'ur'
            ? 'بولنے کے لیے دبائیں'
            : 'Press to speak'
        }
        className={`relative z-10 ${sizeClasses} rounded-full flex flex-col items-center justify-center text-white shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer select-none ${
          activeRecording
            ? 'bg-red-600 hover:bg-red-500 ring-4 ring-red-400/40 scale-105 shadow-red-900/40'
            : isProcessing
            ? 'bg-amber-600 ring-4 ring-amber-400/30 cursor-wait opacity-90'
            : 'bg-[#078747] hover:bg-[#056B3B] hover:scale-105 ring-4 ring-green-600/20 shadow-green-900/30'
        }`}
      >
        {activeRecording ? (
          <div className="flex flex-col items-center justify-center">
            <span className={size === 'sm' ? 'text-sm animate-pulse' : 'text-lg animate-pulse'}>⏹️</span>
            <span className="text-[10px] font-mono font-bold tracking-tight text-red-100">
              {formatDuration(recordingDuration)}
            </span>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className={size === 'sm' ? 'text-xl' : 'text-2xl'}>🎤</span>
            {size !== 'sm' && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-green-100 urdu-text leading-tight mt-0.5">
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
