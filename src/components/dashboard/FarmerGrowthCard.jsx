import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

export default function FarmerGrowthCard() {
  const navigate = useNavigate();
  const { language } = useAppStore();

  return (
    <div className="bg-[#F0F8F2] border border-[#D5EEDC] rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs">
      <div className="relative z-10 pr-24 sm:pr-28">
        {/* Decorative leaf icon */}
        <div className="w-7 h-7 rounded-lg bg-[#078747]/15 text-[#078747] flex items-center justify-center mb-2">
          <svg
            className="w-4.5 h-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>

        <h4 className="text-sm font-bold text-[#102A43] leading-snug">
          {language === 'ur' ? 'حقیقی کسان، حقیقی ترقی' : 'Real Farmers. Real Growth.'}
        </h4>

        <p className="text-xs text-[#486581] mt-1 mb-3.5 leading-relaxed">
          {language === 'ur'
            ? 'ایگری میکس آپ کو مناسب ریٹس اور براہ راست خریداروں تک رسائی فراہم کرتا ہے۔'
            : 'Agrimax helps you get fair prices and better opportunities.'}
        </p>

        {/* Button */}
        <button
          type="button"
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 bg-[#056B3B] hover:bg-[#078747] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>{language === 'ur' ? 'مزید جانیں' : 'Learn More'}</span>
          <span>→</span>
        </button>
      </div>

      {/* Sun & Rolling Hills Landscape Graphic (bottom right corner, non-interfering) */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-50 w-28 h-20 sm:w-32 sm:h-24 overflow-hidden">
        <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Soft Sun in background */}
          <circle cx="138" cy="36" r="14" fill="#FDE047" fillOpacity="0.5" />
          <circle cx="138" cy="36" r="8" fill="#FACC15" fillOpacity="0.7" />
          {/* Trees on the hill */}
          <path d="M110 74C110 68 114 64 117 64C120 64 124 68 124 74H110Z" fill="#15803D" />
          <path d="M120 78C120 72 124 68 127 68C130 68 134 72 134 78H120Z" fill="#16A34A" />
          <path d="M130 72C130 65 135 60 139 60C143 60 148 65 148 72H130Z" fill="#059669" />
          {/* Rolling Crop Hills */}
          <path d="M40 100C80 65 120 60 160 74V100H40Z" fill="#22C55E" fillOpacity="0.35" />
          <path d="M0 100C45 76 95 70 160 84V100H0Z" fill="#078747" fillOpacity="0.45" />
        </svg>
      </div>
    </div>
  );
}
