import {
  HiCheckCircle,
  HiMapPin,
  HiArrowRight,
  HiBanknotes,
  HiClipboardDocumentList,
  HiCalendarDays,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCreditCard,
  HiOutlineCube,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';
import {
  getHumanKeyLabel,
  humanizeKey,
  formatCurrency,
  formatValue,
} from '../utils/aiSchemaMapper';

/**
 * Isolates mixed-direction text (LTR numbers / currency inside Urdu RTL).
 */
export function BdiSpan({ children, className = '' }) {
  return (
    <span className={`inline-block font-sans tracking-tight ${className}`} dir="ltr">
      <bdi>{children}</bdi>
    </span>
  );
}

/**
 * Crop Price Card: Renders price info cleanly with clear layout and unit.
 * Design: Fintech Widget style with soft gradients and prominent average price.
 */
export function CropPriceCard({ data, language = 'ur' }) {
  if (!data || typeof data !== 'object') return null;

  const crop = data.crop || data.cropName || data.cropNameEn;
  const cropUr = data.cropUr || data.cropNameUr;
  const unit = data.unit || data.cropUnit;
  const market = data.market || data.marketName;
  const date = data.date || data.priceDate;

  const avg = data.avgPrice ?? data.currentAvgPrice ?? data.currentPrice;
  const min = data.minPrice ?? data.currentMinPrice;
  const max = data.maxPrice ?? data.currentMaxPrice;

  const displayName = language === 'ur' && cropUr ? cropUr : crop || (language === 'ur' ? 'فصل' : 'Crop');

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300 min-w-0">
      {/* Decorative Background Blur */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-100/60 pb-3 mb-3 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <HiOutlineCube className="text-lg" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-slate-800 truncate block">{displayName}</span>
            {crop && cropUr && language === 'ur' && (
              <span className="text-[10px] text-slate-500 font-medium truncate block">({crop})</span>
            )}
          </div>
        </div>
        {market && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shrink-0 font-bold">
            <HiMapPin className="text-xs shrink-0" />
            <span className="truncate max-w-[100px] sm:max-w-[140px]">{market}</span>
          </div>
        )}
      </div>

      {/* Main Average Price Hero */}
      {avg !== undefined && avg !== null && (
        <div className="bg-white border border-emerald-100 rounded-xl p-3 sm:p-4 shadow-sm mb-3 relative z-10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {language === 'ur' ? 'اوسط قیمت' : 'Average Rate'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tighter">
                <BdiSpan>{formatCurrency(avg)}</BdiSpan>
              </span>
              {unit && (
                <span className="text-xs text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                  / {unit}
                </span>
              )}
            </div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <HiOutlineArrowTrendingUp className="text-emerald-500 text-xl" />
          </div>
        </div>
      )}

      {/* Min & Max Range */}
      {(min !== undefined || max !== undefined) && (
        <div className="grid grid-cols-2 gap-3 text-xs relative z-10">
          {min !== undefined && min !== null && (
            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-2.5">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wide">
                {language === 'ur' ? 'کم از کم' : 'Min Price'}
              </span>
              <span className="font-bold text-slate-700 text-sm mt-1 block">
                <BdiSpan>{formatCurrency(min)}</BdiSpan>
              </span>
            </div>
          )}
          {max !== undefined && max !== null && (
            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-2.5">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wide">
                {language === 'ur' ? 'زیادہ سے زیادہ' : 'Max Price'}
              </span>
              <span className="font-bold text-slate-700 text-sm mt-1 block">
                <BdiSpan>{formatCurrency(max)}</BdiSpan>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Date Footer */}
      {date && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-1 border-t border-emerald-100/50 relative z-10">
          <span className="flex items-center gap-1.5 font-medium">
            <HiCalendarDays className="text-sm" />
            <span>{language === 'ur' ? 'تازہ کاری:' : 'Updated:'}</span>
          </span>
          <BdiSpan className="font-bold text-slate-500">{formatValue('date', date, language)}</BdiSpan>
        </div>
      )}
    </div>
  );
}

/**
 * Wallet Card: Shows balance with currency and active account state.
 * Design: Premium Digital Card style (Dark gradient).
 */
export function WalletCard({ data, language = 'ur' }) {
  if (!data || typeof data !== 'object') return null;
  const balance = data.balance;
  const currency = data.currency || 'PKR';
  const isActive = data.isActive;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 shadow-lg text-white min-w-0 group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors duration-500 pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md text-emerald-400 flex items-center justify-center shrink-0 border border-white/10">
            <HiOutlineCreditCard className="text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              {language === 'ur' ? 'ایگری میکس والیٹ' : 'AgriMax Wallet'}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {language === 'ur' ? 'دستیاب رقم' : 'Available Balance'}
            </p>
          </div>
        </div>

        {isActive !== undefined && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
            isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}>
            {isActive ? (language === 'ur' ? 'فعال' : 'Active') : (language === 'ur' ? 'غیر فعال' : 'Inactive')}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
          <BdiSpan>{formatCurrency(balance, currency)}</BdiSpan>
        </span>
      </div>
    </div>
  );
}

/**
 * Sell Post Card: Confirms successful creation of a sell post.
 * Design: Modern success state card.
 */
export function SellPostCard({ data, language = 'ur' }) {
  if (!data || typeof data !== 'object') return null;

  const crop = data.crop;
  const cropUr = data.cropUr;
  const qty = data.quantity;
  const unit = data.unit || 'kg';
  const price = data.askingPrice || data.price;
  const status = data.status || 'ACTIVE';

  const displayName = language === 'ur' && cropUr ? cropUr : crop || (language === 'ur' ? 'فصل' : 'Crop');

  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <HiOutlineCheckBadge className="text-lg" />
          </div>
          <span className="text-sm font-bold text-slate-800">
            {language === 'ur' ? 'اشتہار کامیابی سے بن گیا!' : 'Post Created Successfully!'}
          </span>
        </div>
        <span className="text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
            {language === 'ur' ? 'فصل اور مقدار' : 'Crop & Quantity'}
          </span>
          <span className="font-bold text-slate-800 block truncate">
            {displayName} <span className="text-slate-400 mx-1">•</span> {qty} {unit}
          </span>
        </div>

        <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
          <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider block mb-1">
            {language === 'ur' ? 'طلب کردہ قیمت' : 'Asking Price'}
          </span>
          <span className="font-extrabold text-emerald-700 block text-base">
            <BdiSpan>{formatCurrency(price)}</BdiSpan>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Payment History Card: Renders payment transaction records.
 * Design: Clean table-like list with alternating rows.
 */
export function PaymentHistoryCard({ transactions, language = 'ur' }) {
  if (!Array.isArray(transactions) || transactions.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-w-0">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
          <HiClipboardDocumentList className="text-slate-400 text-base" />
          <span>{language === 'ur' ? 'حالیہ لین دین' : 'Recent Transactions'}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
          {transactions.length} {language === 'ur' ? 'ریکارڈز' : 'records'}
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
        {transactions.map((txn, idx) => {
          const isPositive = txn.amount > 0 || txn.type?.toLowerCase() === 'credit';
          
          return (
            <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {isPositive ? <HiOutlineArrowTrendingUp className="text-sm" /> : <HiOutlineArrowTrendingDown className="text-sm" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-700 text-xs truncate">
                    {txn.description || txn.type || (language === 'ur' ? 'لین دین' : 'Transaction')}
                  </p>
                  {txn.date && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      <BdiSpan>{formatValue('date', txn.date, language)}</BdiSpan>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`font-extrabold text-sm block ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {isPositive ? '+' : ''}<BdiSpan>{formatCurrency(txn.amount)}</BdiSpan>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Navigation Action Card: Displays destination route with clean arrow indicator.
 * Design: Interactive action button style.
 */
export function NavigationCard({ data, language = 'ur' }) {
  if (!data || data.action !== 'navigate') return null;

  const label = data.label || data.target;

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-sm text-indigo-900 shadow-sm group cursor-pointer hover:bg-indigo-100 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white text-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-base select-none">🧭</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
            {language === 'ur' ? 'صفحہ تبدیل کیا جا رہا ہے' : 'Navigating to'}
          </p>
          <p className="font-bold text-indigo-800 truncate">{label}</p>
        </div>
      </div>
      <HiArrowRight className="text-indigo-400 text-base shrink-0 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
    </div>
  );
}

/**
 * Capabilities Card: Displays clickable action chips for the HELP intent.
 * Design: Grid of interactive pills.
 */
export function CapabilitiesCard({ capabilities, onSelectAction, language = 'ur' }) {
  if (!Array.isArray(capabilities) || capabilities.length === 0) return null;

  const ACTION_PROMPTS = {
    GET_CROP_PRICE: { en: 'Wheat Price', ur: 'گندم کی قیمت' },
    CREATE_SELL_POST: { en: 'Sell Crops', ur: 'فصل بیچیں' },
    VIEW_WALLET: { en: 'My Wallet', ur: 'میرا والیٹ' },
    VIEW_PAYMENTS: { en: 'Payment History', ur: 'لین دین کی تفصیل' },
    LOGIN: { en: 'Login / Register', ur: 'لاگ ان کریں' },
    NAVIGATE: { en: 'Open Marketplace', ur: 'مارکیٹ کھولیں' },
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
      <p className="font-bold text-slate-700 text-xs flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        {language === 'ur' ? 'آپ یہ کام کر سکتے ہیں:' : 'Supported Actions:'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {capabilities.map((cap, i) => {
          const actionInfo = ACTION_PROMPTS[cap];
          const label = actionInfo
            ? language === 'ur'
              ? actionInfo.ur
              : actionInfo.en
            : humanizeKey(cap);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectAction && onSelectAction(label)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm active:scale-95 text-start truncate flex items-center justify-between group"
            >
              <span>{label}</span>
              <HiArrowRight className="text-slate-300 group-hover:text-indigo-400 rtl:rotate-180 text-xs shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Structured Rows Fallback:
 * For any arbitrary structured object, maps all keys to human labels and values
 * into clean rows with subtle dividers.
 */
export function StructuredRowsCard({ data, language = 'ur' }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  // Filter out internal fields
  const internalKeys = ['action', 'target', 'adviceEn', 'adviceUr'];
  const entries = Object.entries(data).filter(([k, v]) => {
    if (internalKeys.includes(k)) return false;
    if (v === null || v === undefined || v === '') return false;
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">
          {language === 'ur' ? 'تفصیلات' : 'Details'}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {entries.map(([key, val]) => {
          const label = getHumanKeyLabel(key, language);
          const formatted = formatValue(key, val, language);
          if (!formatted) return null;

          return (
            <div key={key} className="flex items-center justify-between px-4 py-2.5 text-xs gap-4 hover:bg-slate-50/50 transition-colors">
              <span className="text-slate-500 font-medium shrink-0">{label}</span>
              <span className="font-bold text-slate-800 text-right truncate">
                <BdiSpan>{formatted}</BdiSpan>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Universal Contextual Data & Result Renderer
 */
export default function AIContextRenderer({
  intent,
  result,
  onSelectAction,
  language = 'ur',
}) {
  if (!result) return null;

  if (Array.isArray(result)) {
    return <PaymentHistoryCard transactions={result} language={language} />;
  }

  if (typeof result !== 'object') return null;

  const hasPriceFields =
    result.minPrice !== undefined ||
    result.maxPrice !== undefined ||
    result.avgPrice !== undefined ||
    result.currentMinPrice !== undefined ||
    result.currentMaxPrice !== undefined ||
    result.currentAvgPrice !== undefined ||
    result.currentPrice !== undefined;

  if (intent === 'GET_CROP_PRICE' || (hasPriceFields && (result.crop || result.cropName || result.cropNameEn))) {
    return <CropPriceCard data={result} language={language} />;
  }

  if (intent === 'VIEW_WALLET' || (result.balance !== undefined && !result.postId)) {
    return <WalletCard data={result} language={language} />;
  }

  if (intent === 'CREATE_SELL_POST' || result.postId !== undefined) {
    return <SellPostCard data={result} language={language} />;
  }

  if (result.action === 'navigate') {
    return <NavigationCard data={result} language={language} />;
  }

  if (intent === 'HELP' && Array.isArray(result.capabilities)) {
    return (
      <CapabilitiesCard
        capabilities={result.capabilities}
        onSelectAction={onSelectAction}
        language={language}
      />
    );
  }

  return <StructuredRowsCard data={result} language={language} />;
}