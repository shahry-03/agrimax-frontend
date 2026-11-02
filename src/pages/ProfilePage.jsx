import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineGlobeAlt,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBell,
  HiOutlineBellSlash,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineArrowPath,
  HiOutlineArrowRightOnRectangle,
  HiOutlineMicrophone,
  HiOutlineQuestionMarkCircle,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineKey,
  HiOutlineDevicePhoneMobile,
  HiOutlineComputerDesktop,
} from 'react-icons/hi2';
import useAppStore from '../store/useAppStore';
import { userApi } from '../services/api';

// ── Voice command examples (human-friendly, no tech codes) ──
const VOICE_COMMANDS = [
  {
    icon: '🌾',
    titleEn: 'Check crop prices',
    titleUr: 'فصل کی قیمت دیکھیں',
    exampleEn: '"What is today\'s wheat price?"',
    exampleUr: '"آج گندم کی قیمت کیا ہے؟"',
  },
  {
    icon: '💰',
    titleEn: 'Sell your crop',
    titleUr: 'اپنی فصل بیچیں',
    exampleEn: '"Sell 50 kg wheat for 3000"',
    exampleUr: '"50 کلو گندم 3000 میں بیچنی ہے"',
  },
  {
    icon: '👛',
    titleEn: 'Check your wallet',
    titleUr: 'اپنا والیٹ دیکھیں',
    exampleEn: '"Show my wallet balance"',
    exampleUr: '"میرا والیٹ بیلنس دکھاؤ"',
  },
  {
    icon: '🧠',
    titleEn: 'Get farming advice',
    titleUr: 'زرعی مشورہ حاصل کریں',
    exampleEn: '"Give me fertilizer advice for cotton"',
    exampleUr: '"کپاس کے لیے کھاد کا مشورہ دو"',
  },
  {
    icon: '🧭',
    titleEn: 'Navigate the app',
    titleUr: 'ایپ میں جائیں',
    exampleEn: '"Open marketplace"',
    exampleUr: '"مارکیٹ کھولو"',
  },
];

// ── Avatar options ──
const AVATAR_EMOJIS = ['👨‍🌾', '👩‍🌾', '🧑‍🌾', '👨‍🍳', '🧕', '👴', '👵', '🌱'];

