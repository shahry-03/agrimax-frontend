import { useState, useEffect, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  HiOutlineCpuChip,
  HiOutlineChartBar,
  HiOutlineWifi,
  HiOutlineMicrophone,
  HiOutlineCheck,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import useAppStore from '../store/useAppStore';

// ── Loading phases with real milestones ──
const PHASES = [
  { id: 'init', icon: HiOutlineCpuChip, labelEn: 'Initializing', labelUr: 'شروع ہو رہا ہے', endAt: 25 },
  { id: 'crops', icon: HiOutlineChartBar, labelEn: 'Loading crops', labelUr: 'فصلیں لوڈ ہو رہی ہیں', endAt: 55 },
  { id: 'connect', icon: HiOutlineWifi, labelEn: 'Connecting services', labelUr: 'سروسز جوڑ رہے ہیں', endAt: 80 },
  { id: 'ready', icon: HiOutlineMicrophone, labelEn: 'Ready', labelUr: 'تیار', endAt: 100 },
];

// Phase durations in ms — total ~1.6s
const PHASE_DURATIONS = [400, 500, 400, 300];

export default function SplashScreen({ onFinish }) {
  const { language } = useAppStore(
    useShallow((s) => ({ language: s.language }))
  );
  const isUrdu = language === 'ur';

  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  const finishedRef = useRef(false);
  const timersRef = useRef([]);

  // ── Complete function (guaranteed to fire once) ──
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  // ── Exit animation → then finish ──
  const triggerExit = useCallback(() => {
    if (finishedRef.current) return;
    setIsClosing(true);
    const t = setTimeout(finish, 450);
    timersRef.current.push(t);
  }, [finish]);

  // ── Enable skip after 800ms (don't allow instant skip on first frame) ──
  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), 800);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, []);

  // ── Skip handler ──
  const handleSkip = useCallback(() => {
    if (isClosing || finishedRef.current) return;
    triggerExit();
  }, [isClosing, triggerExit]);

  // ── Keyboard: Enter / Esc to skip ──
  useEffect(() => {
    if (!canSkip) return;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canSkip, handleSkip]);

  // ── Main progress animation (RAF + ease-out) ──
  useEffect(() => {
    const totalDuration = PHASE_DURATIONS.reduce((a, b) => a + b, 0);
    const cumulative = [];
    let sum = 0;
    PHASE_DURATIONS.forEach((d) => { sum += d; cumulative.push(sum); });

    const startTime = Date.now();
    let rafId;

    const tick = () => {
      if (finishedRef.current) return;

      const elapsed = Date.now() - startTime;
      const linearPct = Math.min(100, (elapsed / totalDuration) * 100);
      // Ease-out curve for a smoother finish
      const eased = Math.min(100, Math.pow(linearPct / 100, 0.85) * 100);

      setProgress(Math.floor(eased));

      // Phase detection
      let phase = 0;
      for (let i = 0; i < cumulative.length; i++) {
        if (elapsed >= cumulative[i]) phase = i + 1;
        else break;
      }
      setCurrentPhase(Math.min(phase, PHASES.length));

      if (linearPct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        triggerExit();
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [triggerExit]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      role="status"
      aria-label={isUrdu ? 'لوڈ ہو رہا ہے' : 'Loading application'}
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ease-out ${
        isClosing ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)' }}
    >
      {/* ═══════════════ DECORATIVE BACKGROUND ═══════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl motion-safe:animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl motion-safe:animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

        {/* Floating leaves */}
        <div className="motion-safe:animate-float-slow absolute top-[15%] left-[8%] text-4xl opacity-20 select-none">🌿</div>
        <div className="motion-safe:animate-float-slow absolute top-[25%] right-[12%] text-3xl opacity-15 select-none" style={{ animationDelay: '1s' }}>🌾</div>
        <div className="motion-safe:animate-float-slow absolute bottom-[20%] left-[18%] text-3xl opacity-15 select-none" style={{ animationDelay: '2s' }}>🍃</div>
        <div className="motion-safe:animate-float-slow absolute bottom-[28%] right-[10%] text-2xl opacity-20 select-none" style={{ animationDelay: '1.5s' }}>🌱</div>
      </div>

      {/* ═══════════════ SKIP BUTTON ═══════════════ */}
      {canSkip && !isClosing && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-6 end-6 z-20 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 motion-safe:animate-fade-up"
          aria-label={isUrdu ? 'چھوڑیں' : 'Skip loading'}
        >
          <span>{isUrdu ? 'چھوڑیں' : 'Skip'}</span>
          <HiOutlineArrowRight className="text-sm rtl:rotate-180" />
        </button>
      )}

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="relative z-10 w-full max-w-sm px-6 text-center">

        {/* ── Animated Logo ── */}
        <div className="relative inline-flex items-center justify-center mb-8 motion-safe:animate-fade-up">
          {/* Outer glow */}
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-emerald-500/25 blur-2xl motion-safe:animate-pulse" style={{ animationDuration: '3s' }} />
          {/* Ping ring */}
          <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-emerald-500/30 motion-safe:animate-ping" style={{ animationDuration: '2.5s' }} />

          {/* Logo card */}
          <div className="relative w-28 h-28 rounded-[2rem] bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <span className="text-6xl select-none drop-shadow-lg">🌾</span>
          </div>
        </div>

        {/* ── Brand Name ── */}
        <h1
          className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-3 motion-safe:animate-fade-up"
          style={{ animationDelay: '150ms' }}
        >
          <span className="text-white">Agri</span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Max
          </span>
        </h1>

        {/* ── Tagline ── */}
        <div
          className="space-y-1 motion-safe:animate-fade-up"
          style={{ animationDelay: '300ms' }}
        >
          <p className={`text-emerald-300/90 text-base font-bold ${isUrdu ? 'urdu-text' : ''}`}>
            {isUrdu ? 'کسانوں کا ذہین ساتھی' : "Pakistan's Voice-First AI"}
          </p>
          <p className="text-slate-500 text-xs font-medium">
            {isUrdu ? 'AI سے چلنے والی زراعت' : 'AI-Powered Smart Farming'}
          </p>
        </div>

        {/* ── Phase Checklist ── */}
        <div
          className="mt-10 motion-safe:animate-fade-up"
          style={{ animationDelay: '450ms' }}
        >
          <div className="space-y-2 text-start">
            {PHASES.map((phase, idx) => {
              const isComplete = currentPhase > idx;
              const isActive = currentPhase === idx;
              const Icon = phase.icon;
              return (
                <div
                  key={phase.id}
                  className={`flex items-center gap-2.5 text-xs font-medium transition-all duration-300 ${
                    isComplete
                      ? 'text-emerald-400'
                      : isActive
                      ? 'text-white'
                      : 'text-slate-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                        ? 'bg-white/10 text-white motion-safe:animate-pulse'
                        : 'bg-white/5 text-slate-600'
                    }`}
                  >
                    {isComplete ? (
                      <HiOutlineCheck className="text-sm" />
                    ) : (
                      <Icon className="text-xs" />
                    )}
                  </div>
                  <span className={`flex-1 truncate ${isUrdu ? 'urdu-text' : ''}`}>
                    {isUrdu ? phase.labelUr : phase.labelEn}
                  </span>
                  {isComplete && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {phase.endAt}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Segmented Progress Bar ── */}
        <div
          className="mt-6 motion-safe:animate-fade-up"
          style={{ animationDelay: '600ms' }}
        >
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
            {/* Segment dividers */}
            {PHASES.slice(0, -1).map((phase) => (
              <div
                key={phase.id}
                className="absolute top-0 bottom-0 w-px bg-slate-700/60 z-10"
                style={{ left: `${phase.endAt}%` }}
              />
            ))}
            {/* Progress fill */}
            <div
              className="absolute top-0 bottom-0 start-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-full transition-[width] duration-100 ease-out"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
              }}
            >
              {/* Glow tip */}
              <div className="absolute top-0 bottom-0 end-0 w-4 bg-emerald-300 blur-md opacity-80" />
            </div>
          </div>

          {/* Progress label row */}
          <div className="flex items-center justify-between mt-2.5 text-[10px] font-bold">
            <span className="text-slate-500 uppercase tracking-widest">
              {isUrdu ? 'لوڈ ہو رہا ہے' : 'Loading'}
            </span>
            <span className="text-emerald-400 font-mono tabular-nums">
              {progress}%
            </span>
          </div>
        </div>

        {/* ── Version Footer ── */}
        <p
          className="mt-12 text-[10px] text-slate-600 font-medium motion-safe:animate-fade-up"
          style={{ animationDelay: '750ms' }}
        >
          v1.0 • {isUrdu ? 'پاکستانی کسانوں کے لیے بنایا گیا' : 'Built for Pakistani farmers'}
        </p>

      </div>
    </div>
  );
}