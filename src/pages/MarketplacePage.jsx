import { useState, useEffect } from 'react';
import { marketplaceApi, catalogApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import useVoice from '../hooks/useVoice';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGES = {
  ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
  COMPLETED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function MarketplacePage() {
  const { isAuthenticated, language } = useAppStore();
  const { processCommand } = useVoice();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchMarketData() {
      try {
        try {
          const cropRes = await catalogApi.listCrops();
          if (cropRes.data?.data && !ignore) {
            const map = {};
            cropRes.data.data.forEach((c) => {
              map[c.id] = c;
            });
            setCropsMap(map);
          }
        } catch (e) {
          console.warn('Could not load crops catalog:', e);
        }

        const res = await marketplaceApi.getActivePosts();
        if (!ignore) {
          setPosts(res.data?.data || []);
          setError(null);
          setUnauthorized(false);
        }
      } catch (err) {
        if (!ignore) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setUnauthorized(true);
          } else {
            setError(
              language === 'ur'
                ? 'مارکیٹ پوسٹس لوڈ نہیں ہو سکیں۔ دوبارہ کوشش کریں۔'
                : 'Could not load marketplace posts. Please try again.'
            );
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchMarketData();
    return () => {
      ignore = true;
    };
  }, [language, isAuthenticated, refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleSellVoice = () => {
    navigate('/');
    processCommand(
      language === 'ur' ? 'میری فصل بیچنی ہے' : 'I want to sell my crop'
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full pb-10">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white urdu-text flex items-center gap-2">
            <span>🛒</span> <span>زرعی مارکیٹ (Marketplace)</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            {language === 'ur'
              ? 'کسانوں کی براہ راست فصلوں کی خرید و فروخت'
              : 'Direct farmer crop listings and bidding'}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
        >
          <span>🔄</span> <span>تازہ کریں</span>
        </button>
      </div>

      {/* ── Quick Sell Voice Action Card ── */}
      <div className="bg-gradient-to-r from-emerald-900/60 to-green-900/40 border border-green-600/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">
            🌾
          </div>
          <div>
            <h3 className="font-bold text-green-300 text-base sm:text-lg urdu-text">
              کیا آپ اپنی فصل بیچنا چاہتے ہیں؟
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              آواز میں کہیں: &ldquo;50 کلو گندم 3000 میں بیچنی ہے&rdquo;
            </p>
          </div>
        </div>
        <button
          onClick={handleSellVoice}
          className="w-full sm:w-auto px-5 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>🎤</span> <span>آواز سے فصل بیچیں</span>
        </button>
      </div>

      {/* ── Guest Login Prompt (if unauthorized / not logged in) ── */}
      {unauthorized && (
        <div className="bg-[#FEF3C7] border border-[#FCD34D] p-5 rounded-3xl text-center space-y-3 shadow-sm">
          <span className="text-4xl block">🔐</span>
          <h3 className="text-lg font-bold text-[#92400E] urdu-text">
            مارکیٹ پوسٹس دیکھنے کے لیے لاگ ان درکار ہے
          </h3>
          <p className="text-[#B45309] text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {language === 'ur'
              ? 'کسانوں کی سیکیورٹی کے لیے، مارکیٹ پوسٹس دیکھنے کے لیے لاگ ان کریں۔ آپ صرف بول کر اپنا فون نمبر بتا سکتے ہیں۔'
              : 'Please log in to browse live marketplace posts. You can log in using your voice.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-[#078747] hover:bg-[#056B3B] text-white font-bold rounded-xl text-sm shadow cursor-pointer"
            >
              🔑 لاگ ان صفحہ
            </button>
            <button
              onClick={() => {
                navigate('/');
                processCommand('لاگ ان کرو');
              }}
              className="px-5 py-2.5 bg-white hover:bg-[#F0F8F2] text-[#078747] border border-[#C8E6C9] rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎤</span> <span>آواز سے لاگ ان</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && !unauthorized && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-center space-y-2">
          <p className="font-bold urdu-text">❌ {error}</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-red-600 underline font-semibold cursor-pointer"
          >
            دوبارہ لوڈ کریں
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl border border-[#E2EAF0] animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* ── Posts Listing ── */}
      {!loading && !unauthorized && posts.length === 0 && !error && (
        <div className="bg-white border border-[#E2EAF0] p-10 rounded-3xl text-center space-y-3 shadow-sm">
          <span className="text-5xl block">📭</span>
          <h3 className="text-lg font-bold text-[#102A43] urdu-text">
            ابھی کوئی پوسٹ دستیاب نہیں ہے
          </h3>
          <p className="text-[#62758A] text-xs sm:text-sm">
            سب سے پہلے اپنی فصل بیچنے کے لیے آواز کا استعمال کریں۔
          </p>
          <button
            onClick={handleSellVoice}
            className="mt-2 px-5 py-2.5 bg-[#078747] hover:bg-[#056B3B] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
          >
            🌾 پہلی پوسٹ لگائیں
          </button>
        </div>
      )}

      {!loading && !unauthorized && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map((post) => {
            const cropInfo = cropsMap[post.cropId] || {};
            const cropNameEn = cropInfo.nameEn || 'Crop';
            const cropNameUr = cropInfo.nameUr || 'فصل';

            const formattedDate = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString('en-PK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';

            return (
              <div
                key={post.id}
                className="bg-white border border-[#E2EAF0] rounded-2xl p-4 shadow-sm hover:border-[#078747] transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">🌾</span>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-[#102A43] urdu-text">
                        {cropNameUr}{' '}
                        <span className="text-xs text-[#62758A] font-normal">
                          ({cropNameEn})
                        </span>
                      </h4>
                      <p className="text-xs text-[#62758A]">
                        مقدار: {post.quantity} {post.unit || 'kg'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      STATUS_BADGES[post.status] || STATUS_BADGES.ACTIVE
                    }`}
                  >
                    {post.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <div>
                    <span className="text-[11px] text-[#62758A] block">طلب کردہ قیمت:</span>
                    <span className="text-lg font-extrabold text-[#078747]">
                      ₨ {Number(post.askingPrice).toLocaleString('en-PK')}
                    </span>
                  </div>

                  {post.location && (
                    <span className="text-xs text-[#62758A] flex items-center gap-1">
                      📍 {post.location}
                    </span>
                  )}
                </div>

                {formattedDate && (
                  <p className="text-[10px] text-[#829AB1] text-right">
                    تاریخ: {formattedDate}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;