// ── Logout confirmation modal ──
function LogoutConfirmModal({ isOpen, onClose, onConfirm, isUrdu }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl motion-safe:animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <HiOutlineXMark className="text-lg" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
          <HiOutlineExclamationTriangle className="text-2xl" />
        </div>

        <h2 className="text-lg font-bold text-slate-800 text-center mb-2">
          {isUrdu ? 'لاگ آؤٹ کریں؟' : 'Sign out?'}
        </h2>
        <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
          {isUrdu
            ? 'آپ کو دوبارہ لاگ ان کرنا ہوگا۔ آپ کا ڈیٹا محفوظ رہے گا۔'
            : "You'll need to sign in again. Your data is safe."}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            {isUrdu ? 'منسوخ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer active:scale-95"
          >
            {isUrdu ? 'ہاں، لاگ آؤٹ' : 'Yes, Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ──
function EditProfileModal({ isOpen, onClose, onSave, currentName, currentAvatar, isUrdu }) {
  const [name, setName] = useState(currentName || '');
  const [avatar, setAvatar] = useState(currentAvatar || '👨‍🌾');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setAvatar(currentAvatar || '👨‍🌾');
    }
  }, [isOpen, currentName, currentAvatar]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(isUrdu ? 'نام درکار ہے' : 'Name is required', { id: 'prof-name-req' });
      return;
    }
    onSave({ name: name.trim(), avatar });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl motion-safe:animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <HiOutlineXMark className="text-lg" />
        </button>

        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <HiOutlinePencilSquare className="text-emerald-600" />
          {isUrdu ? 'پروفائل میں ترمیم' : 'Edit Profile'}
        </h2>

        {/* Avatar selector */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-2">
            {isUrdu ? 'اپنا اوتار منتخب کریں' : 'Choose your avatar'}
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`w-12 h-12 rounded-xl text-2xl transition-all cursor-pointer ${
                  avatar === emoji
                    ? 'bg-emerald-100 border-2 border-emerald-500 scale-110'
                    : 'bg-slate-50 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label htmlFor="profile-name" className="text-xs font-bold text-slate-700 block mb-2">
            {isUrdu ? 'آپ کا نام' : 'Your Name'}
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={isUrdu ? 'اپنا نام لکھیں' : 'Enter your name'}
            className={`w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all ${
              isUrdu ? 'urdu-text text-right' : ''
            }`}
            dir={isUrdu ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            {isUrdu ? 'منسوخ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer active:scale-95"
          >
            {isUrdu ? 'محفوظ کریں' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    logout,
    sessionId,
    resetSessionId,
    language,
    setLanguage,
    updateUser,
  } = useAppStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      logout: s.logout,
      sessionId: s.sessionId,
      resetSessionId: s.resetSessionId,
      language: s.language,
      setLanguage: s.setLanguage,
      updateUser: s.updateUser, // ← Agar store mein nahi hai to gracefully skip hoga
    }))
  );

  const isUrdu = language === 'ur';

  // Local state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sessionCopied, setSessionCopied] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('agrimax_notifications') !== 'false';
    } catch { return true; }
  });
  const [darkModeEnabled, setDarkModeEnabled] = useState(() => {
    try {
      return localStorage.getItem('agrimax_dark_mode') === 'true';
    } catch { return false; }
  });

  // ── Handlers ──
  const handleLogoutClick = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const handleLogoutConfirm = useCallback(() => {
    logout();
    setShowLogoutModal(false);
    toast.success(
      isUrdu ? 'کامیابی سے لاگ آؤٹ ہو گئے' : 'Signed out successfully',
      { icon: '👋', id: 'prof-logout' }
    );
    navigate('/');
  }, [logout, navigate, isUrdu]);

  const handleCopySession = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setSessionCopied(true);
      toast.success(
        isUrdu ? 'سیشن ID کاپی ہو گئی' : 'Session ID copied',
        { icon: '📋', id: 'prof-copy-session' }
      );
      setTimeout(() => setSessionCopied(false), 2000);
    } catch {
      toast.error(
        isUrdu ? 'کاپی نہیں ہو سکی' : 'Failed to copy',
        { id: 'prof-copy-fail' }
      );
    }
  }, [sessionId, isUrdu]);

  const handleResetSession = useCallback(() => {
    resetSessionId();
    toast.success(
      isUrdu ? 'نیا سیشن بن گیا' : 'New session created',
      { icon: '🔄', id: 'prof-reset-session' }
    );
  }, [resetSessionId, isUrdu]);

  const handleToggleNotifications = useCallback(() => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem('agrimax_notifications', String(next)); } catch { /* ignore */ }
      toast.success(
        next
          ? (isUrdu ? 'اطلاعات آن ہو گئیں' : 'Notifications enabled')
          : (isUrdu ? 'اطلاعات بند ہو گئیں' : 'Notifications disabled'),
        { icon: next ? '🔔' : '🔕', id: 'prof-notif' }
      );
      return next;
    });
  }, [isUrdu]);

  const handleToggleDarkMode = useCallback(() => {
    setDarkModeEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem('agrimax_dark_mode', String(next)); } catch { /* ignore */ }
      toast.success(
        next
          ? (isUrdu ? 'ڈارک موڈ آن' : 'Dark mode ON')
          : (isUrdu ? 'لائٹ موڈ آن' : 'Light mode ON'),
        { icon: next ? '🌙' : '☀️', id: 'prof-dark' }
      );
      return next;
    });
  }, [isUrdu]);

  const handleEditProfileSave = useCallback(({ name, avatar }) => {
    if (updateUser) {
      updateUser({ name, avatar });
    } else {
      // Fallback: update localStorage user directly
      try {
        const existing = JSON.parse(localStorage.getItem('agrimax_user') || '{}');
        localStorage.setItem('agrimax_user', JSON.stringify({ ...existing, name, avatar }));
      } catch { /* ignore */ }
    }
    setShowEditModal(false);
    toast.success(
      isUrdu ? 'پروفائل اپڈیٹ ہو گئی' : 'Profile updated',
      { icon: '✅', id: 'prof-updated' }
    );
  }, [updateUser, isUrdu]);

  // ── Display values ──
  const displayName = user?.name || (isUrdu ? 'کسان بھائی' : 'Farmer');
  const displayAvatar = user?.avatar || '👨‍🌾';
  const userPhone = user?.phone || '—';
  const userRole = user?.role || 'FARMER';
  const isVerified = Boolean(user?.isVerified || user?.verified);

  const stats = useMemo(() => ({
    memberSince: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-PK', {
          month: 'short', year: 'numeric',
        })
      : (isUrdu ? 'حال ہی میں' : 'Recently'),
  }), [user, isUrdu]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="w-full max-w-3xl mx-auto pb-10 space-y-5 motion-safe:animate-fade-up"
    >
      {/* ═══════════════ HEADER / PROFILE CARD ═══════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/20">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-[1.75rem] bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-5xl shadow-lg">
              {displayAvatar}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center shadow-md">
                <HiOutlineCheck className="text-white text-sm" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className={`text-2xl sm:text-3xl font-black text-white tracking-tight truncate ${isUrdu ? 'urdu-text' : ''}`}>
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-bold text-white uppercase tracking-wider">
                <HiOutlineShieldCheck className="text-sm" />
                {isVerified
                  ? (isUrdu ? 'تصدیق شدہ کسان' : 'Verified Farmer')
                  : (isUrdu ? 'کسان' : userRole)}
              </span>
              {isAuthenticated && user?.phone && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-bold text-white">
                  <HiOutlinePhone className="text-sm" />
                  <span dir="ltr">{userPhone}</span>
                </span>
              )}
            </div>
            {isAuthenticated && (
              <p className="text-emerald-100 text-xs mt-2 font-medium">
                {isUrdu ? 'رکنیت:' : 'Member since:'} {stats.memberSince}
              </p>
            )}
          </div>

          {/* Edit / Auth button */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="shrink-0 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <HiOutlinePencilSquare className="text-base" />
              <span>{isUrdu ? 'ترمیم' : 'Edit'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="shrink-0 px-5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              🔑 {isUrdu ? 'لاگ ان' : 'Sign In'}
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ GUEST PROMPT ═══════════════ */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <HiOutlineUser className="text-lg" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-amber-900 text-sm">
                {isUrdu ? 'مہمان صارف' : 'Guest Mode'}
              </h2>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                {isUrdu
                  ? 'والیٹ، فصل فروخت، اور پروفائل محفوظ کرنے کے لیے لاگ ان کریں۔'
                  : 'Sign in to access wallet, sell crops, and save your profile.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ACCOUNT INFO (if authenticated) ═══════════════ */}
      {isAuthenticated && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-1">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <HiOutlineIdentification className="text-emerald-600 text-lg" />
            {isUrdu ? 'اکاؤنٹ کی تفصیلات' : 'Account Details'}
          </h2>

          <InfoRow
            label={isUrdu ? 'فون نمبر' : 'Phone Number'}
            value={<span dir="ltr">{userPhone}</span>}
            icon={<HiOutlinePhone className="text-sm" />}
          />
          <InfoRow
            label={isUrdu ? 'صارف ID' : 'User ID'}
            value={
              <span className="font-mono text-xs truncate" title={user?.id}>
                {user?.id ? String(user.id).slice(0, 16) + (String(user.id).length > 16 ? '…' : '') : '—'}
              </span>
            }
            icon={<HiOutlineIdentification className="text-sm" />}
          />
          <InfoRow
            label={isUrdu ? 'اکاؤنٹ کی قسم' : 'Account Type'}
            value={
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                <HiOutlineShieldCheck className="text-xs" />
                {isVerified ? (isUrdu ? 'تصدیق شدہ' : 'Verified') : userRole}
              </span>
            }
            icon={<HiOutlineShieldCheck className="text-sm" />}
          />
        </section>
      )}

      {/* ═══════════════ PREFERENCES ═══════════════ */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-1">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <HiOutlineSparkles className="text-emerald-600 text-lg" />
          {isUrdu ? 'ترجیحات' : 'Preferences'}
        </h2>

        {/* Language */}
        <PreferenceRow
          icon={<HiOutlineGlobeAlt />}
          title={isUrdu ? 'زبان' : 'Language'}
          subtitle={isUrdu ? 'اردو / English' : 'اردو / English'}
          action={
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'ur'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                اردو
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                English
              </button>
            </div>
          }
        />

        {/* Notifications */}
        <PreferenceRow
          icon={notificationsEnabled ? <HiOutlineBell /> : <HiOutlineBellSlash />}
          title={isUrdu ? 'اطلاعات' : 'Notifications'}
          subtitle={
            notificationsEnabled
              ? (isUrdu ? 'آن — اطلاعات موصول ہوں گی' : 'On — alerts will be received')
              : (isUrdu ? 'بند — کوئی اطلاعات نہیں' : 'Off — no alerts')
          }
          action={
            <ToggleSwitch
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
              label={isUrdu ? 'اطلاعات ٹوگل' : 'Notifications toggle'}
            />
          }
        />

        {/* Dark mode */}
        <PreferenceRow
          icon={darkModeEnabled ? <HiOutlineMoon /> : <HiOutlineSun />}
          title={isUrdu ? 'ڈارک موڈ' : 'Dark Mode'}
          subtitle={
            darkModeEnabled
              ? (isUrdu ? 'آن — رات کے لیے بہتر' : 'On — easier on the eyes')
              : (isUrdu ? 'بند — دن کے لیے بہتر' : 'Off — daytime view')
          }
          action={
            <ToggleSwitch
              checked={darkModeEnabled}
              onChange={handleToggleDarkMode}
              label={isUrdu ? 'ڈارک موڈ ٹوگل' : 'Dark mode toggle'}
            />
          }
        />
      </section>

      {/* ═══════════════ SESSION INFO ═══════════════ */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <HiOutlineDocumentText className="text-emerald-600 text-lg" />
          {isUrdu ? 'گفتگو سیشن' : 'Conversation Session'}
        </h2>

        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          {isUrdu
            ? 'یہ سیشن ID بات چیت کی یادداشت کے لیے استعمال ہوتی ہے۔ اگر آپ نئی گفتگو شروع کرنا چاہیں تو نیا سیشن بنائیں۔'
            : 'This session ID keeps track of your conversation memory. Reset to start a fresh dialogue.'}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <code
              className="text-[11px] font-mono text-slate-600 break-all select-all block"
              dir="ltr"
            >
              {sessionId}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopySession}
            className={`shrink-0 p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
              sessionCopied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
            }`}
            aria-label="Copy session ID"
            title={isUrdu ? 'کاپی کریں' : 'Copy'}
          >
            {sessionCopied ? <HiOutlineCheck className="text-lg" /> : <HiOutlineClipboardDocument className="text-lg" />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetSession}
          className="mt-3 w-full py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <HiOutlineArrowPath className="text-base" />
          {isUrdu ? 'نیا سیشن شروع کریں' : 'Start New Session'}
        </button>
      </section>

      {/* ═══════════════ VOICE COMMANDS HELP ═══════════════ */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
            <HiOutlineMicrophone className="text-lg" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              {isUrdu ? 'آواز سے کیا کر سکتے ہیں؟' : 'What can you do with voice?'}
            </h2>
            <p className="text-xs text-emerald-700 mt-0.5">
              {isUrdu ? 'بس مائیک دبا کر بولیں' : 'Just tap the mic and speak'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VOICE_COMMANDS.map((cmd, idx) => (
            <div
              key={idx}
              className="bg-white/70 backdrop-blur-sm border border-emerald-200/60 rounded-xl p-3 hover:bg-white hover:border-emerald-300 transition-all cursor-default group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{cmd.icon}</span>
                <h3 className="text-xs font-bold text-emerald-900">
                  {isUrdu ? cmd.titleUr : cmd.titleEn}
                </h3>
              </div>
              <p className={`text-[11px] text-slate-600 italic leading-relaxed ${isUrdu ? 'urdu-text text-right' : ''}`} dir={isUrdu ? 'rtl' : 'ltr'}>
                {isUrdu ? cmd.exampleUr : cmd.exampleEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ SUPPORT & LEGAL ═══════════════ */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <HiOutlineQuestionMarkCircle className="text-emerald-600 text-lg" />
          {isUrdu ? 'مدد اور معلومات' : 'Support & Info'}
        </h2>

        <div className="space-y-1">
          <LinkRow
            icon={<HiOutlineQuestionMarkCircle />}
            label={isUrdu ? 'مدد اور سوالات' : 'Help & FAQ'}
            onClick={() => toast(
              isUrdu ? 'جلد دستیاب' : 'Coming soon',
              { icon: '🚧', id: 'prof-help' }
            )}
          />
          <LinkRow
            icon={<HiOutlineShieldCheck />}
            label={isUrdu ? 'پرائیویسی پالیسی' : 'Privacy Policy'}
            onClick={() => toast(
              isUrdu ? 'جلد دستیاب' : 'Coming soon',
              { icon: '🚧', id: 'prof-privacy' }
            )}
          />
          <LinkRow
            icon={<HiOutlineDocumentText />}
            label={isUrdu ? 'شرائط و ضوابط' : 'Terms of Service'}
            onClick={() => toast(
              isUrdu ? 'جلد دستیاب' : 'Coming soon',
              { icon: '🚧', id: 'prof-terms' }
            )}
          />
        </div>
      </section>

      {/* ═══════════════ LOGOUT (if authenticated) ═══════════════ */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full py-4 bg-white hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <HiOutlineArrowRightOnRectangle className="text-lg rtl:rotate-180" />
          <span>{isUrdu ? 'لاگ آؤٹ کریں' : 'Sign Out'}</span>
        </button>
      )}

      {/* Footer version */}
      <p className="text-center text-[10px] text-slate-400 font-medium pt-2">
        AgriMax • v1.0 • {isUrdu ? 'پاکستانی کسانوں کے لیے' : 'For Pakistani farmers'}
      </p>

      {/* ── Modals ── */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        isUrdu={isUrdu}
      />

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditProfileSave}
        currentName={user?.name}
        currentAvatar={user?.avatar}
        isUrdu={isUrdu}
      />
    </div>
  );
}

// ── Sub-components ──

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-xs text-slate-500 font-medium flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-bold text-slate-800 text-end truncate max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function PreferenceRow({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
        style={{
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

function LinkRow({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
    >
      <span className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
        <span className="text-slate-400 group-hover:text-emerald-600 transition-colors">{icon}</span>
        {label}
      </span>
      <span className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all">
        →
      </span>
    </button>
  );
}

export default ProfilePage;