import { useState, useEffect } from 'react';
import { catalogApi } from '../../services/api';
import useAppStore from '../../store/useAppStore';
import { HiArrowTrendingUp, HiOutlineArrowRight } from 'react-icons/hi2';

export default function MarketPriceWidget({ onSelectCrop }) {
  const { language } = useAppStore();
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTodayPrice() {
      try {
        const { data: listRes } = await catalogApi.listCrops();
        const crops = listRes?.data || [];
        const targetCrop =
          crops.find((c) => c.nameEn?.toLowerCase().includes('rice')) ||
          crops.find((c) => c.nameEn?.toLowerCase().includes('wheat')) ||
          crops[0];

        if (targetCrop && targetCrop.id) {
          const { data: priceRes } = await catalogApi.getCropPrice(targetCrop.id);
          const p = priceRes?.data;
          if (isMounted && p) {
            setPriceData({
              cropNameEn: targetCrop.nameEn || 'Rice',
              cropNameUr: targetCrop.nameUr || 'چاول',
              marketName: p.marketName || 'Lahore Mandi',
              avgPrice: p.avgPrice ? Number(p.avgPrice).toFixed(2) : '3850.00',
              minPrice: p.minPrice ? Number(p.minPrice).toFixed(2) : '3500.00',
              maxPrice: p.maxPrice ? Number(p.maxPrice).toFixed(2) : '4200.00',
              isLive: true,
            });
            return;
          }
        }
      } catch {
        // Fallback
      }

      if (isMounted) {
        setPriceData({
          cropNameEn: 'Rice',
          cropNameUr: 'چاول',
          marketName: 'Lahore Mandi',
          avgPrice: '3850.00',
          minPrice: '3500.00',
          maxPrice: '4200.00',
          isLive: false,
        });
      }
    }

    loadTodayPrice().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const display = priceData || {
    cropNameEn: 'Rice',
    cropNameUr: 'چاول',
    marketName: 'Lahore Mandi',
    avgPrice: '3850.00',
    minPrice: '3500.00',
    maxPrice: '4200.00',
    isLive: false,
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md hover:border-emerald-100 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              {language === 'ur' ? `${display.cropNameUr} کا ریٹ` : `${display.cropNameEn} Price`}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
              Today's Market
            </p>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-200">
          {display.marketName}
        </span>
      </div>

      {/* Main Price Area */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-end justify-between relative z-10">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-slate-400 tracking-wider">PKR</span>
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
                {loading ? '...' : display.avgPrice}
              </span>
              <span className="text-sm font-bold text-slate-400">/kg</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">
              Range: <span className="text-slate-700 font-semibold">{display.minPrice}</span> - <span className="text-slate-700 font-semibold">{display.maxPrice}</span>
            </p>
          </div>

          {/* Trend Badge */}
          <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 mb-1">
            <HiArrowTrendingUp className="text-sm" />
            <span className="text-xs font-bold">+2.5%</span>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-5 flex items-center justify-end">
        {onSelectCrop && (
          <button
            type="button"
            onClick={onSelectCrop}
            className="text-emerald-600 hover:text-emerald-700 font-bold text-sm cursor-pointer flex items-center gap-2 group/btn transition-colors"
          >
            <span>{language === 'ur' ? 'تمام ریٹس دیکھیں' : 'View all prices'}</span>
            <div className="w-6 h-6 rounded-full bg-emerald-50 group-hover/btn:bg-emerald-100 flex items-center justify-center transition-colors">
               <HiOutlineArrowRight className="text-xs rtl:rotate-180 group-hover/btn:translate-x-0.5 transition-transform" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}