import { useState } from 'react';
import { HiMicrophone, HiPlay, HiXMark } from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

export default function HeroSection({ onStartVoiceChat }) {
  const { language } = useAppStore();
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <>
      <section className="relative rounded-2xl overflow-hidden border border-[#E2EAF0] shadow-2xs bg-white min-h-[230px] sm:min-h-[250px] lg:min-h-[260px] flex items-center">
        {/* Background Image: Authentic Pakistani Farmer Sunrise Photo */}
        <div
          className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-[position:85%_center]"
          style={{
            backgroundImage: `url('/images/hero-farmer.jpg')`,
          }}
          role="img"
          aria-label="Pakistani farmer in agricultural field at sunrise"
        />

        {/* Balanced Contrast Gradient Overlay: ensures text readability on left while keeping farmer & sunrise vibrant */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 via-40% to-transparent lg:via-white/70 lg:via-45%" />

        {/* Hero Content */}
        <div className="relative z-10 p-5 sm:p-6 lg:p-7 max-w-xl">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E8F5E9] text-[#056B3B] border border-[#C8E6C9] text-xs font-bold mb-2 shadow-2xs">
            <HiMicrophone className="text-sm text-[#078747]" />
            <span>{language === 'ur' ? 'آواز پر مبنی پلیٹ فارم' : 'Voice First Platform'}</span>
          </div>

          {/* Main Heading (2 Lines) */}
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#102A43] tracking-tight leading-[1.25]">
            {language === 'ur' ? (
              <span className="urdu-text font-bold leading-normal block">
                ایگری میکس — کسانوں کو خریداروں سے جوڑنا
              </span>
            ) : (
              <>
                <span className="text-[#078747]">Agrimax</span> – Connecting
                <br className="hidden sm:inline" /> Farmers with Buyers
              </>
            )}
          </h1>

          {/* Supporting Subtitle */}
          <p className="mt-1.5 mb-4 text-xs sm:text-sm text-[#334E68] font-medium leading-relaxed max-w-lg">
            {language === 'ur' ? (
              <span className="urdu-text block">
                بولیں، فصل بیچیں اور منافع کمائیں۔ مصنوعی ذہانت (AI) اور آواز کے ذریعے اپنی فصل کا بہترین ریٹ حاصل کریں — بغیر کسی درمیانی آڑھتی کے۔
              </span>
            ) : (
              'Speak, sell, and grow. Use the power of AI and voice to get better prices for your crops — without unnecessary middlemen.'
            )}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={onStartVoiceChat}
              className="px-4.5 py-2 rounded-xl bg-[#078747] hover:bg-[#056B3B] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <HiMicrophone className="text-base" />
              <span>{language === 'ur' ? 'صوتی گفتگو شروع کریں' : 'Start Voice Chat'}</span>
              <span>→</span>
            </button>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-[#102A43] hover:text-[#078747] font-semibold text-xs sm:text-sm border border-[#D2DDEC] shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-[#078747]/15 text-[#078747] flex items-center justify-center text-xs">
                <HiPlay className="translate-x-0.5" />
              </div>
              <span>{language === 'ur' ? 'ڈیمو دیکھیں' : 'Watch Demo'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Watch Demo Modal ── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-3xl border border-[#E2EAF0] shadow-2xl max-w-lg w-full p-6 relative">
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close modal"
            >
              <HiXMark className="text-xl" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] text-[#078747] flex items-center justify-center text-xl font-bold">
                🌾
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102A43]">
                  {language === 'ur' ? 'ایگری میکس صوتی ڈیمو' : 'AgriMax Voice Demo'}
                </h3>
                <p className="text-xs text-[#62758A]">
                  {language === 'ur' ? 'آواز سے زرعی معلومات حاصل کریں' : 'See how voice assistance works'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[#486581] leading-relaxed">
              <div className="p-3.5 bg-[#F0F8F2] border border-[#D5EEDC] rounded-2xl">
                <p className="font-bold text-[#078747] text-xs uppercase mb-1">
                  1. {language === 'ur' ? 'مائیک دبائیں' : 'Tap the Microphone'}
                </p>
                <p className="text-xs text-[#102A43]">
                  {language === 'ur'
                    ? 'صرف مائیک دبائیں اور اردو یا پنجابی میں اپنا سوال پوچھیں۔'
                    : 'Simply tap the green microphone and speak in Urdu or English.'}
                </p>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2EAF0] rounded-2xl">
                <p className="font-bold text-[#102A43] text-xs uppercase mb-1">
                  2. {language === 'ur' ? 'مثال سوالات' : 'Example Voice Queries'}
                </p>
                <ul className="text-xs space-y-1 list-disc list-inside text-[#62758A]">
                  <li>&ldquo;لاہور منڈی میں گندم کا ریٹ کیا ہے؟&rdquo;</li>
                  <li>&ldquo;میری چاول کی فصل بیچنی ہے&rdquo;</li>
                  <li>&ldquo;میرا والیٹ بیلنس دکھاؤ&rdquo;</li>
                </ul>
              </div>

              <div className="p-3.5 bg-[#F0F8F2] border border-[#D5EEDC] rounded-2xl">
                <p className="font-bold text-[#078747] text-xs uppercase mb-1">
                  3. {language === 'ur' ? 'فوری صوتی و تحریری جواب' : 'Instant Voice & Visual Card'}
                </p>
                <p className="text-xs text-[#102A43]">
                  {language === 'ur'
                    ? 'ایگری میکس آپ کو تازہ ترین منڈی ریٹ کارڈ اور آواز میں جواب دیتا ہے۔'
                    : 'AgriMax responds with a live Mandi rate card and spoken audio.'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDemoModal(false);
                  if (onStartVoiceChat) onStartVoiceChat();
                }}
                className="w-full py-3 bg-[#078747] hover:bg-[#056B3B] text-white font-bold rounded-xl text-sm transition cursor-pointer"
              >
                {language === 'ur' ? 'ابھی آزمائیں (Try Voice Now)' : 'Try Voice Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
