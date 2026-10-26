import { useNavigate } from 'react-router-dom';
import {
  HiChartBar,
  HiSun,
  HiSparkles,
  HiShoppingCart,
  HiChevronRight,
} from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

export default function QuickActions({ onActionQuery }) {
  const navigate = useNavigate();
  const { language } = useAppStore();

  const ACTIONS = [
    {
      id: 'market-prices',
      titleEn: 'Market Prices',
      titleUr: 'منڈی کے ریٹس',
      descEn: 'Live daily mandi rates',
      descUr: 'تازہ ترین منڈی کی قیمتیں',
      icon: HiChartBar,
      onClick: () => navigate('/prices'),
    },
    {
      id: 'weather-update',
      titleEn: 'Weather Update',
      titleUr: 'موسم کا حال',
      descEn: 'Local farming forecast',
      descUr: 'مقامی موسم کی پیشگوئی',
      icon: HiSun,
      onClick: () => {
        if (onActionQuery) {
          onActionQuery(language === 'ur' ? 'آج موسم کا کیا حال ہے؟' : "What's the weather forecast today?");
        }
      },
    },
    {
      id: 'crop-guidance',
      titleEn: 'Crop Guidance',
      titleUr: 'فصل کی رہنمائی',
      descEn: 'Disease & fertilizer tips',
      descUr: 'بیماری اور کھاد کا مشورہ',
      icon: HiSparkles,
      onClick: () => {
        if (onActionQuery) {
          onActionQuery(language === 'ur' ? 'میری فصل کے لیے زرعی مشورہ دیں' : 'Give me expert crop and fertilizer advice');
        }
      },
    },
    {
      id: 'find-buyers',
      titleEn: 'Find Buyers',
      titleUr: 'خریدار تلاش کریں',
      descEn: 'Sell produce directly',
      descUr: 'بغیر آڑھتی کے فصل بیچیں',
      icon: HiShoppingCart,
      onClick: () => navigate('/marketplace'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
          {language === 'ur' ? 'اہم اقدامات' : 'Quick Actions'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const title = language === 'ur' ? action.titleUr : action.titleEn;
          const desc = language === 'ur' ? action.descUr : action.descEn;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="bg-white border border-slate-200/80 hover:border-emerald-200 rounded-3xl p-5 text-start transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 group cursor-pointer flex flex-col justify-between min-h-[120px] min-w-0 relative overflow-hidden"
            >
              {/* Subtle hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Top Row: Icon & Chevron */}
              <div className="flex items-start justify-between w-full mb-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="text-xl" />
                </div>
                <div className="w-7 h-7 rounded-full bg-transparent group-hover:bg-white flex items-center justify-center transition-colors">
                  <HiChevronRight className="text-sm text-slate-300 group-hover:text-emerald-600 transition-all rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </div>
              </div>

              {/* Bottom Text Area */}
              <div className="min-w-0 w-full relative z-10 mt-auto">
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight truncate">
                  {title}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-1 leading-snug truncate">
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}