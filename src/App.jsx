import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, lazy, Suspense, Component } from 'react';
import useAppStore from './store/useAppStore';

// ══════════════════════════════════════════════════════
// Eager: critical path
// ══════════════════════════════════════════════════════
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// ══════════════════════════════════════════════════════
// ✅ ChunkLoadError-safe lazy importer
// - Guards sessionStorage (incognito safe)
// - Returns never-resolving promise on reload (no null flash)
// - Only retries once (prevents infinite reload loops)
// ══════════════════════════════════════════════════════
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    // Read retry flag safely
    let alreadyRetried = false;
    try {
      alreadyRetried =
        window.sessionStorage.getItem('agrimax_chunk_retry') === 'true';
    } catch {
      // Incognito — skip retry logic, just attempt import
    }

    try {
      const component = await componentImport();
      // Success — clear retry flag
      try {
        window.sessionStorage.setItem('agrimax_chunk_retry', 'false');
      } catch {}
      return component;
    } catch (error) {
      // If we haven't retried yet, force reload to get fresh chunks
      if (!alreadyRetried) {
        try {
          window.sessionStorage.setItem('agrimax_chunk_retry', 'true');
        } catch {}
        window.location.reload();
        // Never resolve — page is reloading
        return new Promise(() => {});
      }
      // Already retried — surface the real error
      throw error;
    }
  });
}

// Lazy pages
const PricesPage = lazyWithRetry(() => import('./pages/PricesPage'));
const MarketplacePage = lazyWithRetry(() => import('./pages/MarketplacePage'));
const WalletPage = lazyWithRetry(() => import('./pages/WalletPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const NotificationsPage = lazyWithRetry(() => import('./pages/NotificationsPage'));

// ══════════════════════════════════════════════════════
// Bilingual tab titles
// ══════════════════════════════════════════════════════
const ROUTE_TITLES = {
  '/': { en: 'Home', ur: 'ہوم' },
  '/login': { en: 'Sign In', ur: 'لاگ ان' },
  '/prices': { en: 'Mandi Prices', ur: 'منڈی کے ریٹس' },
  '/marketplace': { en: 'Marketplace', ur: 'مارکیٹ' },
  '/my-posts': { en: 'My Posts', ur: 'میری پوسٹس' },
  '/wallet': { en: 'Wallet', ur: 'والیٹ' },
  '/profile': { en: 'Profile', ur: 'پروفائل' },
  '/settings': { en: 'Settings', ur: 'سیٹنگز' },
  '/notifications': { en: 'Notifications', ur: 'اطلاعات' },
};

// ══════════════════════════════════════════════════════
// Error Boundary
// ══════════════════════════════════════════════════════
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info?.componentStack);
    }
    // TODO: Sentry/Bugsnag in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-md text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-100 text-rose-600">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-500">
                We apologize for the inconvenience. Please try again.
              </p>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Go Home
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left text-xs bg-slate-100 rounded-lg p-3">
                <summary className="cursor-pointer font-bold text-slate-700">
                  Error Details (dev only)
                </summary>
                <pre className="mt-2 overflow-auto text-rose-600 whitespace-pre-wrap break-words max-h-48">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ══════════════════════════════════════════════════════
// Loaders
// ══════════════════════════════════════════════════════
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] py-12">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        Loading...
      </p>
    </div>
  </div>
);

const LazyRoute = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// ══════════════════════════════════════════════════════
// Route side-effects — only route-specific concerns
// (document.documentElement.dir is handled by stores — no duplication)
// ══════════════════════════════════════════════════════
function RouteEffects() {
  const location = useLocation();
  const language = useAppStore((s) => s.language);
  const isUrdu = language === 'ur';

  useEffect(() => {
    // 1. Scroll to top on every navigation
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {}

    // 2. Bilingual document title
    const routeInfo = ROUTE_TITLES[location.pathname];
    const pageName = routeInfo ? (isUrdu ? routeInfo.ur : routeInfo.en) : null;
    document.title = pageName
      ? `${pageName} · AgriMax`
      : `AgriMax — ${isUrdu ? 'کسانوں کا ذہین ساتھی' : 'AI-Powered Smart Farming'}`;
  }, [location.pathname, isUrdu]);

  return null;
}

// ══════════════════════════════════════════════════════
// Routes
// ══════════════════════════════════════════════════════
function AppRoutes() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return (
    <>
      <RouteEffects />
      <Routes>
        {/* Public login — redirect to home if already authenticated */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Main shell */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/prices" element={<LazyRoute><PricesPage /></LazyRoute>} />
          <Route path="/marketplace" element={<LazyRoute><MarketplacePage /></LazyRoute>} />
          <Route path="/my-posts" element={<LazyRoute><MarketplacePage /></LazyRoute>} />
          <Route path="/profile" element={<LazyRoute><ProfilePage /></LazyRoute>} />
          <Route path="/settings" element={<LazyRoute><ProfilePage /></LazyRoute>} />
          <Route path="/notifications" element={<LazyRoute><NotificationsPage /></LazyRoute>} />

          {/* Requires auth */}
          <Route element={<ProtectedRoute />}>
            <Route path="/wallet" element={<LazyRoute><WalletPage /></LazyRoute>} />
          </Route>

          {/* 404 inside shell — user can escape */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

// ══════════════════════════════════════════════════════
// Toast config — light theme + RTL-aware border
// ══════════════════════════════════════════════════════
const TOAST_OPTIONS = {
  duration: 3000,
  style: {
    background: '#ffffff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow:
      '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.08)',
    fontSize: '14px',
    fontWeight: 500,
    padding: '12px 16px',
    // ✅ Logical property — automatically flips in RTL
    borderInlineStart: '4px solid #059669',
  },
  success: {
    iconTheme: { primary: '#059669', secondary: '#ffffff' },
    style: { borderInlineStart: '4px solid #059669' },
  },
  error: {
    iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
    style: { borderInlineStart: '4px solid #dc2626' },
  },
  loading: {
    iconTheme: { primary: '#059669', secondary: '#ffffff' },
  },
};

// ══════════════════════════════════════════════════════
// Root App — BrowserRouter is ALWAYS mounted
// Splash is a fixed overlay (z-[100] in SplashScreen itself)
// ══════════════════════════════════════════════════════
export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (window.location.search.includes('nosplash')) return false;
      return sessionStorage.getItem('agrimax_splash_seen') !== '1';
    } catch {
      // Incognito — skip splash (avoid showing on every reload)
      return false;
    }
  });

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('agrimax_splash_seen', '1');
    } catch {}
    setShowSplash(false);
  };

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
        <Toaster position="top-center" toastOptions={TOAST_OPTIONS} />

        {/* ✅ Splash as overlay — routes mount in background */}
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}