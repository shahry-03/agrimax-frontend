import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import {
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
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

  // ✅ Initialize input from pendingPhone on mount (voice login flow)
  const [phoneInput, setPhoneInput] = useState(() => pendingPhone || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const timerRef = useRef(null);
  const otpInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const lastErrorInputRef = useRef('');

  const isUrdu = language === 'ur';
  
  // ✅ FIXED: activePhone derives ONLY from phoneInput (no ghost fallback)
  const activePhone = normalizePakistanPhone(phoneInput);
  const isPhoneValid = isValidPakistanPhone(activePhone);

  const step = awaitingOtp && activePhone.length === 11 ? 'otp' : 'phone';

  // ✅ FIXED: Only sync pendingPhone if input is empty (user hasn't typed)
  useEffect(() => {
    if (pendingPhone && !phoneInput) {
      setPhoneInput(pendingPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPhone]);

  // Auth redirect
  useEffect(() => {
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Resend cooldown
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
    const frame = requestAnimationFrame(() => {
      if (step === 'otp') otpInputRef.current?.focus();
      else phoneInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  // Smart error clear
  useEffect(() => {
    if (!error) return;
    const currentSig = `${activePhone}|${otp}`;
    if (lastErrorInputRef.current && lastErrorInputRef.current !== currentSig) {
      setError('');
      lastErrorInputRef.current = '';
    }
  }, [activePhone, otp, error]);

  // Voice toggle
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

  // Send OTP
  const handleSendOtp = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isPhoneValid) {
      setError(
        isUrdu
          ? 'براہ کرم درست موبائل نمبر درج کریں (مثال: 03001234567)'
          : 'Please enter a valid mobile number (e.g. 03001234567)'
      );
      lastErrorInputRef.current = `${activePhone}|${otp}`;
      return;
    }
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(activePhone);
      setAwaitingOtp(true, activePhone);
      startCooldown();
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'OTP نہیں بھیجا جا سکا۔ دوبارہ کوشش کریں۔' : 'Failed to send OTP. Please try again.')
      );
      lastErrorInputRef.current = `${activePhone}|${otp}`;
    } finally {
      setLoading(false);
    }
  }, [activePhone, isPhoneValid, isUrdu, language, loading, otp, setAwaitingOtp, startCooldown]);

  // Verify OTP
  const handleVerifyOtp = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setError(isUrdu ? 'براہ کرم مکمل OTP کوڈ درج کریں' : 'Please enter the complete OTP');
      lastErrorInputRef.current = `${activePhone}|${otp}`;
      return;
    }
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp(activePhone, cleanOtp);
      const data = res.data?.data;
      if (!data?.accessToken) throw new Error('Invalid response structure');

      // ✅ Explicit localStorage for refresh token consistency with useVoice
      localStorage.setItem('agrimax_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agrimax_refresh_token', data.refreshToken);
      }

      login(
        { id: data.userId, name: data.name || 'Farmer', phone: activePhone },
        data.accessToken,
        data.refreshToken
      );
      setAwaitingOtp(false, '');
    } catch (err) {
      setError(
        getErrorMessage(err, language) ||
        (isUrdu ? 'غلط یا منسوخ شدہ OTP۔ دوبارہ کوشش کریں۔' : 'Invalid or expired OTP. Please try again.')
      );
      lastErrorInputRef.current = `${activePhone}|${otp}`;
    } finally {
      setLoading(false);
    }
  }, [activePhone, otp, isUrdu, language, login, loading, setAwaitingOtp]);

  const handlePhoneChange = useCallback((e) => {
    let raw = e.target.value;
    const hasPlus = raw.trim().startsWith('+');
    let digits = raw.replace(/\D/g, '');
    if (hasPlus) digits = '+' + digits;
    setPhoneInput(digits);
  }, []);

  // Handles Urdu + Arabic digits in paste
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
    setPhoneInput(activePhone); // Preserve current number for editing
    setError('');
    lastErrorInputRef.current = '';
  }, [activePhone, setAwaitingOtp]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-slate-50 to-white"
    >
      {/* Brand Header */}
      <div className="text-center mb-8 motion-safe:animate-fade-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-500/20 mb-4">
          <span className="text-4xl">🌾</span>
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
          <span className="text-emerald-600">Agri</span>Max
        </h1>
        <p className="text-slate-500 font-medium text-sm sm:text-base mt-2">
          {isUrdu ? 'پاکستانی کسانوں کا آواز پر مبنی پلیٹ فارم' : "Pakistan's voice-first farming platform"}
        </p>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6 motion-safe:animate-fade-up">
        
        {/* Voice Login Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-5 text-center space-y-4">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-emerald-200 text-[11px] uppercase tracking-wider text-emerald-700 font-extrabold shadow-sm">
              <HiOutlineSparkles className="text-sm" />
              {isUrdu ? 'آواز سے لاگ ان' : 'Voice Login'}
            </div>
            <p className="text-sm text-slate-700 mt-3 mb-4 leading-relaxed">
              {step === 'otp'
                ? (isUrdu
                    ? <>مائیک دبائیں اور بولیں:<br /><strong className="text-emerald-700 font-bold">&ldquo;میرا او ٹی پی کوڈ 123456 ہے&rdquo;</strong></>
                    : <>Tap mic and speak:<br /><strong className="text-emerald-700 font-bold">&ldquo;My OTP is 123456&rdquo;</strong></>)
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

        {/* ✅ FIXED: Conditional rendering (no layout collapse) */}
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
                  <span>{isUrdu ? 'OTP کوڈ بھیجیں' : 'Send OTP Code'}</span>
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

        {error && (
          <div
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 motion-safe:animate-fade-up"
          >
            <HiOutlineExclamationTriangle className="text-red-500 text-lg shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-medium leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-6 max-w-md font-medium">
        {isUrdu
          ? 'لاگ ان کر کے آپ ہماری شرائط و ضوابط اور پرائیویسی پالیسی سے اتفاق کرتے ہیں۔'
          : 'By logging in, you agree to our Terms of Service and Privacy Policy.'}
      </p>
    </div>
  );
}

export default LoginPage;