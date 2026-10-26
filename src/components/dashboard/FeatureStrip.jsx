import { HiMicrophone, HiCpuChip, HiShieldCheck, HiUserGroup } from 'react-icons/hi2';
import useAppStore from '../../store/useAppStore';

function LeafIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

const FEATURES = [
  { id: 'voice', icon: HiMicrophone, titleEn: 'Voice First', titleUr: 'آواز سب سے پہلے', descEn: 'No typing needed', descUr: 'لکھنے کی ضرورت نہیں' },
  { id: 'ai', icon: HiCpuChip, titleEn: 'AI Powered', titleUr: 'مصنوعی ذہانت', descEn: 'Smart recommendations', descUr: 'بہترین زرعی مشورے' },
  { id: 'secure', icon: HiShieldCheck, titleEn: 'Secure & Trusted', titleUr: 'محفوظ اور قابلِ اعتماد', descEn: 'Your data is safe', descUr: 'مکمل حفاظت' },
  { id: 'direct', icon: HiUserGroup, titleEn: 'Farmer to Buyer', titleUr: 'کسان تا خریدار', descEn: 'Direct connections', descUr: 'براہ راست رابطہ' },
  { id: 'income', icon: LeafIcon, titleEn: 'Better Income', titleUr: 'بہتر آمدنی', descEn: 'Fewer middlemen', descUr: 'درمیانی منافع سے نجات' },
];

export default function FeatureStrip() {
  const { language } = useAppStore();

  return (
    <section aria-label="AgriMax Platform Highlights" className="mt-8 mb-4 bg-white border border-[#E2EAF0] rounded-3xl p-6 sm:p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 xl:gap-0 xl:divide-x divide-[#E2EAF0] rtl:xl:divide-x-reverse">
        {FEATURES.map((item) => {
          const Icon = item.icon;
          const title = language === 'ur' ? item.titleUr : item.titleEn;
          const desc = language === 'ur' ? item.descUr : item.descEn;

          return (
            <div key={item.id} className="flex items-center gap-4 xl:px-5 first:xl:pl-0 last:xl:pr-0 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] group-hover:bg-[#DCFCE7] border border-[#DCFCE7] text-[#078747] flex items-center justify-center shrink-0 transition-colors duration-300">
                <Icon className="text-xl text-[#078747]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#102A43] leading-tight truncate group-hover:text-[#056B3B] transition-colors">
                  {title}
                </h4>
                <p className="text-xs text-[#62758A] mt-1 leading-tight truncate font-medium">
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}