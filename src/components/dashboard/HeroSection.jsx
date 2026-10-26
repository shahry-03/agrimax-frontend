import { useNavigate } from 'react-router-dom';
import { HiMicrophone, HiBuildingStorefront, HiSparkles } from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

export default function HeroSection({ onStartVoiceChat }) {
  const navigate = useNavigate();
  const { language } = useAppStore();

  return (
    <section className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-sm flex flex-col sm:flex-row items-stretch min-h-[200px] sm:min-h-[220px] transition-all hover:shadow-md">
      {/* ── Start: Typography & Actions ── */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center min-w-0 z-10 max-w-2xl">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 w-fit mb-4">
          <HiSparkles className="text-emerald-600 text-sm" />
          <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-widest">
            {language === 'ur' ? 'آپ کا زرعی معاون' : 'YOUR FARMING ASSISTANT'}
          </p>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          {language === 'ur' ? (
            <span className="urdu-text font-bold block leading-[1.6]">
              آپ کی آواز۔ <span className="text-emerald-600">آپ کا زرعی ساتھی۔</span>
            </span>
          ) : (
            <span>Your Voice. <span className="text-emerald-600">Your Farming Partner.</span></span>
          )}
        </h1>

        {/* Supporting text */}
        <p className="mb-6 text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-lg">
          {language === 'ur' ? (
            <span className="urdu-text block">
              فصل کی قیمت، زرعی مشورہ اور خریداروں کے بارے میں صرف بول کر معلوم کریں۔
            </span>
          ) : (
            'Ask about crop prices, farming advice and buyers — simply by speaking.'
          )}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStartVoiceChat}
            className="px-5 sm:px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 group"
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <HiMicrophone className="text-lg shrink-0" />
            </div>
            <span>{language === 'ur' ? 'ایگری میکس سے بات کریں' : 'Talk to AgriMax'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="px-5 sm:px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border-2 border-slate-200 hover:border-emerald-200 hover:text-emerald-700 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <HiBuildingStorefront className="text-lg text-slate-400 shrink-0" />
            <span>{language === 'ur' ? 'مارکیٹ دیکھیں' : 'Explore Market'}</span>
          </button>
        </div>
      </div>

      {/* ── End: Premium Image Layout ── */}
      <div className="hidden sm:block w-[280px] md:w-[350px] lg:w-[400px] p-3 shrink-0 relative">
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner relative group">
          <img
            src="/images/hero-farmer.jpg"
            alt="Pakistani farmer in agricultural field"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
          
          {/* Floating Glass Badge on Image */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-3 flex items-center justify-between text-white shadow-lg">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide">Live Market Data</span>
             </div>
             <span className="text-[10px] font-medium bg-black/30 px-2 py-1 rounded-md">Updated</span>
          </div>
        </div>
      </div>
    </section>
  );
}