import useAppStore from '../store/useAppStore';
import useSpeech from '../hooks/useSpeech';
import AIContextRenderer, { BdiSpan } from './AIContextRenderer';
import { 
  HiMicrophone, 
  HiSpeakerWave, 
  HiOutlineSparkles,
  HiOutlineGlobeAlt 
} from 'react-icons/hi2';

/**
 * ChatBubble — Premium Industry Standard Chat Interface.
 * Features:
 * - Gradient User Bubbles with right-aligned avatars
 * - Glassmorphic AI Bubbles with layered shadows
 * - Structured Layout (Header, Body, Context, Footer)
 * - Advanced Micro-interactions (Hover states, Listen button)
 * - Robust RTL/LTR Typography for Urdu/English
 */
export function ChatBubble({ message, onSelectAction }) {
  const { language } = useAppStore();
  const { speak } = useSpeech();

  const isUser = message.sender === 'user';

  const handleReplayAudio = () => {
    const textToSpeak =
      language === 'ur'
        ? message.messageUr || message.messageEn
        : message.messageEn || message.messageUr;
    if (textToSpeak) {
      speak(textToSpeak, language);
    }
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // ────────────────────────────────────────────────────────
  // ── USER MESSAGE BUBBLE ──
  // ────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2.5 mb-5 animate-fade-up min-w-0">
        <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-md shadow-emerald-900/10 break-words relative group">
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-emerald-100/80 text-[10px] font-medium">
            <BdiSpan>{formattedTime}</BdiSpan>
            <HiMicrophone className="text-xs" />
          </div>
        </div>
        
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm shadow-sm shrink-0 select-none">
          👨‍🌾
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // ── ASSISTANT (AI) MESSAGE BUBBLE ──
  // ────────────────────────────────────────────────────────
  const {
    messageEn,
    messageUr,
    intent,
    confidence,
    detectedLanguage,
    result,
    success,
  } = message;

  return (
    <div className="flex items-start gap-2.5 mb-5 animate-fade-up min-w-0">
      {/* AI Avatar */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 text-emerald-700 flex items-center justify-center text-sm shadow-sm shrink-0 select-none mt-0.5">
        🌾
      </div>

      <div className="max-w-[92%] sm:max-w-[82%] bg-white text-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3 min-w-0 flex-1 relative group hover:shadow-md transition-shadow duration-300">
        
        {/* ── 1. Message Body (Bilingual) ── */}
        <div className="space-y-2.5">
          {/* Urdu Response */}
          {messageUr && (
            <div className={`${messageEn ? 'border-b border-slate-100 pb-2.5' : ''}`}>
              <p 
                className="urdu-text text-[15px] sm:text-base font-medium leading-[2] text-slate-800 text-right" 
                dir="rtl"
              >
                {messageUr}
              </p>
            </div>
          )}

          {/* English Response */}
          {messageEn && (
            <p 
              className="text-slate-600 text-[13px] sm:text-sm font-medium leading-relaxed" 
              dir="ltr"
            >
              {messageEn}
            </p>
          )}
        </div>

        {/* ── 2. Structured Contextual Result Cards ── */}
        {result && (
          <div className="mt-3 pt-3 border-t border-slate-100 min-w-0">
            <AIContextRenderer
              intent={intent}
              result={result}
              onSelectAction={onSelectAction}
              language={language}
            />
          </div>
        )}

        {/* ── 3. Footer: Meta-data & Actions ── */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-100 text-[10px] text-slate-400 gap-2 flex-wrap">
          
          {/* Left Side: Badges & Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {detectedLanguage && (
              <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <HiOutlineGlobeAlt className="text-xs" />
                {detectedLanguage}
              </span>
            )}
            
            {intent && (
              <span className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] text-emerald-700 font-bold tracking-wide uppercase flex items-center gap-1">
                <HiOutlineSparkles className="text-xs" />
                {intent.replace(/_/g, ' ')}
              </span>
            )}
            
            {confidence && (
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                <BdiSpan>{Math.round(confidence * 100)}% Match</BdiSpan>
              </span>
            )}

            {success === false && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                ⚠️ {language === 'ur' ? 'توجہ طلب' : 'Action Required'}
              </span>
            )}
          </div>

          {/* Right Side: Replay Audio & Timestamp */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleReplayAudio}
              className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50 cursor-pointer group/listen"
              title="آواز دوبارہ سنیں / Listen again"
            >
              <HiSpeakerWave className="text-sm group-hover/listen:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold">{language === 'ur' ? 'سنیں' : 'Listen'}</span>
            </button>
            
            <span className="w-1 h-1 rounded-full bg-slate-300" /> {/* Divider */}
            
            <BdiSpan className="font-semibold text-slate-400 text-[11px]">
              {formattedTime}
            </BdiSpan>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;