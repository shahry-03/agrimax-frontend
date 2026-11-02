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
import { notificationsApi } from '../services/api';

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

const mapNotification = (n) => ({
  id: n.id,
  type: (n.type || 'default').toLowerCase(),
  titleEn: n.titleEn || 'Notification',
  titleUr: n.titleUr || 'اطلاع',
  bodyEn: n.bodyEn || '',
  bodyUr: n.bodyUr || '',
  time: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
  isRead: Boolean(n.isRead),
  isStarred: false,
  metadata: n.metadata,
});

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
  const { language, isAuthenticated } = useAppStore(
    useShallow((s) => ({ language: s.language, isAuthenticated: s.isAuthenticated }))
  );
  const isUrdu = language === 'ur';

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'starred'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real notifications from backend
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await notificationsApi.list();
      const rawList = res.data?.data || [];
      setNotifications(rawList.map(mapNotification));
    } catch (err) {
      console.warn('[NotificationsPage] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Derived counts
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );
  const starredCount = useMemo(
    () => notifications.filter((n) => n.isStarred).length,
    [notifications]
  );

  // Filtered + grouped notifications
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

  // Actions
  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      console.warn('[NotificationsPage] markRead failed:', err);
    }
  }, []);

  const toggleStar = useCallback((id, e) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isStarred: !n.isStarred } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success(
      isUrdu ? 'تمام پیغامات پڑھے گئے قرار دے دیے گئے' : 'All notifications marked as read',
      { icon: '✓' }
    );
    try {
      await notificationsApi.markAllRead();
    } catch (err) {
      console.warn('[NotificationsPage] markAllRead failed:', err);
    }
  }, [unreadCount, isUrdu]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-200">
            <HiBellAlert className="text-emerald-600" />
            <span>{isUrdu ? 'اطلاعات و الرٹس' : 'Notifications & Alerts'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {isUrdu ? 'اطلاعات' : 'Notifications'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu
              ? 'مارکیٹ ریٹس، سودوں اور الرٹس سے باخبر رہیں'
              : 'Stay updated on market rates, orders, and deals'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {isUrdu ? 'سب پڑھے گئے نشان زد کریں' : 'Mark all read'}
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition cursor-pointer"
            title="Refresh"
          >
            <HiOutlineArrowPath className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          {isUrdu ? 'تمام' : 'All'} ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === 'unread' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          {isUrdu ? 'غیر پڑھے' : 'Unread'} ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('starred')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filter === 'starred' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          {isUrdu ? 'پسندیدہ' : 'Starred'} ({starredCount})
        </button>
      </div>

      {/* ── Notifications List ── */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-bold uppercase">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading notifications...'}</p>
        </div>
      ) : !hasAnyInGroup ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <HiOutlineInbox className="text-4xl text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {isUrdu ? 'کوئی اطلاع نہیں ہے' : 'No notifications'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isUrdu ? 'جب کوئی نئی اپ ڈیٹ آئے گی تو یہاں ظاہر ہوگی۔' : 'New updates and deals will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {['today', 'yesterday', 'thisWeek', 'older'].map((groupKey) => {
            const list = grouped[groupKey];
            if (!list || list.length === 0) return null;

            const groupLabel = DATE_GROUP_LABELS[groupKey];

            return (
              <div key={groupKey} className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                  {isUrdu ? groupLabel.ur : groupLabel.en}
                </p>

                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
                  {list.map((n) => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                          n.isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-emerald-50/20 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0 text-lg border ${cfg.border}`}>
                          <Icon />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-bold truncate ${n.isRead ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
                              {isUrdu ? n.titleUr : n.titleEn}
                            </h4>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {formatTimeAgo(n.time, isUrdu)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed mb-2">
                            {isUrdu ? n.bodyUr : n.bodyEn}
                          </p>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => toggleStar(n.id, e)}
                              className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 transition"
                            >
                              {n.isStarred ? (
                                <HiStar className="text-amber-500 text-sm" />
                              ) : (
                                <HiOutlineStar className="text-sm" />
                              )}
                              <span>{isUrdu ? 'پسندیدہ' : 'Star'}</span>
                            </button>
                          </div>
                        </div>

                        {!n.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}