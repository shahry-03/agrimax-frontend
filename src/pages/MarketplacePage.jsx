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
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineMicrophone,
  HiOutlineFunnel,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineHandRaised,
} from 'react-icons/hi2';
import { marketplaceApi, catalogApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import useAuth from '../hooks/useAuth';

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
  SOLD: { en: 'Sold', ur: 'فروخت شدہ', classes: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  COMPLETED: { en: 'Completed', ur: 'مکمل', classes: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  CANCELLED: { en: 'Cancelled', ur: 'منسوخ', classes: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  PENDING: { en: 'Pending', ur: 'زیر التواء', classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
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
  const { user, isAuthenticated, isBuyer, isFarmer } = useAuth();

  const { language } = useAppStore(
    useShallow((s) => ({
      language: s.language,
    }))
  );

  const isUrdu = language === 'ur';

  // Navigation tab: 'listings' | 'my-posts' | 'my-bids' | 'deals'
  const [activeTab, setActiveTab] = useState('listings');

  // Listings data
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [myDeals, setMyDeals] = useState([]);
  const [cropsMap, setCropsMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Filters & search
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Place Bid Modal state
  const [biddingPost, setBiddingPost] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);

  // View Bids on a Post Modal state (for seller)
  const [inspectPost, setInspectPost] = useState(null);
  const [postBids, setPostBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  // Deal action loading
  const [dealActionLoading, setDealActionLoading] = useState(null);

  const abortRef = useRef(null);

  // Fetch crops & posts
  const fetchData = useCallback(async (isRefresh = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [cropsRes, postsRes] = await Promise.allSettled([
        catalogApi.listCrops({ signal }),
        marketplaceApi.getActivePosts({ signal }),
      ]);

      if (signal.aborted) return;

      if (cropsRes.status === 'fulfilled') {
        const map = {};
        (cropsRes.value?.data?.data || []).forEach((c) => { map[c.id] = c; });
        setCropsMap(map);
      }

      if (postsRes.status === 'fulfilled') {
        setPosts(postsRes.value?.data?.data || []);
        setUnauthorized(false);
      } else {
        const err = postsRes.reason;
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setUnauthorized(true);
        } else if (err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
          setError(isUrdu ? 'مارکیٹ پوسٹس لوڈ نہیں ہو سکیں۔' : 'Could not load marketplace posts.');
        }
      }

      // If logged in, fetch user-specific data in background
      if (isAuthenticated) {
        if (isFarmer) {
          marketplaceApi.getMyPosts({ signal }).then((res) => {
            setMyPosts(res.data?.data || []);
          }).catch(() => {});
        }
        if (isBuyer) {
          marketplaceApi.getMyBids({ signal }).then((res) => {
            setMyBids(res.data?.data || []);
          }).catch(() => {});
        }
        marketplaceApi.getMyDeals({ signal }).then((res) => {
          setMyDeals(res.data?.data || []);
        }).catch(() => {});
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(isUrdu ? 'ڈیٹا لوڈ کرنے میں خرابی پیش آئی۔' : 'Failed to load marketplace data.');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, isBuyer, isFarmer, isUrdu]);

  useEffect(() => {
    fetchData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchData]);

  // Load bids for a specific seller post
  const handleOpenPostBids = async (post) => {
    setInspectPost(post);
    setLoadingBids(true);
    try {
      const res = await marketplaceApi.getPostBids(post.id);
      setPostBids(res.data?.data || []);
    } catch (err) {
      toast.error(isUrdu ? 'بولیاں لوڈ نہیں ہو سکیں' : 'Could not load bids');
    } finally {
      setLoadingBids(false);
    }
  };

  // Seller accepts a bid
  const handleAcceptBid = async (bidId) => {
    if (!window.confirm(isUrdu ? 'کیا آپ یہ بولی قبول کر کے سودا بنانا چاہتے ہیں؟' : 'Accept this bid and create a deal with escrow?')) {
      return;
    }
    try {
      await marketplaceApi.acceptBid(bidId);
      toast.success(isUrdu ? 'بولی قبول کر لی گئی! سودا اور ایسکرو تیار ہے۔' : 'Bid accepted! Deal created & payment secured in escrow.');
      setInspectPost(null);
      fetchData(true);
      setActiveTab('deals');
    } catch (err) {
      toast.error(err?.response?.data?.messageUr || err?.message || 'Could not accept bid');
    }
  };

  // Buyer submits a bid
  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!biddingPost || !bidPrice) return;
    setBidSubmitting(true);
    try {
      await marketplaceApi.placeBid(biddingPost.id, {
        bidPrice: Number(bidPrice),
        message: bidMessage.trim() || undefined,
      });
      toast.success(isUrdu ? 'آپ کی بولی کامیابی سے لگا دی گئی!' : 'Bid placed successfully!');
      setBiddingPost(null);
      setBidPrice('');
      setBidMessage('');
      fetchData(true);
    } catch (err) {
      toast.error(err?.response?.data?.messageUr || err?.message || 'Failed to place bid');
    } finally {
      setBidSubmitting(false);
    }
  };

  // Complete deal (buyer confirms delivery)
  const handleCompleteDeal = async (dealId) => {
    if (!window.confirm(isUrdu ? 'کیا آپ ڈیلیوری کی تصدیق کر کے رقم جاری کرنا چاہتے ہیں؟' : 'Confirm delivery and release funds to seller?')) {
      return;
    }
    setDealActionLoading(dealId);
    try {
      await marketplaceApi.completeDeal(dealId);
      toast.success(isUrdu ? 'سودا مکمل ہو گیا! رقم جاری کر دی گئی۔' : 'Deal completed! Payment released to seller.');
      fetchData(true);
    } catch (err) {
      toast.error(err?.response?.data?.messageUr || err?.message || 'Failed to complete deal');
    } finally {
      setDealActionLoading(null);
    }
  };

  // Cancel deal (refunds escrow)
  const handleCancelDeal = async (dealId) => {
    if (!window.confirm(isUrdu ? 'کیا آپ واقعی سودا منسوخ کر کے رقم واپس لینا چاہتے ہیں؟' : 'Cancel deal and refund payment from escrow?')) {
      return;
    }
    setDealActionLoading(dealId);
    try {
      await marketplaceApi.cancelDeal(dealId);
      toast.success(isUrdu ? 'سودا منسوخ کر دیا گیا اور رقم واپس کر دی گئی۔' : 'Deal cancelled & payment refunded.');
      fetchData(true);
    } catch (err) {
      toast.error(err?.response?.data?.messageUr || err?.message || 'Failed to cancel deal');
    } finally {
      setDealActionLoading(null);
    }
  };

  // Filtered Listings
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
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'price-high') return Number(b.askingPrice) - Number(a.askingPrice);
      if (sortBy === 'price-low') return Number(a.askingPrice) - Number(b.askingPrice);
      return 0;
    });
    return result;
  }, [posts, search, statusFilter, sortBy, cropsMap]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header & Stats Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold mb-3 border border-white/10">
              <HiOutlineSparkles />
              <span>{isUrdu ? 'زرعی مارکیٹ اور براہ راست بولی' : 'Direct Agricultural Marketplace'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {isUrdu ? 'ایگری میکس منڈی اور سودے' : 'AgriMax Marketplace'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1 leading-relaxed">
              {isUrdu
                ? 'کسان براہ راست اپنی فصلیں لسٹ کریں اور خریدار محفوظ ایسکرو ادائیگی کے ساتھ بولی لگائیں۔'
                : 'Farmers list directly, buyers bid competitively with bank-grade escrow protection.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlineArrowPath className={`text-base ${refreshing ? 'animate-spin' : ''}`} />
              <span>{isUrdu ? 'تازہ کریں' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            🛒 {isUrdu ? 'مارکیٹ پوسٹس' : 'Active Listings'} ({posts.length})
          </button>

          {isAuthenticated && (
            <>
              {isFarmer && (
                <button
                  type="button"
                  onClick={() => setActiveTab('my-posts')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'my-posts'
                      ? 'bg-white text-emerald-800 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  🌾 {isUrdu ? 'میری پوسٹس اور بولیاں' : 'My Listings & Bids'} ({myPosts.length})
                </button>
              )}

              {isBuyer && (
                <button
                  type="button"
                  onClick={() => setActiveTab('my-bids')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'my-bids'
                      ? 'bg-white text-emerald-800 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  🏷️ {isUrdu ? 'میری بولیاں' : 'My Bids'} ({myBids.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('deals')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'deals'
                    ? 'bg-white text-emerald-800 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                🤝 {isUrdu ? 'سودے اور ایسکرو' : 'Deals & Escrow'} ({myDeals.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ACTIVE MARKETPLACE LISTINGS
      ────────────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === f.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
                  className={`appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer ${isUrdu ? 'pr-9 pl-9' : 'pr-9 pl-3'}`}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{isUrdu ? opt.ur : opt.en}</option>
                  ))}
                </select>
                <HiOutlineFunnel className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none ${isUrdu ? 'right-3' : 'left-3'}`} />
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold uppercase">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading listings...'}</p>
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
              <HiOutlineShoppingCart className="text-4xl text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">{isUrdu ? 'کوئی پوسٹ نہیں ملی' : 'No listings found'}</h3>
              <p className="text-xs text-slate-400 mt-1">{isUrdu ? 'فلٹر صاف کریں یا بعد میں دوبارہ چیک کریں۔' : 'Try clearing filters or check back later.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPosts.map((post) => {
                const crop = cropsMap[post.cropId] || {};
                const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.ACTIVE;

                return (
                  <article
                    key={post.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">
                            {isUrdu ? crop.nameUr || 'فصل' : crop.nameEn || 'Crop Listing'}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {isUrdu ? crop.nameEn : crop.nameUr}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.classes}`}>
                          {isUrdu ? statusCfg.ur : statusCfg.en}
                        </span>
                      </div>

                      {/* Price Block */}
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">
                            {isUrdu ? 'طلب کردہ قیمت' : 'Asking Price'}
                          </p>
                          <p className="text-xl font-black text-emerald-800">{formatPKR(post.askingPrice)}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {isUrdu ? 'مقدار' : 'Quantity'}
                          </p>
                          <p className="text-sm font-bold text-slate-700">{post.quantity} {post.unit || 'kg'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="text-sm" />
                          <span>{post.location || (isUrdu ? 'پنجاب' : 'Punjab')}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendar className="text-sm" />
                          <span>{formatDate(post.createdAt, isUrdu)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action: Place Bid (if Buyer) or View Status */}
                    {post.status === 'ACTIVE' && (
                      <div>
                        {isBuyer ? (
                          <button
                            type="button"
                            onClick={() => {
                              setBiddingPost(post);
                              setBidPrice(String(post.askingPrice));
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-98"
                          >
                            <HiOutlineHandRaised className="text-sm" />
                            <span>{isUrdu ? 'بولی لگائیں (Place Bid)' : 'Place Bid'}</span>
                          </button>
                        ) : !isAuthenticated ? (
                          <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                          >
                            {isUrdu ? 'بولی کے لیے لاگ ان کریں' : 'Sign In to Bid'}
                          </button>
                        ) : (
                          <div className="text-center py-1 text-xs text-slate-400 font-medium">
                            {isUrdu ? 'کسان لسٹنگ فعال ہے' : 'Active Listing'}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: MY LISTINGS & RECEIVED BIDS (SELLER/FARMER)
      ────────────────────────────────────────────────────────────── */}
      {activeTab === 'my-posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              {isUrdu ? 'میری لسٹ کردہ فصلیں اور موصول شدہ بولیاں' : 'My Listings & Incoming Bids'}
            </h2>
          </div>

          {myPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center">
              <p className="text-slate-500 text-sm">{isUrdu ? 'آپ کی ابھی کوئی لسٹنگ نہیں ہے۔' : 'You have no listings yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPosts.map((post) => {
                const crop = cropsMap[post.cropId] || {};
                return (
                  <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{isUrdu ? crop.nameUr || 'فصل' : crop.nameEn || 'Crop'}</h3>
                        <p className="text-xs text-slate-400">{post.quantity} {post.unit || 'kg'} · {formatPKR(post.askingPrice)}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {post.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPostBids(post)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlineTag className="text-sm text-emerald-600" />
                      <span>{isUrdu ? 'اس فصل پر بولیاں دیکھیں' : 'View Bids on This Listing'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: MY BIDS (BUYER)
      ────────────────────────────────────────────────────────────── */}
      {activeTab === 'my-bids' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            {isUrdu ? 'میری لگائی گئی بولیاں' : 'My Submitted Bids'}
          </h2>

          {myBids.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center">
              <p className="text-slate-500 text-sm">{isUrdu ? 'آپ نے ابھی کوئی بولی نہیں لگائی۔' : 'You have not placed any bids yet.'}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {myBids.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{formatPKR(b.bidPrice)}</p>
                      <p className="text-xs text-slate-400">
                        {b.message ? `"${b.message}"` : (isUrdu ? 'بغیر پیغام' : 'No message')} · {formatDate(b.createdAt, isUrdu)}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      b.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: DEALS & ESCROW (BUYER & SELLER)
      ────────────────────────────────────────────────────────────── */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <HiOutlineShieldCheck className="text-emerald-700 text-2xl shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              {isUrdu
                ? 'ایگری میکس ایسکرو گارنٹی: خریدار کی رقم محفوظ ایسکرو اکاؤنٹ میں رکھی جاتی ہے جب تک کہ وہ ڈیلیوری وصول کر کے تصدیق نہ کر دے۔'
                : 'AgriMax Escrow Protection: Funds are locked safely in escrow until the buyer confirms crop delivery.'}
            </p>
          </div>

          {myDeals.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center">
              <p className="text-slate-500 text-sm">{isUrdu ? 'ابھی کوئی فعال سودا نہیں ہے۔' : 'No deals found.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDeals.map((deal) => {
                const isDealBuyer = user?.id === deal.buyerId;

                return (
                  <div key={deal.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deal #{String(deal.id).slice(0, 8)}</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{formatPKR(deal.amount)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        deal.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : deal.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {deal.status === 'PENDING' ? (isUrdu ? 'ایسکرو محفوظ (HELD)' : 'In Escrow (HELD)') : deal.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                      <p>
                        <span className="font-semibold">{isUrdu ? 'کردار:' : 'Role:'}</span>{' '}
                        {isDealBuyer ? (isUrdu ? 'آپ خریدار ہیں' : 'You are Buyer') : (isUrdu ? 'آپ بیچنے والے (کسان) ہیں' : 'You are Seller')}
                      </p>
                      <p>
                        <span className="font-semibold">{isUrdu ? 'تاریخ:' : 'Date:'}</span> {formatDate(deal.createdAt, isUrdu)}
                      </p>
                    </div>

                    {/* Deal Actions for Buyer if PENDING */}
                    {deal.status === 'PENDING' && isDealBuyer && (
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleCompleteDeal(deal.id)}
                          disabled={dealActionLoading === deal.id}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                        >
                          <HiOutlineCheckCircle className="text-base" />
                          <span>{isUrdu ? 'ڈیلیوری مل گئی — پیسے دیں' : 'Confirm Delivery'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelDeal(deal.id)}
                          disabled={dealActionLoading === deal.id}
                          className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <HiOutlineXCircle className="text-base" />
                          <span>{isUrdu ? 'منسوخ کریں' : 'Cancel'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PLACE BID (BUYER)
      ────────────────────────────────────────────────────────────── */}
      {biddingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setBiddingPost(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <HiOutlineXMark className="text-xl" />
            </button>

            <h3 className="text-lg font-bold text-slate-800">
              {isUrdu ? 'بولی لگائیں (Place Bid)' : 'Submit Your Bid'}
            </h3>
            <p className="text-xs text-slate-500">
              {isUrdu ? 'طلب کردہ قیمت:' : 'Asking Price:'} <strong>{formatPKR(biddingPost.askingPrice)}</strong> ({biddingPost.quantity} {biddingPost.unit || 'kg'})
            </p>

            <form onSubmit={handleSubmitBid} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isUrdu ? 'آپ کی پیشکش (روپے)' : 'Your Bid Price (PKR)'}
                </label>
                <input
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  required
                  min={1}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isUrdu ? 'پیغام (اختیاری)' : 'Message to Seller (optional)'}
                </label>
                <input
                  type="text"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder={isUrdu ? 'مثال: کوالٹی اچھی ہو تو آج ہی اٹھا لوں گا' : 'e.g. Can pick up today if grade A'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={bidSubmitting || !bidPrice}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {bidSubmitting ? (isUrdu ? 'بولی بھیجی جا رہی ہے...' : 'Placing bid...') : (isUrdu ? 'بولی جمع کرائیں' : 'Confirm Bid')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: VIEW & ACCEPT BIDS (SELLER)
      ────────────────────────────────────────────────────────────── */}
      {inspectPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setInspectPost(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <HiOutlineXMark className="text-xl" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isUrdu ? 'فصل پر موصول شدہ بولیاں' : 'Bids on this Listing'}
              </h3>
              <p className="text-xs text-slate-500">
                {inspectPost.quantity} {inspectPost.unit || 'kg'} · {formatPKR(inspectPost.askingPrice)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
              {loadingBids ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold">{isUrdu ? 'بولیاں لوڈ ہو رہی ہیں...' : 'Loading bids...'}</div>
              ) : postBids.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">{isUrdu ? 'ابھی کوئی بولی موصول نہیں ہوئی۔' : 'No bids placed yet on this post.'}</div>
              ) : (
                postBids.map((b) => (
                  <div key={b.id} className="pt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold text-slate-800">{formatPKR(b.bidPrice)}</p>
                      <p className="text-xs text-slate-500">{b.message || (isUrdu ? 'کوئی پیغام نہیں' : 'No message')}</p>
                      <span className="text-[10px] text-slate-400">{formatDate(b.createdAt, isUrdu)}</span>
                    </div>

                    {b.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptBid(b.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        {isUrdu ? 'قبول کریں' : 'Accept Bid'}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                        {b.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;