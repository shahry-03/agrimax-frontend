import { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import useVoice from '../hooks/useVoice';
import { useNavigate } from 'react-router-dom';

const CROP_EMOJIS = {
  Wheat: '🌾',
  Rice: '🍚',
  Corn: '🌽',
  Cotton: '🧶',
  Sugarcane: '🎋',
  Mustard: '🌿',
  Chickpea: '🫘',
  Lentil: '🍲',
  Mango: '🥭',
  Potato: '🥔',
  Onion: '🧅',
  Tomato: '🍅',
};

export default function PricesPage() {
  const { language } = useAppStore();
  const { processCommand } = useVoice();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchPrices() {
      try {
        const { data } = await catalogApi.listCrops();
        const cropList = data.data || [];
        if (ignore) return;
        setCrops(cropList);

        const priceMap = {};
        await Promise.all(
          cropList.map(async (crop) => {
            try {
              const { data: priceData } = await catalogApi.getCropPrice(crop.id);
              if (priceData.data) priceMap[crop.id] = priceData.data;
            } catch {
              // Price fetch failed for this crop
            }
          })
        );
        if (!ignore) setPrices(priceMap);
      } catch (err) {
        console.warn('Failed to load crop prices:', err);
        if (!ignore) {
          setError(
            language === 'ur'
              ? 'قیمتوں کا ڈیٹا لوڈ نہیں ہو سکا۔'
              : 'Failed to load crop prices.'
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchPrices();
    return () => {
      ignore = true;
    };
  }, [language, refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleAskPrice = (cropName) => {
    navigate('/');
    processCommand(
      language === 'ur' ? `${cropName} کی قیمت بتاؤ` : `Price of ${cropName}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold urdu-text flex items-center gap-2">
            <span>📊</span> <span>آج کی منڈی کے ریٹ</span>
          </h2>
          <p className="text-xs text-slate-400">Live Agricultural Market Rates</p>
        </div>
        <button
          onClick={handleRefresh}
          className="text-xs px-3 py-1.5 bg-white border border-[#E2EAF0] hover:bg-[#F0F8F2] text-[#102A43] rounded-xl transition cursor-pointer shadow-2xs"
        >
          🔄 تازہ کریں
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center text-xs">
          ❌ {error}
        </div>
      )}

      <div className="space-y-2.5">
        {crops.map((crop, i) => {
          const price = prices[crop.id];
          const emoji = CROP_EMOJIS[crop.nameEn] || '🌱';
          return (
            <div
              key={crop.id}
              onClick={() => handleAskPrice(crop.nameUr || crop.nameEn)}
              className="glass-card p-4 flex items-center gap-4 hover:border-[#078747] hover:shadow-sm cursor-pointer transition-all animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
              title="آواز سے تفصیل معلوم کریں"
            >
              <span className="text-3xl">{emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-base text-[#102A43] urdu-text">
                  {crop.nameUr}
                </p>
                <p className="text-[#62758A] text-xs">
                  {crop.nameEn} • فی {crop.unit || 'kg'}
                </p>
              </div>

              {price ? (
                <div className="text-right">
                  <p className="text-[#078747] font-extrabold text-lg">
                    ₨ {Number(price.avgPrice).toLocaleString('en-PK')}
                  </p>
                  <p className="text-[#62758A] text-xs">
                    {Number(price.minPrice).toLocaleString()} -{' '}
                    {Number(price.maxPrice).toLocaleString()}
                  </p>
                  <p className="text-[#829AB1] text-[10px]">{price.marketName}</p>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-xs text-slate-500">منڈی اپڈیٹ زیر التوا</span>
                  <button className="block text-[10px] text-green-400 hover:underline mt-0.5">
                    🎤 پوچھیں
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
