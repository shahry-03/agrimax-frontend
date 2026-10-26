import { useState } from 'react';
import { HiMicrophone, HiPaperAirplane, HiStop, HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';
import useChatStore from '../../store/useChatStore';
import useVoice from '../../hooks/useVoice';

export default function CentralVoiceBar() {
  const { language } = useAppStore();
  const { isRecording, isProcessing, recordingDuration, error, setError } = useChatStore();
  const { startRecording, stopAndProcessAudio, processCommand } = useVoice();
  const [inputText, setInputText] = useState('');

  const handleMicClick = async () => {
    if (isProcessing) return;
    if (isRecording) {
      const hint = language === 'ur' ? 'ur' : language === 'en' ? 'en' : undefined;
      await stopAndProcessAudio(hint);
    } else {
      await startRecording();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const textToSend = inputText.trim();
    setInputText('');
    await processCommand(textToSend);
  };

  const handleChipClick = async (queryText) => {
    if (isProcessing || isRecording) return;
    await processCommand(queryText);
  };

  const examples = language === 'ur'
    ? ['آج گندم کی قیمت کیا ہے؟', 'کپاس کی فصل کے لیے کھاد کا مشورہ', 'لاہور منڈی میں چاول کا ریٹ', '50 کلو گندم بیچنی ہے']
    : ["Today's wheat price", 'Fertilizer advice for cotton', 'Rice rate in Lahore Mandi', 'Sell 50 kg wheat'];

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] p-5 sm:p-6 transition-all duration-300">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <HiExclamationTriangle className="text-amber-500 text-lg shrink-0" />
            <span className="font-medium">
              {language === 'ur' ? 'مائیکروفون کی اجازت درکار ہے۔ براہ کرم براؤزر سیٹنگز میں اجازت دیں۔' : 'Microphone access required. Please allow it in browser settings.'}
            </span>
          </div>
          <button onClick={() => setError(null)} className="p-1.5 hover:bg-amber-100 rounded-xl text-amber-700 transition-colors">
            <HiXMark className="text-lg" />
          </button>
        </div>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-[1.25rem] border transition-all duration-300 ${
          isRecording 
            ? 'bg-red-50/50 border-red-300 ring-4 ring-red-100' 
            : 'bg-[#F8FAFC] hover:bg-white border-[#E2E8F0] focus-within:bg-white focus-within:border-[#166534] focus-within:ring-4 focus-within:ring-green-500/10 focus-within:shadow-sm'
        }`}>
          {/* Mic Button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer shadow-sm ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                : isProcessing
                ? 'bg-slate-200 text-slate-500 cursor-wait'
                : 'bg-[#166534] hover:bg-[#15803D] text-white hover:scale-105 active:scale-95 shadow-green-900/20'
            }`}
          >
            {isRecording ? <HiStop className="text-2xl" /> : isProcessing ? <div className="w-5 h-5 border-2 border-[#166534] border-t-transparent rounded-full animate-spin" /> : <HiMicrophone className="text-2xl" />}
          </button>

          {/* Text Input */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isRecording || isProcessing}
              placeholder={
                isRecording ? (language === 'ur' ? `سن رہے ہیں... (${formatDuration(recordingDuration)})` : `Listening... (${formatDuration(recordingDuration)})`)
                : isProcessing ? (language === 'ur' ? 'جواب تیار ہو رہا ہے...' : 'Processing...')
                : (language === 'ur' ? 'ایگری میکس سے کچھ بھی پوچھیں...' : 'Ask AgriMax anything...')
              }
              className="w-full h-12 sm:h-14 px-4 bg-transparent border-0 focus:outline-none text-sm sm:text-base text-[#1F2937] placeholder-[#94A3B8] font-medium"
            />
          </div>

          {/* Send Button */}
          {inputText.trim() && (
            <button
              type="submit"
              disabled={isProcessing}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#166534] hover:bg-[#15803D] text-white flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm active:scale-95 shrink-0 mr-1"
            >
              <HiPaperAirplane className="text-base sm:text-lg rtl:rotate-180" />
            </button>
          )}
        </div>
      </form>

      {/* Suggested Chips */}
      <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2.5">
        <span className="text-[#64748B] font-bold text-[11px] uppercase tracking-wider shrink-0 select-none mr-1">
          {language === 'ur' ? 'مثال کے طور پر:' : 'Try asking:'}
        </span>
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => handleChipClick(ex)}
            disabled={isProcessing || isRecording}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#F8FAFC] hover:bg-[#F0FDF4] text-[#475569] hover:text-[#166534] border border-[#E2E8F0] hover:border-[#86EFAC] transition-all duration-200 cursor-pointer text-xs font-medium shadow-2xs active:scale-95 truncate max-w-[260px] sm:max-w-none"
          >
            &ldquo;{ex}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}