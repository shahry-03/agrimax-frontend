import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const IS_DEV = import.meta.env.DEV;
// ✅ Feature flag: web-vitals only included if installed
const VITALS_ENABLED = import.meta.env.VITE_ENABLE_VITALS === 'true';

// ══════════════════════════════════════════════════════
// Root mount — clear error if #root missing
// ══════════════════════════════════════════════════════
const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;padding:24px;text-align:center;">
      <div>
        <h1 style="color:#dc2626;margin-bottom:12px;font-size:24px;font-weight:800;">⚠️ Mount Error</h1>
        <p style="color:#64748b;max-width:420px;line-height:1.5;">
          Root element <code>#root</code> was not found. Ensure <code>&lt;div id="root"&gt;&lt;/div&gt;</code> exists in index.html.
        </p>
      </div>
    </div>
  `;
  throw new Error('[AgriMax] Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ══════════════════════════════════════════════════════
// Global error handlers (production only)
// ══════════════════════════════════════════════════════
if (!IS_DEV && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Suppress benign ResizeObserver warnings (they spam production logs)
    if (event.message?.includes('ResizeObserver loop')) return;
    // TODO: Sentry.captureException(event.error)
    console.error('[Global Error]', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    // TODO: Sentry.captureException(event.reason)
    console.error('[Unhandled Rejection]', event.reason);
  });
}

// ══════════════════════════════════════════════════════
// Web Vitals (opt-in via env flag)
// Requires: npm install web-vitals
// Enable with: VITE_ENABLE_VITALS=true in .env.production
// ══════════════════════════════════════════════════════
if (!IS_DEV && VITALS_ENABLED && typeof window !== 'undefined') {
  import('web-vitals')
    .then((vitals) => {
      const sendMetric = (metric) => {
        const body = JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          url: window.location.pathname,
        });

        // Try sendBeacon first (survives page unload)
        let sent = false;
        try {
          sent = navigator.sendBeacon?.('/api/v1/analytics/vitals', body) ?? false;
        } catch {
          sent = false;
        }

        // Fallback: fetch with keepalive (survives unload in modern browsers)
        if (!sent) {
          fetch('/api/v1/analytics/vitals', {
            method: 'POST',
            body,
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {});
        }
      };

      // Core Web Vitals (guard against older web-vitals versions)
      vitals.onCLS?.(sendMetric);
      vitals.onLCP?.(sendMetric);
      vitals.onINP?.(sendMetric);   // v3+; absent in older versions
      vitals.onFCP?.(sendMetric);
      vitals.onTTFB?.(sendMetric);
    })
    .catch((err) => {
      // Package not installed OR blocked by CSP
      if (IS_DEV) {
        console.warn('[Vitals] Skipped:', err?.message);
      }
    });
}

// ══════════════════════════════════════════════════════
// Service Worker registration (PWA)
// Dispatches `agrimax:sw-updated` — MUST have a listener
// (see App.jsx example below)
// ══════════════════════════════════════════════════════
if (!IS_DEV && 'serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Hourly update check
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Clean up interval on page unload (prevents memory leak)
        window.addEventListener('beforeunload', () => clearInterval(updateInterval), { once: true });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Notify app — App.jsx shows "Update available" toast
              window.dispatchEvent(new CustomEvent('agrimax:sw-updated'));
            }
          });
        });
      })
      .catch((err) => {
        if (IS_DEV) console.warn('[SW] Registration failed:', err?.message);
      });
  });
}