import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

export default function FarmerGrowthCard() {
  const navigate = useNavigate();
  const { language } = useAppStore();

  return (
    <div className="bg-gradient-to-br from-[#F2FAF5] to-[#E8F5E9] border border-[#D1E8D5] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm group hover:shadow-md transition-shadow duration-300">
      <div className="relative z-10 pr-20 sm:pr-24">
        {/* Decorative leaf icon */}
        <div className="w-9 h-9 rounded-xl bg-white border border-[#D1E8D5] text-[#078747] flex items-center justify-center mb-3 shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>

        <h4 className="text-base font-bold text-[#102A43] leading-snug group-hover:text-[#056B3B] transition-colors">
          {language === 'ur' ? 'حقیقی کسان، حقیقی ترقی' : 'Real Farmers. Real Growth.'}
        </h4>

        <p className="text-xs text-[#486581] mt-1.5 mb-4 leading-relaxed font-medium">
          {language === 'ur'
            ? 'ایگری میکس آپ کو مناسب ریٹس اور براہ راست خریداروں تک رسائی فراہم کرتا ہے۔'
            : 'Agrimax helps you get fair prices and better opportunities.'}
        </p>

        <button
          type="button"
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 bg-[#056B3B] hover:bg-[#078747] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <span>{language === 'ur' ? 'مزید جانیں' : 'Learn More'}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* Background Graphic */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500 w-32 h-24 sm:w-36 sm:h-28">
        <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="138" cy="36" r="16" fill="#FDE047" fillOpacity="0.6" />
          <circle cx="138" cy="36" r="8" fill="#FACC15" fillOpacity="0.8" />
          <path d="M110 74C110 68 114 64 117 64C120 64 124 68 124 74H110Z" fill="#15803D" />
          <path d="M120 78C120 72 124 68 127 68C130 68 134 72 134 78H120Z" fill="#16A34A" />
          <path d="M130 72C130 65 135 60 139 60C143 60 148 65 148 72H130Z" fill="#059669" />
          <path d="M40 100C80 65 120 60 160 74V100H40Z" fill="#22C55E" fillOpacity="0.4" />
          <path d="M0 100C45 76 95 70 160 84V100H0Z" fill="#078747" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}