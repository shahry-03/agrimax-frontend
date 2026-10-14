import { HiMicrophone, HiStop, HiXMark } from 'react-icons/hi2';
import useVoice from '../../hooks/useVoice';
import useAppStore from '../../store/useAppStore';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * VoiceAssistant — Floating quick assistant component with overlay.
 */
export default function VoiceAssistant() {
  const { startRecording, stopAndProcessAudio, cancelRecording } = useVoice();
  const {
    isRecording,
    recordingDuration,
    isProcessing,
    language,
  } = useAppStore();

  const showOverlay = isRecording || isProcessing;

  const handleToggle = () => {
    if (isProcessing) return;
    if (isRecording) {
      stopAndProcessAudio();
    } else {
      startRecording();
    }
  };

  return (
    <>
      {/* ── Overlay when recording or transcribing ── */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end justify-center pb-28">
          <div className="bg-slate-800 border border-slate-700 p-5 mx-4 w-full max-w-md rounded-3xl shadow-2xl animate-fade-up relative">
            <button
              onClick={cancelRecording}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <HiXMark className="text-xl" />
            </button>

            <div className="text-center my-4">
              <div className="flex items-center justify-center gap-1.5 h-12 mb-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-amber-400 animate-bounce'
                    }`}
                    style={{
                      height: '100%',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>

              {isRecording ? (
                <>
                  <p className="text-red-400 text-lg font-bold urdu-text">
                    🎤 ریکارڈنگ جاری ہے... ({formatDuration(recordingDuration)})
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {language === 'ur'
                      ? 'بات مکمل کرنے کے لیے نیچے والا بٹن دوبارہ دبائیں'
                      : 'Tap button again when done speaking'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-amber-400 text-lg font-bold urdu-text">
                    ⏳ سوچ رہا ہوں (Whisper)...
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {language === 'ur' ? 'آواز کا تجزیہ ہو رہا ہے...' : 'Transcribing voice input...'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-2xl transition-all cursor-pointer ${
          isRecording
            ? 'bg-red-600 animate-pulse scale-105 shadow-red-900/60'
            : isProcessing
            ? 'bg-amber-600 cursor-not-allowed opacity-80'
            : 'bg-green-600 hover:bg-green-500 shadow-green-900/50'
        }`}
        aria-label="Voice input"
      >
        {isRecording ? <HiStop /> : <HiMicrophone />}
      </button>
    </>
  );
}

