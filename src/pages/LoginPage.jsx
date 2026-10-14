import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import useVoice from '../hooks/useVoice';
import VoiceButton from '../components/VoiceButton';

export function LoginPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    login,
    language,
    awaitingOtp,
    pendingPhone,
    setAwaitingOtp,
    isRecording,
    recordingDuration,
    isProcessing,
  } = useAppStore();
  const { startRecording, stopAndProcessAudio } = useVoice();

  // If already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [overridePhoneStep, setOverridePhoneStep] = useState(false);
  const [manualPhone, setManualPhone] = useState('');

  // Derived step: synchronized between manual keypad & voice login
  const step = awaitingOtp && !overridePhoneStep ? 'otp' : 'phone';
  const phone = overridePhoneStep ? manualPhone : (pendingPhone || manualPhone);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
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

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!phone || phone.length < 10) {
      setError(
        language === 'ur'
          ? 'براہ کرم درست فون نمبر درج کریں (مثال: 03001234567)'
          : 'Please enter a valid phone number (e.g. 03001234567)'
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(phone);
      setAwaitingOtp(true, phone);
      setOverridePhoneStep(false);
      startCooldown();
    } catch (err) {
      setError(
        err.friendlyMessage?.[language] ||
          err.response?.data?.messageUr ||
          'OTP نہیں بھیجا جا سکا۔ دوبارہ کوشش کریں۔'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length < 4) {
      setError(
        language === 'ur' ? 'براہ کرم درست OTP درج کریں' : 'Please enter valid OTP'
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp(phone, otp);
      const data = res.data?.data;
      if (data?.accessToken) {
        login(
          { id: data.userId, name: data.name || 'Farmer', phone },
          data.accessToken,
          data.refreshToken
        );
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(
        err.friendlyMessage?.[language] ||
          err.response?.data?.messageUr ||
          'غلط یا منسوخ شدہ OTP۔ دوبارہ کوشش کریں۔'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6 animate-fade-up">
        <span className="text-5xl block mb-2">🌾</span>
        <h1 className="text-3xl font-black text-[#078747] tracking-tight">
          AgriMax
        </h1>
        <p className="text-[#62758A] font-medium text-sm sm:text-base mt-1 urdu-text">
          پاکستانی کسانوں کا آواز پر مبنی پلیٹ فارم
        </p>
      </div>

      <div className="w-full max-w-md bg-white border border-[#E2EAF0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* ── Option A: Voice-First Login (Core Highlight) ── */}
        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-4 text-center space-y-3 shadow-2xs">
          <p className="text-xs uppercase tracking-wider text-[#056B3B] font-extrabold">
            🌟 آواز سے فوری لاگ ان (Voice Login)
          </p>
          <p className="text-sm text-[#102A43] urdu-text leading-relaxed">
            {step === 'otp' ? (
              <>
                مائیک دبائیں اور بولیں:
                <br />
                <strong className="text-[#078747]">
                  &ldquo;میرا او ٹی پی کوڈ 123456 ہے&rdquo;
                </strong>
              </>
            ) : (
              <>
                مائیک دبائیں اور بولیں:
                <br />
                <strong className="text-[#078747]">
                  &ldquo;لاگ ان کرو، نمبر 03001234567 ہے&rdquo;
                </strong>
              </>
            )}
          </p>

          <div className="flex justify-center pt-2">
            <VoiceButton
              onStart={startRecording}
              onStop={stopAndProcessAudio}
              isRecording={isRecording}
              disabled={isProcessing}
            />
          </div>
          <p className="text-[11px] text-[#62758A]">
            {isRecording
              ? `🎤 ریکارڈ ہو رہا ہے (${recordingDuration}s)... مکمل کر کے دوبارہ دبائیں`
              : isProcessing
              ? '⏳ آواز کا تجزیہ ہو رہا ہے (Whisper)...'
              : step === 'otp'
              ? 'مائیک دبا کر اپنا OTP کوڈ بولیں'
              : 'مائیک دبا کر اپنا نمبر بولیں'}
          </p>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E2EAF0]"></div>
          <span className="flex-shrink mx-4 text-xs text-[#829AB1] uppercase font-semibold">
            یا کی پیڈ سے درج کریں
          </span>
          <div className="flex-grow border-t border-[#E2EAF0]"></div>
        </div>

        {/* ── Option B: Manual Input (Fallback Keypad) ── */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#102A43] mb-2 urdu-text">
                موبائل فون نمبر (Mobile Phone Number):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setManualPhone(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="03001234567"
                maxLength={13}
                className="w-full bg-[#F8FAFC] border border-[#E2EAF0] rounded-2xl px-4 py-3.5 text-lg text-[#102A43] placeholder-[#829AB1] focus:outline-none focus:border-[#078747] focus:bg-white text-center tracking-widest transition"
                dir="ltr"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full py-4 bg-[#078747] hover:bg-[#056B3B] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-sm transition text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="urdu-text">OTP کوڈ بھیجیں</span>
                  <span>➤</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#102A43] urdu-text">
                  OTP کوڈ درج کریں:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAwaitingOtp(false, '');
                    setOverridePhoneStep(true);
                  }}
                  className="text-xs text-[#078747] font-semibold hover:underline cursor-pointer"
                >
                  نمبر تبدیل کریں
                </button>
              </div>
              <p className="text-xs text-[#62758A] mb-2">
                کوڈ بھیجا گیا: <strong className="text-[#102A43]">{phone}</strong>
              </p>
              <input
                type="tel"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#F8FAFC] border border-[#E2EAF0] rounded-2xl px-4 py-3.5 text-2xl text-[#102A43] placeholder-[#829AB1] focus:outline-none focus:border-[#078747] focus:bg-white text-center tracking-[0.4em] transition"
                dir="ltr"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-4 bg-[#078747] hover:bg-[#056B3B] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-sm transition text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="urdu-text">لاگ ان مکمل کریں</span>
                  <span>✅</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleSendOtp}
                className="text-xs text-[#62758A] hover:text-[#078747] disabled:text-slate-400 transition cursor-pointer font-medium"
              >
                {resendCooldown > 0
                  ? `دوبارہ بھیجیں (${resendCooldown}s)`
                  : 'دوبارہ OTP کوڈ بھیجیں'}
              </button>
            </div>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
