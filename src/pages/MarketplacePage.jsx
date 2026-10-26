import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingCart,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineScale,
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineMicrophone,
  HiOutlineFunnel,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { marketplaceApi, catalogApi } from '../services/api';
import useAppStore from '../store/useAppStore';

// ── Helpers ──
const formatPKR = (amount) => {
  const num = Number(amount);
  return isNaN(num) ? '—' : `₨ ${num.toLocaleString('en-PK')}`;
};

const formatDate = (dateStr, isUrdu) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-PK', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
};

const STATUS_CONFIG = {
  ACTIVE: { en: 'Active', ur: 'فعال', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  COMPLETED: { en: 'Completed', ur: 'مکمل', classes: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  CANCELLED: { en: 'Cancelled', ur: 'منسوخ', classes: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const SORT_OPTIONS = [
  { id: 'newest', en: 'Newest First', ur: 'نئے پہلے' },
  { id: 'price-high', en: 'Price: High to Low', ur: 'قیمت: زیادہ سے کم' },
  { id: 'price-low', en: 'Price: Low to High', ur: 'قیمت: کم سے زیادہ' },
];

const STATUS_FILTERS = [
  { id: 'ALL', en: 'All', ur: 'تمام' },
  { id: 'ACTIVE', en: 'Active', ur: 'فعال' },
  { id: 'COMPLETED', en: 'Completed', ur: 'مکمل' },
  { id: 'CANCELLED', en: 'Cancelled', ur: 'منسوخ' },
];

export function MarketplacePage() {
  const navigate = useNavigate();

  // ✅ Only needed store data (no useVoice — massive re-render savings)
  const { isAuthenticated, language } = useAppStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      language: s.language,
    }))
  );

  const isUrdu = language === 'ur';

  // Data state
  const [posts, setPosts] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // UI state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const abortRef = useRef(null);

  // ✅ Fetch with real signal + optional error throwing for toast
  const fetchData = useCallback(async (isRefresh = false, throwOnError = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // ✅ Parallel fetch with real abort signals
      const [cropsRes, postsRes] = await Promise.allSettled([
        catalogApi.listCrops({ signal }),
        marketplaceApi.getActivePosts({ signal }),
      ]);

      // Handle abort
      if (signal.aborted) return;

      // Process crops
      if (cropsRes.status === 'fulfilled') {
        const map = {};
        (cropsRes.value?.data?.data || []).forEach((c) => { map[c.id] = c; });
        setCropsMap(map);
      }

      // Process posts
      if (postsRes.status === 'fulfilled') {
        setPosts(postsRes.value?.data?.data || []);
        setUnauthorized(false);
      } else {
        const err = postsRes.reason;
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setUnauthorized(true);
        } else if (err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
          const msg = isUrdu
            ? 'مارکیٹ پوسٹس لوڈ نہیں ہو سکیں۔ دوبارہ کوشش کریں۔'
            : 'Could not load marketplace posts. Please try again.';
          setError(msg);
          if (throwOnError) throw new Error(msg);
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED' || signal.aborted) return;
      const msg = isUrdu ? 'ڈیٹا لوڈ کرنے میں خرابی پیش آئی۔' : 'Failed to load marketplace data.';
      setError(msg);
      if (throwOnError) throw new Error(msg);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isUrdu]);

  // ✅ Only fetch on mount + auth change (no location.key)
  useEffect(() => {
    fetchData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchData, isAuthenticated]);

  // ── Derived Data ──
  const displayPosts = useMemo(() => {
    let result = [...posts];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((p) => {
        const crop = cropsMap[p.cropId] || {};
        return (
          crop.nameEn?.toLowerCase().includes(q) ||
          crop.nameUr?.includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          String(p.askingPrice).includes(q)
        );
      });
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }

    switch (sortBy) {
      case 'price-high':
        result.sort((a, b) => Number(b.askingPrice) - Number(a.askingPrice));
        break;
      case 'price-low':
        result.sort((a, b) => Number(a.askingPrice) - Number(b.askingPrice));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [posts, cropsMap, search, sortBy, statusFilter]);

  const stats = useMemo(() => {
    const total = posts.length;
    const active = posts.filter((p) => p.status === 'ACTIVE').length;
    const totalValue = posts.reduce((sum, p) => sum + (Number(p.askingPrice) || 0), 0);
    const uniqueCrops = new Set(posts.map((p) => p.cropId)).size;
    return { total, active, totalValue, uniqueCrops };
  }, [posts]);

  // ── Handlers ──
  const handleRefresh = useCallback(() => {
    toast.promise(
      fetchData(true, true), // ✅ throwOnError=true → toast shows real error
      {
        loading: isUrdu ? 'تازہ کر رہے ہیں...' : 'Refreshing...',
        success: isUrdu ? 'ڈیٹا تازہ ہو گیا!' : 'Data refreshed!',
        error: (err) => err?.message || (isUrdu ? 'تازہ نہیں ہو سکا' : 'Refresh failed'),
      },
      { id: 'market-refresh' }
    );
  }, [fetchData, isUrdu]);

  // ✅ Clean handoff — no setTimeout hack, no useVoice
  const handleSellVoice = useCallback(() => {
    const cmd = isUrdu ? 'میری فصل بیچنی ہے' : 'I want to sell my crop';
    navigate('/', { state: { autoVoiceCommand: cmd } });
  }, [navigate, isUrdu]);

  const handleVoiceLogin = useCallback(() => {
    const cmd = isUrdu ? 'لاگ ان کرو' : 'Login';
    navigate('/', { state: { autoVoiceCommand: cmd } });
  }, [navigate, isUrdu]);

  return (
    <div dir={isUrdu ? 'rtl' : 'ltr'} className="w-full max-w-7xl mx-auto pb-10 space-y-6 motion-safe:animate-fade-up">
      {/* HEADER */}
      <header className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-3">
              <HiOutlineSparkles className="text-sm" />
              {isUrdu ? 'لائیو مارکیٹ' : 'Live Marketplace'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {isUrdu ? 'زرعی مارکیٹ' : 'Agri Marketplace'}
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base mt-2 font-medium max-w-lg">
              {isUrdu ? 'کسانوں کی براہ راست خرید و فروخت — بغیر آڑھتی کے' : 'Direct farmer-to-buyer listings — no middlemen'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="shrink-0 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <HiOutlineArrowPath className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isUrdu ? 'تازہ کریں' : 'Refresh'}</span>
          </button>
        </div>

        {!unauthorized && !loading && posts.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatCard icon={<HiOutlineShoppingCart />} label={isUrdu ? 'کل' : 'Total'} value={stats.total} />
            <StatCard icon={<HiOutlineSparkles />} label={isUrdu ? 'فعال' : 'Active'} value={stats.active} />
            <StatCard icon={<HiOutlineScale />} label={isUrdu ? 'اقسام' : 'Crops'} value={stats.uniqueCrops} />
            <StatCard icon={<HiOutlineBanknotes />} label={isUrdu ? 'ویلیو' : 'Value'} value={formatPKR(stats.totalValue)} small />
          </div>
        )}
      </header>

      {/* QUICK SELL VOICE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">🌾</div>
            <div>
              <h2 className="font-bold text-amber-900 text-base sm:text-lg">
                {isUrdu ? 'اپنی فصل بیچنے کے لیے تیار ہیں؟' : 'Ready to sell your crop?'}
              </h2>
              <p className="text-amber-700 text-xs sm:text-sm mt-1 leading-relaxed">
                {isUrdu
                  ? 'بس بول دیں: "50 کلو گندم 3000 میں بیچنی ہے" اور پوسٹ خود بن جائے گی'
                  : 'Just speak: "Sell 50 kg wheat for 3000" and your post is created'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSellVoice}
            className="w-full sm:w-auto shrink-0 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <HiOutlineMicrophone className="text-lg" />
            <span>{isUrdu ? 'آواز سے بیچیں' : 'Sell via Voice'}</span>
          </button>
        </div>
      </div>

      {/* UNAUTHORIZED */}
      {unauthorized && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 mb-4">
            <HiOutlineLockClosed className="text-3xl" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">{isUrdu ? 'لاگ ان درکار ہے' : 'Login Required'}</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            {isUrdu ? 'مارکیٹ دیکھنے کے لیے لاگ ان کریں' : 'Please log in to browse marketplace posts'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              🔑 {isUrdu ? 'لاگ ان' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleVoiceLogin}
              className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <HiOutlineMicrophone className="text-lg" />
              {isUrdu ? 'آواز سے لاگ ان' : 'Voice Login'}
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && !unauthorized && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <p className="text-red-700 font-bold text-sm mb-3">❌ {error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            {isUrdu ? 'دوبارہ کوشش کریں' : 'Try Again'}
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      {!loading && !unauthorized && posts.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 min-w-0">
            <HiOutlineMagnifyingGlass className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-lg ${isUrdu ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isUrdu ? 'فصل، شہر یا قیمت تلاش کریں...' : 'Search crop, city or price...'}
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
            {/* ✅ Status Tabs (now includes Cancelled) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isUrdu ? f.ur : f.en}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer ${isUrdu ? 'pr-9 pl-9' : 'pr-9 pl-3'}`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{isUrdu ? opt.ur : opt.en}</option>
                ))}
              </select>
              <HiOutlineFunnel className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none ${isUrdu ? 'right-3' : 'left-3'}`} />
            </div>

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

      {/* EMPTY */}
      {!loading && !unauthorized && posts.length === 0 && !error && (
        <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mb-4">
            <HiOutlineShoppingCart className="text-4xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{isUrdu ? 'ابھی کوئی پوسٹ نہیں' : 'No listings yet'}</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
            {isUrdu ? 'پہلی پوسٹ لگائیں!' : 'Be the first to list!'}
          </p>
          <button
            type="button"
            onClick={handleSellVoice}
            className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
          >
            <HiOutlineMicrophone className="text-lg" />
            {isUrdu ? 'پہلی پوسٹ لگائیں' : 'Create First Listing'}
          </button>
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && !unauthorized && posts.length > 0 && displayPosts.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
          <p className="text-slate-500 font-medium">{isUrdu ? 'کوئی پوسٹ نہیں ملی' : 'No listings match'}</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-bold cursor-pointer hover:underline"
          >
            {isUrdu ? 'فلٹر صاف کریں' : 'Clear Filters'}
          </button>
        </div>
      )}

      {/* POSTS */}
      {!loading && !unauthorized && displayPosts.length > 0 && (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {displayPosts.map((post, idx) => {
            const cropInfo = cropsMap[post.cropId] || {};
            const cropNameEn = cropInfo.nameEn || 'Crop';
            const cropNameUr = cropInfo.nameUr || 'فصل';
            const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.ACTIVE;
            const formattedDate = formatDate(post.createdAt, isUrdu);

            return (
              <article
                key={post.id}
                className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer motion-safe:animate-fade-up [animation-fill-mode:both]"
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      🌾
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                        {isUrdu ? cropNameUr : cropNameEn}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {isUrdu ? cropNameEn : cropNameUr}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${post.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                    {isUrdu ? statusConfig.ur : statusConfig.en}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-xl p-3.5 mb-4 group-hover:from-emerald-100 group-hover:to-teal-100/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                        {isUrdu ? 'طلب' : 'Price'}
                      </p>
                      <p className="text-2xl font-black text-emerald-700 tracking-tighter">{formatPKR(post.askingPrice)}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        {isUrdu ? 'مقدار' : 'Qty'}
                      </p>
                      <p className="text-sm font-bold text-slate-700">{post.quantity} {post.unit || 'kg'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                  {post.location && (
                    <span className="flex items-center gap-1 truncate">
                      <HiOutlineMapPin className="text-sm text-slate-400 shrink-0" />
                      <span className="truncate">{post.location}</span>
                    </span>
                  )}
                  {formattedDate && (
                    <span className="flex items-center gap-1 shrink-0">
                      <HiOutlineCalendar className="text-sm text-slate-400" />
                      <span>{formattedDate}</span>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, small = false }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white">
      <div className="flex items-center gap-1.5 text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-1">
        <span className="text-sm">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`font-black tracking-tight truncate ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}

export default MarketplacePage;