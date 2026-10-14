import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiShoppingCart,
  HiChartBar,
  HiWallet,
  HiUser,
  HiCog6Tooth,
} from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

const SIDEBAR_ITEMS = [
  { path: '/', icon: HiHome, labelEn: 'Home', labelUr: 'ہوم' },
  { path: '/marketplace', icon: HiShoppingCart, labelEn: 'Market', labelUr: 'مارکیٹ' },
  { path: '/prices', icon: HiChartBar, labelEn: 'Prices', labelUr: 'قیمتیں' },
  { path: '/wallet', icon: HiWallet, labelEn: 'Wallet', labelUr: 'والیٹ' },
  { path: '/profile', icon: HiUser, labelEn: 'Profile', labelUr: 'پروفائل' },
  { path: '/settings', icon: HiCog6Tooth, labelEn: 'Settings', labelUr: 'سیٹنگز' },
];

export default function Sidebar() {
  const { language } = useAppStore();

  return (
    <aside className="w-full shrink-0 flex flex-col justify-between p-4 bg-transparent border-r border-[#E2EAF0] min-h-[calc(100vh-72px)] sticky top-[72px] overflow-hidden">
      {/* ── Navigation Links ── */}
      <nav className="space-y-1.5" aria-label="Main sidebar navigation">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const label = language === 'ur' ? item.labelUr : item.labelEn;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px] select-none ${
                  isActive
                    ? 'bg-[#078747] text-white shadow-xs font-bold'
                    : 'text-[#62758A] hover:text-[#078747] hover:bg-[#F0F8F2]'
                }`
              }
            >
              <Icon className="text-xl shrink-0 text-current" />
              <span className="truncate leading-none">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom Agricultural Graphic Card ── */}
      <div className="mt-auto pt-6">
        <div className="w-full rounded-2xl bg-gradient-to-br from-[#EBF7EE] to-[#DCF0E2] border border-[#D5EEDC] p-4 text-[#102A43] relative overflow-hidden shadow-2xs">
          {/* Leaf icon */}
          <div className="w-8 h-8 rounded-lg bg-[#078747]/15 text-[#078747] flex items-center justify-center mb-2.5">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>

          <p className="text-xs font-extrabold text-[#056B3B] uppercase tracking-wider mb-0.5">
            AgriMax
          </p>
          <p className="text-sm font-bold text-[#102A43] leading-snug">
            Better Farmers <br />
            Brighter Future
          </p>
          <p className="text-[11px] text-[#62758A] mt-1 urdu-text leading-tight">
            خوشحال کسان، خوشحال پاکستان
          </p>

          {/* Decorative countryside hills SVG */}
          <div className="mt-2 w-full h-14 opacity-80 overflow-hidden">
            <svg
              viewBox="0 0 240 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* Soft Sun */}
              <circle cx="210" cy="20" r="10" fill="#FBBF24" fillOpacity="0.5" />
              <circle cx="210" cy="20" r="6" fill="#F59E0B" fillOpacity="0.6" />
              {/* Background Hill */}
              <path
                d="M0 70C30 40 70 34 110 46C150 58 180 36 240 44V70H0Z"
                fill="#86EFAC"
                fillOpacity="0.4"
              />
              {/* Foreground Hill */}
              <path
                d="M0 70C45 46 95 42 140 52C185 62 210 50 240 54V70H0Z"
                fill="#22C55E"
                fillOpacity="0.35"
              />
              {/* Miniature Trees */}
              <path d="M25 54C25 48 29 44 32 44C35 44 39 48 39 54H25Z" fill="#15803D" />
              <path d="M48 58C48 52 52 48 55 48C58 48 62 52 62 58H48Z" fill="#16A34A" />
              <path d="M105 50C105 44 109 40 112 40C115 40 119 44 119 50H105Z" fill="#15803D" />
              <path d="M116 54C116 49 119 45 122 45C125 45 128 49 128 54H116Z" fill="#22C55E" />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}
