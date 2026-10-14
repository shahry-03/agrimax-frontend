import useAppStore from '../store/useAppStore';
import useSpeech from '../hooks/useSpeech';

/**
 * ChatBubble — Displays user voice transcripts and AgriMax bilingual AI responses.
 * Includes intent badges, audio replay button (🔊), and structured data cards.
 */
export function ChatBubble({ message }) {
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

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 mb-4 animate-fade-up">
        <div className="max-w-[85%] sm:max-w-[75%] bg-green-700/80 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-md border border-green-600/40">
          <p className="text-base sm:text-lg font-medium leading-relaxed">
            &ldquo;{message.text}&rdquo;
          </p>
          <div className="flex items-center justify-end gap-2 mt-1.5 text-green-200/80 text-[11px]">
            <span>{formattedTime}</span>
            <span>🎤</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-green-900/60 border border-green-500/30 flex items-center justify-center text-sm shadow">
          👨‍🌾
        </div>
      </div>
    );
  }

  // Assistant Bubble
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
    <div className="flex items-start gap-2 mb-4 animate-fade-up">
      <div className="w-9 h-9 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-lg shadow shrink-0">
        🌾
      </div>

      <div className="max-w-[88%] sm:max-w-[80%] bg-slate-800/90 text-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-lg border border-slate-700/60 space-y-3">
        {/* Urdu Response */}
        {messageUr && (
          <div className="border-b border-slate-700/50 pb-2">
            <p className="urdu-text text-lg sm:text-xl font-medium leading-relaxed text-emerald-300">
              {messageUr}
            </p>
          </div>
        )}

        {/* English Response */}
        {messageEn && (
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {messageEn}
          </p>
        )}

        {/* Structured Result Cards */}
        {result && typeof result === 'object' && (
          <div className="mt-2 bg-slate-900/70 rounded-xl p-3 border border-slate-700/80 text-xs sm:text-sm">
            {/* GET_CROP_PRICE card */}
            {intent === 'GET_CROP_PRICE' && result.avgPrice && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-green-400 font-semibold">
                  <span className="urdu-text text-base">اوسط قیمت:</span>
                  <span className="text-base font-bold">₨ {Number(result.avgPrice).toLocaleString()} / {result.unit || 'kg'}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>کم از کم: ₨ {Number(result.minPrice).toLocaleString()}</span>
                  <span>زیادہ سے زیادہ: ₨ {Number(result.maxPrice).toLocaleString()}</span>
                </div>
                {result.market && (
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    📍 {result.market}
                  </p>
                )}
              </div>
            )}

            {/* VIEW_WALLET card */}
            {intent === 'VIEW_WALLET' && result.balance !== undefined && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs urdu-text">موجودہ بیلنس</p>
                  <p className="text-xl font-bold text-green-400">
                    ₨ {Number(result.balance).toLocaleString('en-PK')}
                  </p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            )}

            {/* CREATE_SELL_POST card */}
            {intent === 'CREATE_SELL_POST' && result.postId && (
              <div className="space-y-1">
                <p className="text-green-400 font-semibold flex items-center gap-1">
                  <span>✅</span> <span>پوسٹ کامیابی سے بن گئی!</span>
                </p>
                <p className="text-slate-300">
                  {result.quantity} {result.unit} {result.cropUr || result.crop} — ₨ {Number(result.askingPrice).toLocaleString()}
                </p>
              </div>
            )}

            {/* Default key-value pairs if other structured result */}
            {intent !== 'GET_CROP_PRICE' &&
              intent !== 'VIEW_WALLET' &&
              intent !== 'CREATE_SELL_POST' &&
              intent !== 'VERIFY_OTP' &&
              !Array.isArray(result) && (
                <div className="space-y-1">
                  {Object.entries(result)
                    .slice(0, 4)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-400 capitalize">{k}:</span>
                        <span className="text-slate-200 font-medium">{String(v)}</span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}

        {/* Footer: Intent badge, Replay Audio button, Timestamp */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            {detectedLanguage && (
              <span className="bg-slate-700/60 px-1.5 py-0.5 rounded-full text-[10px] text-blue-300 font-mono">
                🌐 {detectedLanguage}
              </span>
            )}
            {intent && (
              <span className="bg-slate-700/60 px-2 py-0.5 rounded-full text-[10px] text-emerald-400 font-medium">
                {intent}
              </span>
            )}
            {confidence && (
              <span className="text-[10px] text-slate-500">
                {Math.round(confidence * 100)}%
              </span>
            )}
            {success === false && (
              <span className="bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded-full text-[10px]">
                ⚠️ توجہ طلب
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReplayAudio}
              className="flex items-center gap-1 text-slate-300 hover:text-green-400 transition-colors p-1 rounded-md hover:bg-slate-700/50 cursor-pointer"
              title="آواز دوبارہ سنیں / Listen again"
            >
              <span className="text-sm">🔊</span>
              <span className="text-[10px]">سنیں</span>
            </button>
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
