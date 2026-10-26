import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiOutlineChartBar,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineMinus,
  HiOutlineStar,
  HiStar,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineMicrophone,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { catalogApi } from '../services/api';
import useAppStore from '../store/useAppStore';

// ── Crop emoji + category mapping ──
const CROP_META = {
  Wheat: { emoji: '🌾', category: 'grain' },
  Rice: { emoji: '🍚', category: 'grain' },
  Corn: { emoji: '🌽', category: 'grain' },
  Cotton: { emoji: '🧶', category: 'fiber' },
  Sugarcane: { emoji: '🎋', category: 'cash' },
  Mustard: { emoji: '🌿', category: 'oilseed' },
  Chickpea: { emoji: '🫘', category: 'pulse' },
  Lentil: { emoji: '🍲', category: 'pulse' },
  Mango: { emoji: '🥭', category: 'fruit' },
  Potato: { emoji: '🥔', category: 'vegetable' },
  Onion: { emoji: '🧅', category: 'vegetable' },
  Tomato: { emoji: '🍅', category: 'vegetable' },
};

const CATEGORY_LABELS = {
  all: { en: 'All Crops', ur: 'تمام فصلیں' },
  grain: { en: 'Grains', ur: 'اناج' },
  vegetable: { en: 'Vegetables', ur: 'سبزیاں' },
  fruit: { en: 'Fruits', ur: 'پھل' },
  pulse: { en: 'Pulses', ur: 'دالیں' },
  cash: { en: 'Cash Crops', ur: 'نقدی فصلیں' },
  oilseed: { en: 'Oilseeds', ur: 'تیل دار بیج' },
  fiber: { emoji: '🧶', en: 'Fiber', ur: 'ریشہ' },
};

const SORT_OPTIONS = [
  { id: 'name', en: 'Name (A-Z)', ur: 'نام (ا-ی)' },
  { id: 'price-high', en: 'Price: High to Low', ur: 'قیمت: زیادہ سے کم' },
  { id: 'price-low', en: 'Price: Low to High', ur: 'قیمت: کم سے زیادہ' },
  { id: 'range', en: 'Biggest Range', ur: 'سب سے بڑی رینج' },
];

// Format PKR
const formatPKR = (amount) => {
  const num = Number(amount);
  return isNaN(num) ? '—' : `₨ ${num.toLocaleString('en-PK')}`;
};

// Compute trend from min/max (mock — replace with real prev-day data)
const computeTrend = (price) => {
  if (!price || price.minPrice === undefined || price.maxPrice === undefined) {
    return { direction: 'flat', percent: 0 };
  }
  const min = Number(price.minPrice);
  const max = Number(price.maxPrice);
  const avg = Number(price.avgPrice || (min + max) / 2);
  if (!max || !min) return { direction: 'flat', percent: 0 };
  // Mock: position of avg within range → higher avg = up trend indicator
  const positionInRange = (avg - min) / (max - min);
  if (positionInRange > 0.6) return { direction: 'up', percent: ((avg - min) / min * 100).toFixed(1) };
  if (positionInRange < 0.4) return { direction: 'down', percent: ((min - avg) / max * 100).toFixed(1) };
  return { direction: 'flat', percent: 0 };
};

