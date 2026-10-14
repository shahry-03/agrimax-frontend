import { useState, useEffect } from 'react';
import { walletApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import useVoice from '../hooks/useVoice';
import { useNavigate } from 'react-router-dom';

export function WalletPage() {
  const { isAuthenticated, language } = useAppStore();
  const { processCommand } = useVoice();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    if (!isAuthenticated) {
      return;
    }

    async function fetchWalletData() {
      try {
        const [walletRes, txRes] = await Promise.all([
          walletApi.getBalance(),
          walletApi.getTransactions(),
        ]);
        if (!ignore) {
          setWallet(walletRes.data?.data || null);
          setTransactions(txRes.data?.data || []);
          setError(null);
        }
      } catch (err) {
        console.warn('Wallet load error:', err);
        if (!ignore) {
          setError(
            language === 'ur'
              ? 'والیٹ کا ڈیٹا لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔'
              : 'Could not load wallet data. Please try again.'
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchWalletData();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, language, refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-[#E2EAF0] rounded-3xl text-center space-y-4 shadow-sm">
        <span className="text-5xl block">👛</span>
        <h2 className="text-xl font-bold text-[#102A43] urdu-text">
          والیٹ دیکھنے کے لیے لاگ ان کریں
        </h2>
        <p className="text-[#62758A] text-sm">
          {language === 'ur'
            ? 'آپ کا محفوظ بیلنس اور لین دین دیکھنے کے لیے لاگ ان ہونا ضروری ہے۔'
            : 'Please log in to check your secure balance and transactions.'}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 bg-[#078747] hover:bg-[#056B3B] text-white font-bold rounded-2xl shadow-sm transition cursor-pointer"
        >
          🔑 لاگ ان کریں
        </button>
      </div>
    );
  }

  const balance = wallet?.balance !== undefined ? Number(wallet.balance) : 0;
  const currency = wallet?.currency || 'PKR';

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full pb-10">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#102A43] urdu-text flex items-center gap-2">
            <span>👛</span> <span>میرا زرعی والیٹ</span>
          </h2>
          <p className="text-[#62758A] text-xs">AgriMax Digital Farmer Wallet</p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3.5 py-2 bg-white hover:bg-[#F0F8F2] text-[#102A43] border border-[#E2EAF0] rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
        >
          🔄 تازہ کریں
        </button>
      </div>

      {/* ── Balance Card ── */}
      <div className="bg-gradient-to-br from-[#078747] to-[#056B3B] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-green-100 text-xs sm:text-sm font-semibold urdu-text block">
              دستیاب کل بیلنس (Available Balance)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-5xl font-black text-white">
                ₨ {balance.toLocaleString('en-PK')}
              </span>
              <span className="text-green-200 text-sm font-bold">{currency}</span>
            </div>
            <p className="text-green-100 text-xs mt-2 flex items-center gap-1.5">
              <span>🛡️</span> <span>اسٹیٹ بینک تصدیق شدہ اسکرو پروٹیکشن</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                navigate('/');
                processCommand('والیٹ بیلنس دکھاؤ');
              }}
              className="px-4 py-2.5 bg-white text-[#078747] hover:bg-green-50 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition"
            >
              <span>🎤</span> <span>آواز سے پوچھیں</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center text-sm">
          ❌ {error}
        </div>
      )}

      {/* ── Transactions History Section ── */}
      <div className="bg-white border border-[#E2EAF0] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <h3 className="text-lg font-bold text-[#102A43] urdu-text flex items-center gap-2">
            <span>📋</span> <span>لین دین کی تاریخ (Transactions)</span>
          </h3>
          <span className="text-xs text-[#62758A]">
            کل ریکارڈز: {transactions.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <span className="text-4xl block">💸</span>
            <p className="text-[#102A43] font-bold urdu-text text-base">
              ابھی تک کوئی لین دین نہیں ہوا
            </p>
            <p className="text-[#62758A] text-xs">
              جب آپ فصل بیچیں گے تو ادائیگی یہاں ظاہر ہوگی۔
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx, idx) => {
              const isCredit = tx.type === 'CREDIT';
              const formattedDate = tx.createdAt
                ? new Date(tx.createdAt).toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';

              return (
                <div
                  key={tx.id || idx}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-[#F0F8F2] border border-[#E2EAF0] rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        isCredit
                          ? 'bg-[#E8F5E9] text-[#078747]'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {isCredit ? '↗️' : '↘️'}
                    </div>
                    <div>
                      <p className="font-semibold text-[#102A43] text-sm">
                        {tx.description || (isCredit ? 'فصل کی رقم وصولی' : 'رقم کی منتقلی')}
                      </p>
                      <p className="text-[11px] text-[#62758A]">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-extrabold text-base ${
                        isCredit ? 'text-[#078747]' : 'text-red-600'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₨{' '}
                      {Number(tx.amount).toLocaleString('en-PK')}
                    </p>
                    <span className="text-[10px] text-[#829AB1] uppercase font-semibold">
                      {tx.status || 'COMPLETED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletPage;
