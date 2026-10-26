import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiHome,
  HiShoppingCart,
  HiChartBar,
  HiWallet,
  HiUser,
  HiCog6Tooth,
  HiQuestionMarkCircle,
  HiSparkles,
} from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

const SIDEBAR_ITEMS = [
  { path: '/', icon: HiHome, labelEn: 'Home', labelUr: 'ہوم' },
  { path: '/marketplace', icon: HiShoppingCart, labelEn: 'Marketplace', labelUr: 'مارکیٹ' },
  { path: '/prices', icon: HiChartBar, labelEn: 'Mandi Prices', labelUr: 'قیمتیں' },
  { path: '/wallet', icon: HiWallet, labelEn: 'Wallet', labelUr: 'والیٹ' },
];

const BOTTOM_ITEMS = [
  { path: '/profile', icon: HiUser, labelEn: 'Profile', labelUr: 'پروفائل' },
  { path: '/settings', icon: HiCog6Tooth, labelEn: 'Settings', labelUr: 'سیٹنگز' },
];

export default function Sidebar() {
  const { language } = useAppStore();
  const navigate = useNavigate();

  // Helper to render a single Nav Item beautifully
  const renderNavItem = (item) => {
    const Icon = item.icon;
    const label = language === 'ur' ? item.labelUr : item.labelEn;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) =>
          `group flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${
            isActive
              ? 'bg-emerald-50/80 text-emerald-800 shadow-sm shadow-emerald-100/50'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {/* Active Indicator Bar */}
            {isActive && (
              <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 rounded-e-full" />
            )}

            {/* Icon Container */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                  : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-sm'
              }`}
            >
              <Icon className="text-lg" />
            </div>

            {/* Label */}
            <span className="truncate flex-1">{label}</span>

            {/* Optional Sparkle for new features (static for now) */}
            {item.path === '/marketplace' && !isActive && (
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="w-full shrink-0 flex flex-col h-[calc(100vh-80px)] sticky top-[80px] py-6 pe-4 border-e border-slate-200/80">
      
      {/* ── Main Navigation ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        <p className="px-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {language === 'ur' ? 'مینو' : 'MAIN MENU'}
        </p>
        <nav className="space-y-1.5" aria-label="Main sidebar navigation">
          {SIDEBAR_ITEMS.map(renderNavItem)}
        </nav>

        <div className="my-6 border-t border-slate-100/80 mx-3" />

        <p className="px-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {language === 'ur' ? 'اکاؤنٹ' : 'ACCOUNT'}
        </p>
        <nav className="space-y-1.5" aria-label="Account sidebar navigation">
          {BOTTOM_ITEMS.map(renderNavItem)}
        </nav>
      </div>

      {/* ── Bottom Promo/Support Card ── */}
      <div className="mt-auto pt-4 px-1">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-lg group cursor-pointer" onClick={() => navigate('/support')}>
           {/* Decorative background circle */}
           <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
           
           <div className="relative z-10">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
               <HiQuestionMarkCircle className="text-emerald-400 text-lg" />
             </div>
             <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-1.5">
               {language === 'ur' ? 'مدد کی ضرورت ہے؟' : 'Need Help?'}
               <HiSparkles className="text-amber-400 text-xs animate-pulse" />
             </h4>
             <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
               {language === 'ur' 
                 ? 'ہماری زرعی ٹیم سے بات کریں یا AI سے پوچھیں۔' 
                 : 'Chat with our support or ask the AI assistant.'}
             </p>
             <div className="inline-flex items-center text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
               {language === 'ur' ? 'رابطہ کریں' : 'Get Support'} <span className="rtl:rotate-180 inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span>
             </div>
           </div>
        </div>
      </div>
    </aside>
  );
}