// Format last-updated time
const formatTime = (timestamp, isUrdu) => {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isUrdu ? 'ابھی' : 'Just now';
  if (mins < 60) return isUrdu ? `${mins} منٹ پہلے` : `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return isUrdu ? `${hours} گھنٹے پہلے` : `${hours}h ago`;
  return new Date(timestamp).toLocaleTimeString(isUrdu ? 'ur-PK' : 'en-PK', {
    hour: '2-digit', minute: '2-digit',
  });
};

export default function PricesPage() {
  const navigate = useNavigate();

  const { language } = useAppStore(
    useShallow((s) => ({ language: s.language }))
  );
  const isUrdu = language === 'ur';

  // Data state
  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // UI state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('agrimax_favorite_crops') || '[]');
    } catch { return []; }
  });

  const abortRef = useRef(null);

  // ── Fetch crops + prices (parallel, abortable) ──
  const fetchPrices = useCallback(async (isRefresh = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data } = await catalogApi.listCrops({ signal });
      if (signal.aborted) return;

      const cropList = data?.data || [];
      setCrops(cropList);

      // Fetch all prices in parallel
      const priceMap = {};
      await Promise.allSettled(
        cropList.map(async (crop) => {
          try {
            const { data: priceData } = await catalogApi.getCropPrice(crop.id, { signal });
            if (priceData?.data && !signal.aborted) {
              priceMap[crop.id] = priceData.data;
            }
          } catch (e) {
            if (e?.name !== 'AbortError') {
              console.warn(`[Prices] Failed to load price for ${crop.nameEn}:`, e?.message);
            }
          }
        })
      );

      if (!signal.aborted) {
        setPrices(priceMap);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      if (err?.name === 'AbortError' || signal.aborted) return;
      setError(
        isUrdu ? 'قیمتوں کا ڈیٹا لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔' : 'Failed to load crop prices. Please try again.'
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isUrdu]);

  // ── Initial fetch ──
  useEffect(() => {
    fetchPrices();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchPrices]);

  // ── Favorites persistence ──
  useEffect(() => {
    try {
      localStorage.setItem('agrimax_favorite_crops', JSON.stringify(favorites));
    } catch { /* ignore */ }
  }, [favorites]);

  // ── Filtered, sorted crops ──
  const displayCrops = useMemo(() => {
    let list = [...crops];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) =>
        c.nameEn?.toLowerCase().includes(q) ||
        c.nameUr?.includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((c) => {
        const meta = CROP_META[c.nameEn];
        return meta?.category === categoryFilter;
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-high':
        list.sort((a, b) => {
          const aP = Number(prices[a.id]?.avgPrice) || 0;
          const bP = Number(prices[b.id]?.avgPrice) || 0;
          return bP - aP;
        });
        break;
      case 'price-low':
        list.sort((a, b) => {
          const aP = Number(prices[a.id]?.avgPrice) || 0;
          const bP = Number(prices[b.id]?.avgPrice) || 0;
          return aP - bP;
        });
        break;
      case 'range':
        list.sort((a, b) => {
          const aR = (Number(prices[a.id]?.maxPrice) || 0) - (Number(prices[a.id]?.minPrice) || 0);
          const bR = (Number(prices[b.id]?.maxPrice) || 0) - (Number(prices[b.id]?.minPrice) || 0);
          return bR - aR;
        });
        break;
      case 'name':
      default:
        list.sort((a, b) => (a.nameEn || '').localeCompare(b.nameEn || ''));
    }

    return list;
  }, [crops, prices, search, sortBy, categoryFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const totalCrops = crops.length;
    const available = Object.keys(prices).length;
    const avgPrice = available > 0
      ? Math.round(Object.values(prices).reduce((s, p) => s + (Number(p.avgPrice) || 0), 0) / available)
      : 0;
    return { totalCrops, available, avgPrice };
  }, [crops, prices]);

  // ── Handlers ──
  const handleRefresh = useCallback(() => {
    toast.promise(
      fetchPrices(true),
      {
        loading: isUrdu ? 'تازہ کر رہے ہیں...' : 'Refreshing...',
        success: isUrdu ? 'قیمتیں تازہ ہو گئیں!' : 'Prices refreshed!',
        error: isUrdu ? 'تازہ نہیں ہو سکا' : 'Refresh failed',
      },
      { id: 'prices-refresh' }
    );
  }, [fetchPrices, isUrdu]);

  const toggleFavorite = useCallback((cropId, e) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(cropId) ? prev.filter((id) => id !== cropId) : [...prev, cropId]
    );
  }, []);

  const handleAskPrice = useCallback((crop) => {
    const name = isUrdu ? crop.nameUr : crop.nameEn;
    const cmd = isUrdu ? `${name} کی قیمت بتاؤ` : `Price of ${name}`;
    navigate('/', { state: { autoVoiceCommand: cmd } });
  }, [navigate, isUrdu]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="w-full max-w-7xl mx-auto pb-10 space-y-6 motion-safe:animate-fade-up"
    >
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-3">
              <HiOutlineSparkles className="text-sm" />
              {isUrdu ? 'لائیو منڈی' : 'Live Mandi'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {isUrdu ? 'منڈی کے ریٹس' : 'Mandi Prices'}
            </h1>
            <p className="text-slate-300 text-sm mt-2 font-medium max-w-lg">
              {isUrdu
                ? 'آج کی تازہ ترین زرعی قیمتیں — تمام بڑی منڈیوں سے'
                : "Today's agricultural market rates — from all major mandis"}
            </p>
            {lastUpdated && (
              <div className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-slate-400 font-medium">
                <HiOutlineClock className="text-sm" />
                {isUrdu ? 'آخری اپڈیٹ:' : 'Last updated:'}{' '}
                <span className="text-emerald-400 font-bold">{formatTime(lastUpdated, isUrdu)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="shrink-0 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <HiOutlineArrowPath className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isUrdu ? 'تازہ کریں' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stats */}
        {!loading && crops.length > 0 && (
          <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
            <StatCard icon={<HiOutlineChartBar />} label={isUrdu ? 'کل فصلیں' : 'Crops'} value={stats.totalCrops} />
            <StatCard icon={<HiOutlineSparkles />} label={isUrdu ? 'دستیاب' : 'Available'} value={stats.available} />
            <StatCard icon={<HiOutlineArrowTrendingUp />} label={isUrdu ? 'اوسط' : 'Avg'} value={`₨ ${stats.avgPrice.toLocaleString('en-PK')}`} small />
          </div>
        )}
      </header>

      {/* ═══════════════ ERROR ═══════════════ */}
      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3">
          <HiOutlineExclamationTriangle className="text-rose-500 text-xl shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-rose-800 font-bold text-sm">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              {isUrdu ? 'دوبارہ کوشش کریں' : 'Try Again'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ SEARCH & FILTERS ═══════════════ */}
      {!loading && crops.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <HiOutlineMagnifyingGlass className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-lg ${isUrdu ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isUrdu ? 'فصل تلاش کریں...' : 'Search crops...'}
              className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all ${isUrdu ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${isUrdu ? 'left-2' : 'right-2'}`}
                aria-label="Clear"
              >
                <HiOutlineXMark className="text-sm" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category pills (scrollable) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
              {Object.entries(CATEGORY_LABELS).map(([key, labels]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    categoryFilter === key
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isUrdu ? labels.ur : labels.en}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer ${isUrdu ? 'pr-9 pl-9' : 'pr-9 pl-3'}`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isUrdu ? opt.ur : opt.en}
                  </option>
                ))}
              </select>
              <HiOutlineFunnel className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none ${isUrdu ? 'right-3' : 'left-3'}`} />
            </div>

            {/* View mode */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Grid"
              >
                <HiOutlineSquares2X2 className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="List"
              >
                <HiOutlineBars3 className="text-base" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ LOADING SKELETON ═══════════════ */}
      {loading && (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ EMPTY (No Crops) ═══════════════ */}
      {!loading && crops.length === 0 && !error && (
        <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mb-4">
            <HiOutlineChartBar className="text-4xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {isUrdu ? 'کوئی فصل دستیاب نہیں' : 'No crops available'}
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
            {isUrdu ? 'ڈیٹا جلد دستیاب ہوگا' : 'Data will be available shortly'}
          </p>
        </div>
      )}

      {/* ═══════════════ NO RESULTS (Filter) ═══════════════ */}
      {!loading && crops.length > 0 && displayCrops.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
          <p className="text-slate-500 font-medium">
            {isUrdu ? 'کوئی فصل نہیں ملی' : 'No crops match your filters'}
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setCategoryFilter('all'); }}
            className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-bold cursor-pointer hover:underline"
          >
            {isUrdu ? 'فلٹر صاف کریں' : 'Clear Filters'}
          </button>
        </div>
      )}

      {/* ═══════════════ CROPS GRID/LIST ═══════════════ */}
      {!loading && displayCrops.length > 0 && (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {displayCrops.map((crop, idx) => {
            const price = prices[crop.id];
            const meta = CROP_META[crop.nameEn] || { emoji: '🌱', category: 'other' };
            const isFavorite = favorites.includes(crop.id);
            const trend = computeTrend(price);
            const hasPrice = !!price;
            const isUp = trend.direction === 'up';
            const isDown = trend.direction === 'down';

            return (
              <article
                key={crop.id}
                onClick={() => hasPrice && handleAskPrice(crop)}
                role={hasPrice ? 'button' : undefined}
                tabIndex={hasPrice ? 0 : undefined}
                onKeyDown={(e) => {
                  if (hasPrice && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleAskPrice(crop);
                  }
                }}
                className={`group relative bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 motion-safe:animate-fade-up [animation-fill-mode:both] ${
                  hasPrice
                    ? 'border-slate-200 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-0.5 cursor-pointer'
                    : 'border-slate-200 opacity-70'
                }`}
                style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
              >
                {/* Favorite star button */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(crop.id, e)}
                  className={`absolute top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isFavorite
                      ? 'bg-amber-100 text-amber-500 shadow-sm'
                      : 'bg-white/80 text-slate-400 hover:text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100'
                  } ${isUrdu ? 'left-3' : 'right-3'}`}
                  aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
                >
                  {isFavorite ? <HiStar className="text-sm" /> : <HiOutlineStar className="text-sm" />}
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors ${isUrdu ? 'urdu-text' : ''}`}>
                      {isUrdu ? crop.nameUr : crop.nameEn}
                    </h3>
                    <p className={`text-[11px] text-slate-500 font-medium truncate ${isUrdu ? '' : 'urdu-text'}`}>
                      {isUrdu ? crop.nameEn : crop.nameUr} • {crop.unit || 'kg'}
                    </p>
                  </div>
                </div>

                {/* Price block */}
                {hasPrice ? (
                  <div className={`rounded-xl p-3.5 mb-3 transition-colors ${
                    isUp
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 group-hover:from-emerald-100'
                      : isDown
                      ? 'bg-gradient-to-br from-rose-50 to-orange-50/50 border border-rose-100 group-hover:from-rose-100'
                      : 'bg-gradient-to-br from-slate-50 to-slate-50 border border-slate-100 group-hover:from-slate-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                          isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {isUrdu ? 'اوسط قیمت' : 'Avg Price'}
                        </p>
                        <p className={`text-2xl font-black tracking-tighter ${
                          isUp ? 'text-emerald-700' : isDown ? 'text-rose-700' : 'text-slate-700'
                        }`}>
                          {formatPKR(price.avgPrice)}
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUp ? 'bg-emerald-500/15 text-emerald-600'
                        : isDown ? 'bg-rose-500/15 text-rose-600'
                        : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isUp ? <HiOutlineArrowTrendingUp className="text-lg" />
                        : isDown ? <HiOutlineArrowTrendingDown className="text-lg" />
                        : <HiOutlineMinus className="text-lg" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-current/10">
                      <span className="font-semibold text-slate-500">
                        {isUrdu ? 'رینج:' : 'Range:'} {formatPKR(price.minPrice)} – {formatPKR(price.maxPrice)}
                      </span>
                      {price.marketName && (
                        <span className="font-medium text-slate-400 truncate max-w-[100px]" title={price.marketName}>
                          📍 {price.marketName}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 mb-3 bg-slate-50 border border-dashed border-slate-300 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      {isUrdu ? 'قیمت زیر التوا' : 'Price pending'}
                    </p>
                  </div>
                )}

                {/* Ask action */}
                {hasPrice ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAskPrice(crop); }}
                    className="w-full py-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95 inline-flex items-center justify-center gap-1.5"
                  >
                    <HiOutlineMicrophone className="text-sm" />
                    {isUrdu ? 'آواز سے پوچھیں' : 'Ask via Voice'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                  >
                    <HiOutlineClock className="text-sm" />
                    {isUrdu ? 'جلد دستیاب' : 'Coming Soon'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ═══════════════ FOOTER SUMMARY ═══════════════ */}
      {!loading && displayCrops.length > 0 && (
        <p className="text-center text-[11px] text-slate-400 font-medium pt-2">
          {isUrdu
            ? `${crops.length} میں سے ${displayCrops.length} فصلیں دکھ رہی ہیں`
            : `Showing ${displayCrops.length} of ${crops.length} crops`}
          {favorites.length > 0 && ` • ${favorites.length} ⭐ ${isUrdu ? 'پسندیدہ' : 'favorites'}`}
        </p>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, small = false }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white">
      <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">
        <span className="text-sm">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`font-black tracking-tight truncate ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}