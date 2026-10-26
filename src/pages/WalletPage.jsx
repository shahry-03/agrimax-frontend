import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiOutlineWallet,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineBanknotes,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineArrowDownTray,
  HiOutlineMicrophone,
  HiOutlineLockClosed,
  HiOutlineReceiptPercent,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { walletApi } from '../services/api';
import useAppStore from '../store/useAppStore';

// ── Format helpers ──
const formatPKR = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '₨ 0';
  return `₨ ${num.toLocaleString('en-PK')}`;
};

const formatDate = (dateStr, isUrdu) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatDateTime = (dateStr, isUrdu) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString(isUrdu ? 'ur-PK' : 'en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const getDateGroup = (dateStr) => {
  if (!dateStr) return 'older';
  try {
    const now = new Date();
    const d = new Date(dateStr);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today - txDay) / 86400000);

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return 'thisWeek';
    if (diffDays < 30) return 'thisMonth';
    return 'older';
  } catch {
    return 'older';
  }
};

const DATE_GROUP_LABELS = {
  today: { en: 'Today', ur: 'آج' },
  yesterday: { en: 'Yesterday', ur: 'کل' },
  thisWeek: { en: 'This Week', ur: 'اس ہفتے' },
  thisMonth: { en: 'This Month', ur: 'اس مہینے' },
  older: { en: 'Older', ur: 'پرانی' },
};

const FILTER_TYPES = [
  { id: 'all', labelEn: 'All', labelUr: 'تمام' },
  { id: 'credit', labelEn: 'Income', labelUr: 'آمد' },
  { id: 'debit', labelEn: 'Expense', labelUr: 'اخراج' },
];

