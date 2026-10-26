import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAppStore from '../store/useAppStore';

/**
 * useVoiceAction — Advanced Voice Command Executor.
 * Translates AI backend responses into React Router and DOM actions.
 * 
 * Features:
 * - Bilingual toast notifications (Urdu/English).
 * - React-safe form filling (native value setter).
 * - Smooth scrolling and element focus management.
 * - Robust error handling for invalid selectors.
 */
export function useVoiceAction() {
  const navigate = useNavigate();
  const { language } = useAppStore();

  /**
   * Utility: Native Value Setter for React-controlled inputs.
   * Directly setting .value doesn't trigger React's onChange.
   */
  const setNativeValue = (element, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else {
      valueSetter?.call(element, value);
    }
  };

  /**
   * Utility: Safely query DOM elements to prevent crashes.
   */
  const safeQuerySelector = (selector) => {
    try {
      return document.querySelector(selector);
    } catch (err) {
      console.warn(`[VoiceAction] Invalid CSS selector: ${selector}`, err);
      return null;
    }
  };

  /**
   * executeAction(result, intent)
   * 
   * @param {Object} [result] Data payload from AI backend (e.g., { action: "navigate", target: "/wallet", label: "Wallet" })
   * @param {string} [intent] Intent string (e.g., "NAVIGATE", "GO_BACK")
   * @returns {boolean} Whether an action was executed
   */
  const executeAction = useCallback(
    (result, intent) => {
      // Determine action type from result.action or fallback from intent
      let action = result?.action;
      if (!action && intent === 'GO_BACK') {
        action = 'back';
      }

      if (!action) return false;

      const isUrdu = language === 'ur';

      switch (action.toLowerCase()) {
        // ── Action 1: Navigation to a specific app route ──
        case 'navigate': {
          const target = result.target || '/';
          const label = result.label || target;

          toast.success(
            isUrdu ? `صفحہ تبدیل ہو رہا ہے: ${label}` : `Navigating to ${label}...`,
            { icon: '🧭', id: 'voice-nav-toast', duration: 2500 }
          );

          // Delay navigation slightly so the user can see the toast
          setTimeout(() => {
            navigate(target);
            // Scroll to top on new page
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 600);
          
          return true;
        }

        // ── Action 2: Go back to previous page in history ──
        case 'back': {
          toast.success(
            isUrdu ? 'پچھلے صفحے پر جا رہے ہیں...' : 'Going back...',
            { icon: '⬅️', id: 'voice-back-toast', duration: 2000 }
          );

          setTimeout(() => navigate(-1), 500);
          return true;
        }

        // ── Action 3: Programmatic click on DOM element ──
        case 'click': {
          if (!result.selector) return false;

          const element = safeQuerySelector(result.selector);
          if (element) {
            element.focus(); // Accessibility: Focus the element
            element.click();
            return true;
          } else {
            console.warn(`[VoiceAction] Element not found for click: ${result.selector}`);
          }
          return false;
        }

        // ── Action 4: Form input fill (React Safe) ──
        case 'fill': {
          if (!result.selector || result.value === undefined) return false;

          const element = safeQuerySelector(result.selector);
          if (element) {
            element.focus();
            
            // Use native setter for React-controlled components
            setNativeValue(element, result.value);

            // Dispatch events so other libraries/frameworks catch the change
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Optional: Briefly highlight the filled input
            element.classList.add('ring-2', 'ring-emerald-500', 'transition-all');
            setTimeout(() => element.classList.remove('ring-2', 'ring-emerald-500'), 1500);

            return true;
          } else {
            console.warn(`[VoiceAction] Element not found for fill: ${result.selector}`);
          }
          return false;
        }

        // ── Action 5: Smooth page scrolling ──
        case 'scroll': {
          const top = typeof result.top === 'number' ? result.top : 0;
          const selector = result.selector;

          if (selector) {
            const element = safeQuerySelector(selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.focus();
              return true;
            }
          } else {
            window.scrollTo({ top, behavior: 'smooth' });
            return true;
          }
          return false;
        }

        default:
          console.warn(`[VoiceAction] Unknown action: ${action}`);
          return false;
      }
    },
    [navigate, language]
  );

  return { executeAction };
}

export default useVoiceAction;