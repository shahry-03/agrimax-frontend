import { useNavigate } from 'react-router-dom';
import {
  HiMicrophone,
  HiShoppingCart,
  HiChartBar,
  HiWallet,
  HiChevronRight,
} from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

export default function QuickActions({ onStartVoice }) {
  const navigate = useNavigate();
  const { language } = useAppStore();

  const ACTIONS = [
    {
      id: 'voice-search',
      titleEn: 'Voice Search',
      titleUr: 'صوتی تلاش',
      descEn: 'Ask about prices',
      descUr: 'قیمتیں پوچھیں',
      icon: HiMicrophone,
      onClick: () => {
        if (onStartVoice) onStartVoice();
      },
    },
    {
      id: 'find-buyers',
      titleEn: 'Find Buyers',
      titleUr: 'خریدار تلاش کریں',
      descEn: 'Sell your crops',
      descUr: 'فصل فروخت کریں',
      icon: HiShoppingCart,
      onClick: () => navigate('/marketplace'),
    },
    {
      id: 'price-trends',
      titleEn: 'Price Trends',
      titleUr: 'مارکیٹ ریٹس',
      descEn: 'Market insights',
      descUr: 'منڈی کا احوال',
      icon: HiChartBar,
      onClick: () => navigate('/prices'),
    },
    {
      id: 'my-wallet',
      titleEn: 'My Wallet',
      titleUr: 'میرا والیٹ',
      descEn: 'Manage balance',
      descUr: 'رقم و بیلنس',
      icon: HiWallet,
      onClick: () => navigate('/wallet'),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-extrabold text-[#102A43] tracking-tight">
        {language === 'ur' ? 'فوری اقدامات (Quick Actions)' : 'Quick Actions'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const title = language === 'ur' ? action.titleUr : action.titleEn;
          const desc = language === 'ur' ? action.descUr : action.descEn;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="bg-white border border-[#E2EAF0] hover:border-[#078747] hover:bg-[#F0F8F2] rounded-xl p-3.5 sm:p-4 text-left transition-all duration-200 shadow-2xs hover:shadow-xs group cursor-pointer flex flex-col justify-between h-[104px] min-w-0"
            >
              {/* Top Row: Icon on left, Chevron on right */}
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#078747] group-hover:bg-[#078747] group-hover:text-white transition-colors flex items-center justify-center">
                  <Icon className="text-lg" />
                </div>
                <HiChevronRight className="text-sm text-[#94A3B8] group-hover:text-[#078747] transition-colors" />
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-[#102A43] group-hover:text-[#078747] transition-colors leading-tight">
                  {title}
                </p>
                <p className="text-[11px] text-[#62758A] mt-0.5 leading-tight truncate">
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
