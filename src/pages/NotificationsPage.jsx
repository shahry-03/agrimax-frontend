import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiBell,
  HiBellAlert,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineChevronRight,
  HiOutlineInbox,
  HiOutlineStar,
  HiStar,
} from 'react-icons/hi2';
import useAppStore from '../store/useAppStore';

// ── Type configuration (icon + color theme) ──
const TYPE_CONFIG = {
  market: {
    icon: HiOutlineChartBar,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  tip: {
    icon: HiOutlineLightBulb,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  success: {
    icon: HiOutlineCheckCircle,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
  },
  default: {
    icon: HiBell,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

// ── Mock notifications (replace with API when backend ready) ──
const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'market',
    titleEn: 'Wheat price increased',
    titleUr: 'گندم کی قیمت بڑھ گئی',
    bodyEn: 'Wheat average price reached ₨3,200 per quintal today — up 4.2% from yesterday.',
    bodyUr: 'آج گندم کی اوسط قیمت ₨3,200 فی کوئنٹل ہوگئی — کل سے 4.2% اضافہ۔',
    time: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    isRead: false,
    isStarred: false,
    action: { path: '/prices', labelEn: 'View Rates', labelUr: 'ریٹس دیکھیں' },
  },
  {
    id: '2',
    type: 'warning',
    titleEn: 'Weather Advisory',
    titleUr: 'موسم کا مشورہ',
    bodyEn: 'Rain expected in the next 3 days. Plan your harvest accordingly.',
    bodyUr: 'اگلے 3 دن بارش کا امکان ہے۔ فصل کاٹنے کا منصوبہ بنائیں۔',
    time: Date.now() - 5 * 60 * 60 * 1000,
    isRead: false,
    isStarred: true,
    action: null,
  },
  {
    id: '3',
    type: 'success',
    titleEn: 'Login Successful',
    titleUr: 'لاگ ان کامیاب',
    bodyEn: 'Your AgriMax account logged in securely on this device.',
    bodyUr: 'آپ کا AgriMax اکاؤنٹ اس ڈیوائس پر محفوظ طریقے سے کھل گیا۔',
    time: Date.now() - 26 * 60 * 60 * 1000, // yesterday
    isRead: true,
    isStarred: false,
    action: { path: '/profile', labelEn: 'View Profile', labelUr: 'پروفائل دیکھیں' },
  },
  {
    id: '4',
    type: 'tip',
    titleEn: 'Fertilizer Tip',
    titleUr: 'کھاد کا مشورہ',
    bodyEn: 'Apply Urea in the early morning for best absorption during wheat growth.',
    bodyUr: 'گندم کی نشوونما کے لیے یوریا صبح سویرے ڈالیں تاکہ بہترین جذب ہو۔',
    time: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    isRead: true,
    isStarred: false,
    action: null,
  },
];

// ── Time-ago helper (bilingual) ──
function formatTimeAgo(timestamp, isUrdu) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return isUrdu ? 'ابھی' : 'Just now';
  if (mins < 60) return isUrdu ? `${mins} منٹ پہلے` : `${mins}m ago`;
  if (hours < 24) return isUrdu ? `${hours} گھنٹے پہلے` : `${hours}h ago`;
  if (days < 7) return isUrdu ? `${days} دن پہلے` : `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
  });
}

// ── Date group helper ──
function getDateGroup(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const dayDiff = Math.floor((now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000);
  if (dayDiff === 0) return 'today';
  if (dayDiff === 1) return 'yesterday';
  if (dayDiff < 7) return 'thisWeek';
  return 'older';
}

const DATE_GROUP_LABELS = {
  today: { en: 'Today', ur: 'آج' },
  yesterday: { en: 'Yesterday', ur: 'کل' },
  thisWeek: { en: 'This Week', ur: 'اس ہفتے' },
  older: { en: 'Older', ur: 'پرانی' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { language } = useAppStore(
    useShallow((s) => ({ language: s.language }))
  );
  const isUrdu = language === 'ur';

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'starred'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const savedStateRef = useRef(null);

  // ── Derived counts ──
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );
  const starredCount = useMemo(
    () => notifications.filter((n) => n.isStarred).length,
    [notifications]
  );

  // ── Filtered + grouped notifications ──
  const grouped = useMemo(() => {
    let list = notifications;
    if (filter === 'unread') list = list.filter((n) => !n.isRead);
    else if (filter === 'starred') list = list.filter((n) => n.isStarred);

    // Sort by newest first
    const sorted = [...list].sort((a, b) => b.time - a.time);

    // Group by date
    const groups = {};
    sorted.forEach((n) => {
      const g = getDateGroup(n.time);
      if (!groups[g]) groups[g] = [];
      groups[g].push(n);
    });
    return groups;
  }, [notifications, filter]);

  const hasAnyInGroup = Object.keys(grouped).length > 0;

  // ── Actions ──
  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const toggleStar = useCallback((id, e) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isStarred: !n.isStarred } : n))
    );
  }, []);

  const deleteNotif = useCallback((id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success(
      isUrdu ? 'اطلاع حذف کر دی گئی' : 'Notification deleted',
      { icon: '🗑️', id: `notif-del-${id}` }
    );
  }, [isUrdu]);

  const markAllRead = useCallback(() => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success(
      isUrdu ? 'تمام اطلاعات پڑھ لی گئیں' : 'All notifications marked as read',
      { icon: '✓', id: 'notif-all-read' }
    );
  }, [unreadCount, isUrdu]);

  const clearRead = useCallback(() => {
    const readCount = notifications.filter((n) => n.isRead).length;
    if (readCount === 0) {
      toast.error(
        isUrdu ? 'کوئی پڑھی ہوئی اطلاع نہیں' : 'No read notifications to clear',
        { id: 'notif-clear-empty' }
      );
      return;
    }
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    toast.success(
      isUrdu ? `${readCount} پڑھی ہوئی اطلاعات حذف کر دی گئیں` : `${readCount} read notifications cleared`,
      { icon: '🗑️', id: 'notif-clear' }
    );
  }, [notifications, isUrdu]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    toast.promise(
      new Promise((res) => setTimeout(res, 900)),
      {
        loading: isUrdu ? 'تازہ کر رہے ہیں...' : 'Refreshing...',
        success: () => {
          setRefreshing(false);
          return isUrdu ? 'تازہ ہو گیا!' : 'Refreshed!';
        },
        error: isUrdu ? 'ناکام' : 'Failed',
      },
      { id: 'notif-refresh' }
    );
  }, [isUrdu]);

  const handleNotificationClick = useCallback((notif) => {
    if (!notif.isRead) markRead(notif.id);
    if (notif.action?.path) {
      navigate(notif.action.path);
    }
  }, [markRead, navigate]);

  // ── Filter tabs config ──
  const FILTERS = [
    { id: 'all', labelEn: 'All', labelUr: 'تمام', count: notifications.length },
    { id: 'unread', labelEn: 'Unread', labelUr: 'نہ پڑھی', count: unreadCount },
    { id: 'starred', labelEn: 'Starred', labelUr: 'ستارہ زدہ', count: starredCount },
  ];

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="w-full max-w-4xl mx-auto pb-10 space-y-5 animate-fade-up"
    >
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-500/20 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
              <HiBellAlert className="text-sm" />
              {isUrdu ? 'اطلاعات' : 'Notifications'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight flex items-center gap-3">
              {isUrdu ? 'اطلاعات' : 'Notifications'}
              {unreadCount > 0 && (
                <span className="text-sm font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-md">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 font-medium">
              {isUrdu
                ? `${notifications.length} کل اطلاعات • ${unreadCount} نہ پڑھی`
                : `${notifications.length} total • ${unreadCount} unread`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              aria-label="Refresh"
            >
              <HiOutlineArrowPath className={`text-base ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isUrdu ? 'تازہ' : 'Refresh'}</span>
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
              >
                <HiOutlineCheckCircle className="text-base" />
                <span className="hidden sm:inline">
                  {isUrdu ? 'سب پڑھیں' : 'Mark all read'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════ FILTERS ═══════════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              filter === f.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{isUrdu ? f.labelUr : f.labelEn}</span>
            {f.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === f.id
                  ? 'bg-white/20'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {notifications.some((n) => n.isRead) && (
          <button
            type="button"
            onClick={clearRead}
            className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
          >
            <HiOutlineTrash className="text-sm" />
            {isUrdu ? 'پڑھی ہوئی صاف کریں' : 'Clear read'}
          </button>
        )}
      </div>

      {/* ═══════════════ NOTIFICATIONS LIST ═══════════════ */}
      {!hasAnyInGroup ? (
        // ── Empty state ──
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mb-4">
            <HiOutlineInbox className="text-4xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {filter === 'unread'
              ? (isUrdu ? 'سب پڑھ لی گئیں!' : 'All caught up!')
              : filter === 'starred'
              ? (isUrdu ? 'کوئی ستارہ زدہ اطلاع نہیں' : 'No starred notifications')
              : (isUrdu ? 'ابھی کوئی اطلاع نہیں' : 'No notifications yet')}
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            {filter === 'unread'
              ? (isUrdu ? 'جب نئی اطلاع آئے گی تو یہاں نظر آئے گی۔' : "When new updates arrive, you'll see them here.")
              : filter === 'starred'
              ? (isUrdu ? 'اطلاعات پر ستارہ لگا کر اہم محفوظ کریں۔' : 'Star notifications to save them here.')
              : (isUrdu ? 'مارکیٹ کی قیمتوں، موسم کی تازہ کاری، اور اکاؤنٹ کی اطلاعات یہاں دکھیں گی۔' : 'Market prices, weather updates, and account alerts will appear here.')}
          </p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-95"
            >
              {isUrdu ? 'تمام اطلاعات دیکھیں' : 'View all notifications'}
            </button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([groupKey, items]) => (
          <section key={groupKey} className="space-y-3">
            {/* Group header */}
            <div className="flex items-center gap-3 px-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isUrdu ? DATE_GROUP_LABELS[groupKey].ur : DATE_GROUP_LABELS[groupKey].en}
              </h3>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">
                {items.length}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {items.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                const Icon = config.icon;
                const isUnread = !notif.isRead;

                return (
                  <article
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notif)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notif);
                      }
                    }}
                    className={`group relative bg-white rounded-2xl p-4 border transition-all cursor-pointer overflow-hidden ${
                      isUnread
                        ? 'border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Unread left bar */}
                    {isUnread && (
                      <span className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                    )}

                    <div className="flex items-start gap-3.5 ps-2">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.text} border ${config.border} flex items-center justify-center shrink-0`}>
                        <Icon className="text-lg" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-bold leading-tight ${isUnread ? 'text-slate-800' : 'text-slate-600'}`}>
                            {isUrdu ? notif.titleUr : notif.titleEn}
                          </h4>

                          {/* Action buttons (reveal on hover) */}
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => toggleStar(notif.id, e)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                notif.isStarred
                                  ? 'text-amber-500 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                              }`}
                              aria-label={notif.isStarred ? 'Remove star' : 'Star'}
                            >
                              {notif.isStarred ? <HiStar className="text-sm" /> : <HiOutlineStar className="text-sm" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => deleteNotif(notif.id, e)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              aria-label="Delete"
                            >
                              <HiOutlineTrash className="text-sm" />
                            </button>
                          </div>

                          {/* Unread dot (when not hovering) */}
                          {isUnread && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1.5 group-hover:hidden" />
                          )}
                        </div>

                        <p className={`text-xs mt-1 leading-relaxed ${isUnread ? 'text-slate-600' : 'text-slate-500'}`}>
                          {isUrdu ? notif.bodyUr : notif.bodyEn}
                        </p>

                        {/* Footer row: time + action button */}
                        <div className="flex items-center justify-between gap-2 mt-2.5">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatTimeAgo(notif.time, isUrdu)}
                          </span>

                          {notif.action && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) markRead(notif.id);
                                navigate(notif.action.path);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            >
                              <span>{isUrdu ? notif.action.labelUr : notif.action.labelEn}</span>
                              <HiOutlineChevronRight className="text-xs rtl:rotate-180" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* ═══════════════ FOOTER SUMMARY ═══════════════ */}
      {hasAnyInGroup && (
        <p className="text-center text-[11px] text-slate-400 font-medium pt-2">
          {isUrdu
            ? `آپ نے ${notifications.filter((n) => n.isRead).length} میں سے ${notifications.length} اطلاعات پڑھ لی ہیں`
            : `You've read ${notifications.filter((n) => n.isRead).length} of ${notifications.length} notifications`}
        </p>
      )}
    </div>
  );
}