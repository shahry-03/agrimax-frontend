import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import {
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineArrowPath,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { authApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import useChatStore from '../store/useChatStore';
import useVoice from '../hooks/useVoice';
import VoiceButton from '../components/VoiceButton';

// Handles 03XX, +923XX, 923XX, 00923XX
const normalizePakistanPhone = (raw) => {
  let cleaned = String(raw || '').replace(/\D/g, '');
  if (cleaned.startsWith('0092')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
};

const isValidPakistanPhone = (phone) => {
  const normalized = normalizePakistanPhone(phone);
  return normalized.length === 11 && normalized.startsWith('03');
};

const getErrorMessage = (err, language) => {
  const data = err?.response?.data;
  if (err?.friendlyMessage?.[language]) return err.friendlyMessage[language];
  if (language === 'ur' && data?.messageUr) return data.messageUr;
  if (language === 'en' && data?.messageEn) return data.messageEn;
  return null;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneInputId = useId();
  const otpInputId = useId();
  const errorId = useId();

  const { isAuthenticated, login, language } = useAppStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      login: s.login,
      language: s.language,
    }))
  );

  const {
    awaitingOtp,
    pendingPhone,
    setAwaitingOtp,
    isRecording,
    recordingDuration,
    isProcessing,
  } = useChatStore(
    useShallow((s) => ({
      awaitingOtp: s.awaitingOtp,
      pendingPhone: s.pendingPhone,
      setAwaitingOtp: s.setAwaitingOtp,
      isRecording: s.isRecording,
      recordingDuration: s.recordingDuration,
      isProcessing: s.isProcessing,
    }))
  );

  const { startRecording, stopAndProcessAudio } = useVoice();

  // Mode: 'farmer' | 'buyer'
  const [authRole, setAuthRole] = useState('farmer');

  // Buyer sub-mode: 'login' | 'register'
  const [buyerMode, setBuyerMode] = useState('login');

  // Farmer phone state
  const [phoneInput, setPhoneInput] = useState(() => pendingPhone || '');
  const [otp, setOtp] = useState('');

  // Buyer form states
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // 2FA modal state for Buyer
  const [requires2Fa, setRequires2Fa] = useState(false);
  const [tempToken2Fa, setTempToken2Fa] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const timerRef = useRef(null);
  const otpInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const lastErrorInputRef = useRef('');

  const isUrdu = language === 'ur';
  const activePhone = normalizePakistanPhone(phoneInput);
  const isPhoneValid = isValidPakistanPhone(activePhone);
  const step = awaitingOtp && activePhone.length === 11 ? 'otp' : 'phone';

  // Sync pending phone on mount
  useEffect(() => {
    if (pendingPhone && !phoneInput) {
      setPhoneInput(pendingPhone);
    }
  }, [pendingPhone, phoneInput]);

  // Auth redirect
  useEffect(() => {
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Resend cooldown timer
  const startCooldown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(60);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Autofocus
  useEffect(() => {
    if (authRole === 'farmer') {
      const frame = requestAnimationFrame(() => {
        if (step === 'otp') otpInputRef.current?.focus();
        else phoneInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [authRole, step]);

  // Clear errors when inputs change
  useEffect(() => {
    if (error) setError('');
  }, [activePhone, otp, buyerEmail, buyerPassword, authRole, buyerMode]);

  // Farmer Voice Toggle
  const handleVoiceToggle = useCallback(async () => {
    if (isProcessing) return;
    try {
      if (isRecording) {
        await stopAndProcessAudio(isUrdu ? 'ur' : 'en');
      } else {
        await startRecording();
      }
    } catch (err) {
      console.error('[LoginPage] Voice error:', err);
    }
  }, [isProcessing, isRecording, isUrdu, stopAndProcessAudio, startRecording]);

  // Farmer Send OTP
  const handleSendOtp = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isPhoneValid) {
      setError(
        isUrdu
          ? 'براہ کرم درست موبائل نمبر درج کریں (مثال: 03001234567)'
          : 'Please enter a valid mobile number (e.g. 03001234567)'
      );
      return;
    }
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(activePhone);
      setAwaitingOtp(true, activePhone);
      startCooldown();
      toast.success(isUrdu ? 'OTP کوڈ بھیج دیا گیا ہے' : 'OTP has been sent to your phone');
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'OTP نہیں بھیجا جا سکا۔ دوبارہ کوشش کریں۔' : 'Failed to send OTP. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [activePhone, isPhoneValid, isUrdu, language, loading, setAwaitingOtp, startCooldown]);

  // Farmer Verify OTP
  const handleVerifyOtp = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setError(isUrdu ? 'براہ کرم مکمل OTP کوڈ درج کریں' : 'Please enter the complete OTP');
      return;
    }
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp(activePhone, cleanOtp);
      const data = res.data?.data;
      if (!data?.accessToken) throw new Error('Invalid response structure');

      localStorage.setItem('agrimax_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agrimax_refresh_token', data.refreshToken);
      }

      login(
        {
          id: data.userId,
          name: data.name || 'Farmer',
          phone: activePhone,
          role: data.role || 'FARMER',
        },
        data.accessToken,
        data.refreshToken
      );
      setAwaitingOtp(false, '');
      toast.success(isUrdu ? 'لاگ ان کامیاب!' : 'Login successful!');
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'غلط یا منسوخ شدہ OTP۔ دوبارہ کوشش کریں۔' : 'Invalid or expired OTP. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [activePhone, otp, isUrdu, language, login, loading, setAwaitingOtp]);

  // Buyer Login
  const handleBuyerLogin = async (e) => {
    e.preventDefault();
    if (!buyerEmail || !buyerPassword) {
      setError(isUrdu ? 'براہ کرم ای میل اور پاس ورڈ درج کریں' : 'Please enter email and password');
      return;
    }
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      const res = await authApi.buyerLogin({
        email: buyerEmail.trim(),
        password: buyerPassword,
      });
      const data = res.data?.data;

      // Handle 2FA requirement
      if (data?.requiresTwoFactor) {
        setRequires2Fa(true);
        setTempToken2Fa(data.tempToken);
        toast(isUrdu ? 'براہ کرم 2FA کوڈ درج کریں' : 'Please enter your two-factor code', { icon: '🔐' });
        return;
      }

      if (!data?.accessToken) throw new Error('No access token received');

      localStorage.setItem('agrimax_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agrimax_refresh_token', data.refreshToken);
      }

      login(
        {
          id: data.userId,
          name: data.name || 'Buyer',
          email: data.email,
          phone: data.phoneNumber,
          role: data.role || 'BUYER',
          preferredMode: data.preferredMode || 'TEXT',
        },
        data.accessToken,
        data.refreshToken
      );
      toast.success(isUrdu ? 'لاگ ان کامیاب!' : 'Welcome back!');
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'ای میل یا پاس ورڈ درست نہیں ہے' : 'Invalid email or password.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Buyer 2FA Verification
  const handleVerify2Fa = async (e) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.trim().length < 4) {
      setError(isUrdu ? 'درست 2FA کوڈ درج کریں' : 'Please enter valid 2FA code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.buyerVerify2fa({
        tempToken: tempToken2Fa,
        code: twoFactorCode.trim(),
      });
      const data = res.data?.data;
      if (!data?.accessToken) throw new Error('2FA verification failed');

      localStorage.setItem('agrimax_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agrimax_refresh_token', data.refreshToken);
      }

      login(
        {
          id: data.userId,
          name: data.name || 'Buyer',
          email: data.email,
          phone: data.phoneNumber,
          role: data.role || 'BUYER',
        },
        data.accessToken,
        data.refreshToken
      );
      setRequires2Fa(false);
      toast.success(isUrdu ? '2FA لاگ ان کامیاب!' : '2FA verified!');
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'غلط 2FA کوڈ' : 'Invalid 2FA code. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Buyer Registration
  const handleBuyerRegister = async (e) => {
    e.preventDefault();
    if (!buyerName || !buyerEmail || !buyerPassword) {
      setError(isUrdu ? 'تمام ضروری خانے پر کریں' : 'Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.buyerRegister({
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        password: buyerPassword,
        phoneNumber: buyerPhone ? normalizePakistanPhone(buyerPhone) : undefined,
      });

      setSuccessMsg(
        isUrdu
          ? 'اکاؤنٹ بن گیا! براہ کرم اپنی ای میل میں تصدیقی لنک چیک کریں۔'
          : 'Registration successful! Please check your email to verify your account.'
      );
      setBuyerMode('login');
      toast.success(isUrdu ? 'اکاؤنٹ بن گیا!' : 'Registered successfully!');
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'رجسٹریشن مکمل نہیں ہو سکی۔' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      await authApi.buyerForgotPassword(forgotEmail.trim());
      setShowForgotModal(false);
      toast.success(
        isUrdu
          ? 'پاس ورڈ ری سیٹ کا لنک ای میل پر بھیج دیا گیا ہے'
          : 'Password reset link sent to your email'
      );
    } catch (err) {
      toast.error(
        getErrorMessage(err, language) ||
        (isUrdu ? 'ای میل نہیں بھیجی جا سکی' : 'Could not send reset link')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = useCallback((e) => {
    let raw = e.target.value;
    const hasPlus = raw.trim().startsWith('+');
    let digits = raw.replace(/\D/g, '');
    if (hasPlus) digits = '+' + digits;
    setPhoneInput(digits);
  }, []);

  const handleOtpPaste = useCallback((e) => {
    const text = e.clipboardData?.getData('text') || '';
    const normalized = text
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
      .replace(/\D/g, '')
      .slice(0, 6);
    if (normalized) {
      e.preventDefault();
      setOtp(normalized);
    }
  }, []);

  const handleChangeNumber = useCallback(() => {
    setAwaitingOtp(false, '');
    setOtp('');
    setError('');
    setTimeout(() => phoneInputRef.current?.focus(), 50);
  }, [setAwaitingOtp]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col items-center justify-center p-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/25 mb-3 group hover:scale-105 transition-transform">
          <svg className="w-9 h-9" viewBox="0 0 38 38" fill="none">
            <path
              d="M18.8 4.2C12.2 5.5 7.1 11.5 6.2 18.8C5.5 25.8 9.5 31.5 17.8 31.8C19.8 31.9 21.5 31.3 22.8 30.2C20.8 25.8 21.5 20.2 24.8 15.2C27.8 10.8 24 3.8 18.8 4.2Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          AgriMax <span className="text-emerald-600 font-extrabold">{isUrdu ? 'لاگ ان' : 'Portal'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          {isUrdu
            ? 'کسانوں اور خریداروں کا محفوظ زرعی پلیٹ فارم'
            : 'Secure agricultural trading for farmers & buyers'}
        </p>

        {/* ── Role Switcher ── */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl mt-5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthRole('farmer');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authRole === 'farmer'
                ? 'bg-white text-emerald-800 shadow-sm shadow-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌾</span>
            <span>{isUrdu ? 'کسان (فون OTP)' : 'Farmer (OTP)'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthRole('buyer');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authRole === 'buyer'
                ? 'bg-white text-emerald-800 shadow-sm shadow-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>💼</span>
            <span>{isUrdu ? 'خریدار (ای میل)' : 'Buyer (Email)'}</span>
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5">
        {/* Success Message Banner */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
            <HiOutlineShieldCheck className="text-emerald-600 text-lg shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            FARMER AUTH VIEW (Phone OTP + Voice)
        ────────────────────────────────────────────────────────── */}
        {authRole === 'farmer' && (
          <>
            {/* Voice Prompt Box */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
                  <HiOutlineSparkles className="text-xs" />
                  <span>{isUrdu ? 'صوتی لاگ ان کی سہولت' : 'Voice-Assisted Login'}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
                  {step === 'otp'
                    ? (isUrdu
                        ? <>مائیک دبائیں اور موصول شدہ 6 ہندسوں کا کوڈ بولیں:<br /><strong className="text-emerald-700 font-bold">&ldquo;میرا کوڈ 123456 ہے&rdquo;</strong></>
                        : <>Tap mic and speak your 6-digit OTP:<br /><strong className="text-emerald-700 font-bold">&ldquo;My code is 123456&rdquo;</strong></>)
                    : (isUrdu
                        ? <>مائیک دبائیں اور بولیں:<br /><strong className="text-emerald-700 font-bold">&ldquo;لاگ ان کرو، نمبر 03001234567&rdquo;</strong></>
                        : <>Tap mic and speak:<br /><strong className="text-emerald-700 font-bold">&ldquo;Login with 03001234567&rdquo;</strong></>)}
                </p>
                <div className="flex justify-center pt-1">
                  <VoiceButton
                    onStart={handleVoiceToggle}
                    onStop={handleVoiceToggle}
                    isRecording={isRecording}
                    disabled={isProcessing || loading}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-3 font-medium">
                  {isRecording
                    ? (isUrdu ? `🎤 ریکارڈ ہو رہا ہے (${recordingDuration}s)...` : `🎤 Recording (${recordingDuration}s)...`)
                    : isProcessing
                    ? (isUrdu ? '⏳ تجزیہ ہو رہا ہے...' : '⏳ Processing voice...')
                    : step === 'otp'
                    ? (isUrdu ? 'مائیک دبا کر اپنا OTP کوڈ بولیں' : 'Tap mic to speak your OTP')
                    : (isUrdu ? 'مائیک دبا کر اپنا نمبر بولیں' : 'Tap mic to speak your phone number')}
                </p>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                {isUrdu ? 'یا کی پیڈ سے درج کریں' : 'Or use keypad'}
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4 motion-safe:animate-fade-in">
                <div>
                  <label htmlFor={phoneInputId} className="block text-xs font-bold text-slate-700 mb-2">
                    {isUrdu ? 'موبائل فون نمبر' : 'Mobile Phone Number'}
                  </label>
                  <input
                    id={phoneInputId}
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneInput}
                    onChange={handlePhoneChange}
                    placeholder="03001234567"
                    maxLength={14}
                    disabled={loading}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 text-center tracking-widest transition-all disabled:opacity-50 font-medium font-mono"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !isPhoneValid}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 disabled:shadow-none transition-all text-base flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isUrdu ? 'OTP کوڈ حاصل کریں' : 'Get OTP Code'}</span>
                      <HiOutlineArrowRight className="text-lg rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 motion-safe:animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor={otpInputId} className="text-xs font-bold text-slate-700">
                      {isUrdu ? 'OTP کوڈ درج کریں' : 'Enter OTP Code'}
                    </label>
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {isUrdu ? 'نمبر تبدیل کریں' : 'Change Number'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">
                    {isUrdu ? 'کوڈ بھیجا گیا:' : 'Code sent to:'}{' '}
                    <strong className="text-slate-700 font-mono" dir="ltr">{activePhone}</strong>
                  </p>
                  <input
                    id={otpInputId}
                    ref={otpInputRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onPaste={handleOtpPaste}
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-3xl text-slate-800 placeholder-slate-300 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 text-center tracking-[0.5em] transition-all disabled:opacity-50 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.trim().length < 4}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 disabled:shadow-none transition-all text-base flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isUrdu ? 'لاگ ان مکمل کریں' : 'Complete Login'}</span>
                      <HiOutlineShieldCheck className="text-lg" />
                    </>
                  )}
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-xs text-slate-500 hover:text-emerald-600 disabled:text-slate-400 disabled:cursor-not-allowed transition cursor-pointer font-bold"
                  >
                    {resendCooldown > 0
                      ? (isUrdu ? `دوبارہ بھیجیں (${resendCooldown}s)` : `Resend in ${resendCooldown}s`)
                      : (isUrdu ? 'دوبارہ OTP کوڈ بھیجیں' : 'Resend OTP Code')}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────
            BUYER AUTH VIEW (Email/Password + Register + 2FA)
        ────────────────────────────────────────────────────────── */}
        {authRole === 'buyer' && (
          <div className="space-y-4">
            {/* Buyer Sub Tabs */}
            <div className="flex border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setBuyerMode('login')}
                className={`flex-1 pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  buyerMode === 'login'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {isUrdu ? 'لاگ ان' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setBuyerMode('register')}
                className={`flex-1 pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  buyerMode === 'register'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {isUrdu ? 'نیا اکاؤنٹ بنائیں' : 'Create Account'}
              </button>
            </div>

            {buyerMode === 'login' ? (
              <form onSubmit={handleBuyerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isUrdu ? 'ای میل ایڈریس' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="buyer@agrimax.pk"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isUrdu ? 'پاس ورڈ' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {isUrdu ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="password"
                      value={buyerPassword}
                      onChange={(e) => setBuyerPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{isUrdu ? 'خریدار لاگ ان' : 'Sign In as Buyer'}</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBuyerRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isUrdu ? 'مکمل نام' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Asad Ali"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isUrdu ? 'ای میل ایڈریس' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="buyer@agrimax.pk"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isUrdu ? 'پاس ورڈ (کم از کم 8 حروف)' : 'Password (min 8 chars)'}
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="password"
                      value={buyerPassword}
                      onChange={(e) => setBuyerPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isUrdu ? 'موبائل نمبر (اختیاری)' : 'Mobile Number (optional)'}
                  </label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-mono"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{isUrdu ? 'رجسٹر کریں' : 'Register Buyer Account'}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div
            id={errorId}
            role="alert"
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 motion-safe:animate-fade-up"
          >
            <HiOutlineExclamationTriangle className="text-red-500 text-lg shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-medium leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      {/* 2FA Verification Modal */}
      {requires2Fa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
              <HiOutlineKey />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-800">
              {isUrdu ? 'دو مرحلہ تصدیق (2FA)' : 'Two-Factor Authentication'}
            </h3>
            <p className="text-center text-xs text-slate-500 leading-relaxed">
              {isUrdu
                ? 'اپنے Google Authenticator یا بیک اپ کوڈ سے 6 ہندسوں کا کوڈ درج کریں:'
                : 'Enter the 6-digit code from your authenticator app or backup code:'}
            </p>
            <form onSubmit={handleVerify2Fa} className="space-y-4">
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.trim())}
                placeholder="123456"
                maxLength={8}
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 text-center text-2xl font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm"
              >
                {loading ? 'Verifying...' : (isUrdu ? 'تصدیق کریں' : 'Verify & Continue')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <HiOutlineXMark className="text-xl" />
            </button>
            <h3 className="text-base font-bold text-slate-800">
              {isUrdu ? 'پاس ورڈ ری سیٹ کریں' : 'Reset Your Password'}
            </h3>
            <p className="text-xs text-slate-500">
              {isUrdu
                ? 'اپنا رجسٹرڈ ای میل ایڈریس درج کریں۔ ہم پاس ورڈ تبدیل کرنے کا لنک بھیجیں گے۔'
                : 'Enter your registered email address to receive password reset instructions.'}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="buyer@agrimax.pk"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm"
              >
                {loading ? 'Sending...' : (isUrdu ? 'ری سیٹ لنک بھیجیں' : 'Send Reset Link')}
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-slate-400 mt-6 max-w-md font-medium">
        {isUrdu
          ? 'لاگ ان کر کے آپ ہماری شرائط و ضوابط اور پرائیویسی پالیسی سے اتفاق کرتے ہیں۔'
          : 'By logging in, you agree to our Terms of Service and Privacy Policy.'}
      </p>
    </div>
  );
}

export default LoginPage;