// ── Transaction detail modal ──
function TransactionModal({ transaction, onClose, isUrdu }) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const isCredit = transaction.type === 'CREDIT';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(transaction.id || ''));
      setCopied(true);
      toast.success(isUrdu ? 'ID کاپی ہو گئی' : 'ID copied', { id: 'tx-copy' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isUrdu ? 'کاپی نہیں ہو سکی' : 'Failed to copy', { id: 'tx-copy-fail' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl motion-safe:animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <HiOutlineXMark className="text-lg" />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {isCredit ? <HiOutlineArrowTrendingUp className="text-3xl" /> : <HiOutlineArrowTrendingDown className="text-3xl" />}
        </div>

        {/* Amount */}
        <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          {isCredit ? (isUrdu ? 'موصول شدہ رقم' : 'Amount Received') : (isUrdu ? 'منتقل شدہ رقم' : 'Amount Sent')}
        </p>
        <p className={`text-center text-3xl font-black tracking-tighter mb-6 ${
          isCredit ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {isCredit ? '+' : '-'}{formatPKR(transaction.amount)}
        </p>

        {/* Details */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <DetailRow
            icon={<HiOutlineInformationCircle />}
            label={isUrdu ? 'تفصیل' : 'Description'}
            value={transaction.description || (isCredit ? 'Crop payment received' : 'Payment transferred')}
          />
          <DetailRow
            icon={<HiOutlineCalendarDays />}
            label={isUrdu ? 'تاریخ' : 'Date'}
            value={formatDateTime(transaction.createdAt, isUrdu)}
          />
          <DetailRow
            icon={<HiOutlineShieldCheck />}
            label={isUrdu ? 'حیثیت' : 'Status'}
            value={
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {transaction.status || 'COMPLETED'}
              </span>
            }
          />
          <DetailRow
            icon={<HiOutlineReceiptPercent />}
            label={isUrdu ? 'ٹرانزیکشن ID' : 'Transaction ID'}
            value={
              <div className="flex items-center gap-1.5">
                <code className="text-[10px] font-mono truncate max-w-[140px]" dir="ltr">
                  {transaction.id || '—'}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                  aria-label="Copy ID"
                >
                  {copied ? <HiOutlineCheck className="text-xs" /> : <HiOutlineClipboardDocument className="text-xs" />}
                </button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
        <span className="text-slate-400 text-sm">{icon}</span>
        {label}
      </span>
      <span className="text-[11px] font-bold text-slate-800 text-end truncate">
        {value}
      </span>
    </div>
  );
}

export function WalletPage() {
  const navigate = useNavigate();

  const { isAuthenticated, language } = useAppStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      language: s.language,
    }))
  );

  const isUrdu = language === 'ur';

  // Data state
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedTx, setSelectedTx] = useState(null);

  const abortRef = useRef(null);

  // ── Fetch with AbortController ──
  const fetchWallet = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [walletRes, txRes] = await Promise.all([
        walletApi.getBalance({ signal }),
        walletApi.getTransactions({ signal }),
      ]);

      if (signal.aborted) return;

      setWallet(walletRes?.data?.data || null);
      setTransactions(txRes?.data?.data || []);
      setError(null);
    } catch (err) {
      if (err?.name === 'AbortError' || signal.aborted) return;
      setError(
        isUrdu
          ? 'والیٹ کا ڈیٹا لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔'
          : 'Could not load wallet data. Please try again.'
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, isUrdu]);

  // ── Fetch on mount & auth change ──
  useEffect(() => {
    fetchWallet();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchWallet]);

  // ── Computed values ──
  const balance = wallet?.balance !== undefined ? Number(wallet.balance) : 0;
  const currency = wallet?.currency || 'PKR';

  // ── Stats: income, expense, net ──
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount) || 0);
      const isCredit = tx.type === 'CREDIT' ||
        String(tx.description || '').toLowerCase().includes('received') ||
        String(tx.description || '').toLowerCase().includes('credit');
      if (isCredit) income += amt;
      else expense += amt;
    });

    return { income, expense, net: income - expense };
  }, [transactions]);

  // ── Filtered + Sorted + Grouped transactions ──
  const displayTransactions = useMemo(() => {
    let list = [...transactions];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((tx) =>
        String(tx.description || '').toLowerCase().includes(q) ||
        String(tx.id || '').toLowerCase().includes(q) ||
        String(tx.amount || '').includes(q)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      list = list.filter((tx) => {
        const isCredit = tx.type === 'CREDIT' ||
          String(tx.description || '').toLowerCase().includes('received') ||
          String(tx.description || '').toLowerCase().includes('credit');
        return filterType === 'credit' ? isCredit : !isCredit;
      });
    }

    // Sort newest first
    list.sort((a, b) => {
      const aT = new Date(a.createdAt || 0).getTime();
      const bT = new Date(b.createdAt || 0).getTime();
      return bT - aT;
    });

    // Group by date
    const groups = {};
    list.forEach((tx) => {
      const g = getDateGroup(tx.createdAt);
      if (!groups[g]) groups[g] = [];
      groups[g].push(tx);
    });

    return { list, groups };
  }, [transactions, search, filterType]);

  // ── Visible transactions (pagination) ──
  const visibleTransactions = useMemo(
    () => displayTransactions.list.slice(0, visibleCount),
    [displayTransactions.list, visibleCount]
  );

  const hasMore = displayTransactions.list.length > visibleCount;

  // ── Handlers ──
  const handleRefresh = useCallback(() => {
    toast.promise(
      fetchWallet(true),
      {
        loading: isUrdu ? 'تازہ کر رہے ہیں...' : 'Refreshing...',
        success: isUrdu ? 'والیٹ تازہ ہو گیا!' : 'Wallet refreshed!',
        error: isUrdu ? 'تازہ نہیں ہو سکا' : 'Refresh failed',
      },
      { id: 'wallet-refresh' }
    );
  }, [fetchWallet, isUrdu]);

  const handleAskVoice = useCallback(() => {
    const cmd = isUrdu ? 'والیٹ بیلنس دکھاؤ' : 'Show my wallet balance';
    navigate('/', { state: { autoVoiceCommand: cmd } });
  }, [navigate, isUrdu]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 15);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (transactions.length === 0) {
      toast.error(isUrdu ? 'کوئی لین دین نہیں' : 'No transactions to export', { id: 'wallet-export-empty' });
      return;
    }

    try {
      const headers = ['Date', 'Description', 'Type', 'Amount', 'Status', 'ID'];
      const rows = transactions.map((tx) => [
        tx.createdAt || '',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.type || '',
        tx.amount || 0,
        tx.status || 'COMPLETED',
        tx.id || '',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agrimax-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        isUrdu ? `${transactions.length} لین دین ایکسپورٹ ہو گئے` : `${transactions.length} transactions exported`,
        { icon: '📥', id: 'wallet-export-success' }
      );
    } catch {
      toast.error(isUrdu ? 'ایکسپورٹ ناکام' : 'Export failed', { id: 'wallet-export-fail' });
    }
  }, [transactions, isUrdu]);

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return (
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className="max-w-md mx-auto my-8 sm:my-12 p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-5 shadow-sm motion-safe:animate-fade-up"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mb-2">
          <HiOutlineLockClosed className="text-4xl" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isUrdu ? 'لاگ ان درکار ہے' : 'Login Required'}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {isUrdu
            ? 'اپنا محفوظ بیلنس اور لین دین دیکھنے کے لیے لاگ ان کریں۔'
            : 'Please log in to check your secure balance and transactions.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
        >
          🔑 {isUrdu ? 'لاگ ان کریں' : 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="w-full max-w-7xl mx-auto pb-10 space-y-6 motion-safe:animate-fade-up"
    >
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
              <HiOutlineShieldCheck className="text-sm" />
              {isUrdu ? 'محفوظ والیٹ' : 'Secure Wallet'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {isUrdu ? 'زرعی والیٹ' : 'Farmer Wallet'}
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 font-medium">
              {isUrdu
                ? 'آپ کا محفوظ بیلنس اور لین دین کی تاریخ'
                : 'Your secure balance and transaction history'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={transactions.length === 0 || refreshing || loading}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              aria-label="Export CSV"
            >
              <HiOutlineArrowDownTray className="text-base" />
              <span className="hidden sm:inline">{isUrdu ? 'ایکسپورٹ' : 'Export'}</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md shadow-emerald-500/30"
            >
              <HiOutlineArrowPath className={`text-base ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isUrdu ? 'تازہ' : 'Refresh'}</span>
            </button>
          </div>
        </div>
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

      {/* ═══════════════ BALANCE + STATS ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/30 text-white">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                {isUrdu ? 'دستیاب بیلنس' : 'Available Balance'}
              </span>
              <HiOutlineSparkles className="text-emerald-200 text-lg" />
            </div>

            <div className="flex items-baseline gap-2 mt-1 mb-6">
              <span className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums">
                {loading ? (
                  <span className="inline-block w-32 h-12 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  formatPKR(balance)
                )}
              </span>
              <span className="text-emerald-100 text-sm font-bold">{currency}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAskVoice}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <HiOutlineMicrophone className="text-base" />
                {isUrdu ? 'آواز سے پوچھیں' : 'Ask via Voice'}
              </button>
              <div className="flex items-center gap-1.5 text-emerald-100 text-[11px] font-medium px-2">
                <HiOutlineShieldCheck className="text-sm" />
                <span>{isUrdu ? 'بینک تصدیق شدہ' : 'Bank Verified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="grid grid-cols-1 gap-3">
          <StatMini
            icon={HiOutlineArrowTrendingUp}
            labelEn="Total Income"
            labelUr="کل آمد"
            value={formatPKR(stats.income)}
            color="emerald"
            loading={loading}
          />
          <StatMini
            icon={HiOutlineArrowTrendingDown}
            labelEn="Total Expense"
            labelUr="کل اخراج"
            value={formatPKR(stats.expense)}
            color="rose"
            loading={loading}
          />
        </div>
      </div>

      {/* ═══════════════ TRANSACTIONS SECTION ═══════════════ */}
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

        {/* Header + Filters */}
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <HiOutlineReceiptPercent className="text-lg" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  {isUrdu ? 'لین دین کی تاریخ' : 'Transactions'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {loading
                    ? (isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...')
                    : `${transactions.length} ${isUrdu ? 'کل ریکارڈز' : 'total records'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Search + Type Filter (only when there are transactions) */}
          {!loading && transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <HiOutlineMagnifyingGlass className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-lg ${isUrdu ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isUrdu ? 'تفصیل، رقم یا ID تلاش کریں...' : 'Search description, amount or ID...'}
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

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {FILTER_TYPES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterType(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      filterType === f.id
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isUrdu ? f.labelUr : f.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-200 rounded w-1/3" />
                  </div>
                  <div className="w-20 h-5 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && transactions.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mb-4">
                <HiOutlineBanknotes className="text-4xl" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {isUrdu ? 'ابھی تک کوئی لین دین نہیں' : 'No transactions yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isUrdu
                  ? 'جب آپ اپنی فصل بیچیں گے تو ادائیگی یہاں ظاہر ہوگی۔'
                  : 'When you sell your crop, payments will appear here.'}
              </p>
            </div>
          )}

          {/* No results after filter/search */}
          {!loading && transactions.length > 0 && visibleTransactions.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-slate-500 mb-3">
                {isUrdu ? 'کوئی لین دین نہیں ملا' : 'No transactions match your filter'}
              </p>
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterType('all'); }}
                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold cursor-pointer hover:underline"
              >
                {isUrdu ? 'فلٹر صاف کریں' : 'Clear Filters'}
              </button>
            </div>
          )}

          {/* Grouped Transactions */}
          {!loading && visibleTransactions.length > 0 && (
            <div className="space-y-6">
              {Object.entries(displayTransactions.groups).map(([groupKey, items]) => {
                // Only show groups that have visible transactions
                const visibleInGroup = items.filter((tx) => visibleTransactions.includes(tx));
                if (visibleInGroup.length === 0) return null;

                return (
                  <div key={groupKey}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {isUrdu ? DATE_GROUP_LABELS[groupKey].ur : DATE_GROUP_LABELS[groupKey].en}
                      </h3>
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400">
                        {visibleInGroup.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {visibleInGroup.map((tx) => {
                        const isCredit = tx.type === 'CREDIT' ||
                          String(tx.description || '').toLowerCase().includes('received') ||
                          String(tx.description || '').toLowerCase().includes('credit');

                        return (
                          <button
                            key={tx.id}
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-2xl flex items-center justify-between gap-3 transition-all text-start cursor-pointer group active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isCredit
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-rose-100 text-rose-600'
                              }`}>
                                {isCredit
                                  ? <HiOutlineArrowTrendingUp className="text-lg" />
                                  : <HiOutlineArrowTrendingDown className="text-lg" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                                  {tx.description || (isCredit
                                    ? (isUrdu ? 'فصل کی رقم وصولی' : 'Crop payment received')
                                    : (isUrdu ? 'رقم کی منتقلی' : 'Payment transferred'))}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                  <HiOutlineClock className="text-xs" />
                                  {formatDate(tx.createdAt, isUrdu)}
                                </p>
                              </div>
                            </div>

                            <div className="text-end shrink-0">
                              <p className={`font-black text-base tracking-tight tabular-nums ${
                                isCredit ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {isCredit ? '+' : '-'}{formatPKR(Math.abs(Number(tx.amount) || 0))}
                              </p>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">
                                {tx.status || 'COMPLETED'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
                  >
                    <HiOutlineArrowPath className="text-sm" />
                    {isUrdu
                      ? `مزید دکھائیں (${displayTransactions.list.length - visibleCount} باقی)`
                      : `Load more (${displayTransactions.list.length - visibleCount} remaining)`}
                  </button>
                </div>
              )}

              {/* Footer count */}
              <p className="text-center text-[10px] text-slate-400 font-medium">
                {isUrdu
                  ? `${displayTransactions.list.length} میں سے ${visibleTransactions.length} دکھ رہے ہیں`
                  : `Showing ${visibleTransactions.length} of ${displayTransactions.list.length}`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ MODAL ═══════════════ */}
      <TransactionModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        isUrdu={isUrdu}
      />
    </div>
  );
}

// ── Sub-components ──

function StatMini({ icon: Icon, labelEn, labelUr, value, color, loading }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const isUrdu = labelUr !== undefined;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${colorMap[color]}`}>
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          {isUrdu ? labelUr : labelEn}
        </p>
        {loading ? (
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
        ) : (
          <p className={`font-black text-base tracking-tight tabular-nums truncate ${
            color === 'emerald' ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default WalletPage;