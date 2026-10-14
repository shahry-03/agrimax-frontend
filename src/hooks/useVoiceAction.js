import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * useVoiceAction — Executes client-side website control actions returned by
 * the AgriMax AI backend (e.g. navigation, back button, UI clicks, scrolling).
 *
 * This hook is the bridge between natural language voice commands and React Router / DOM actions.
 */
export function useVoiceAction() {
  const navigate = useNavigate();

  /**
   * executeAction(result, intent)
   *
   * Core logic:
   * 1. Inspects `result` object returned by backend handler (e.g. NavigateHandler).
   * 2. Inspects `intent` as fallback (e.g. GO_BACK intent without separate handler data).
   * 3. Executes the corresponding browser or router action:
   *    - "navigate": navigates to target path with user toast notification
   *    - "back": navigates back 1 step in browser history
   *    - "click": clicks on specified DOM element selector
   *    - "fill": fills value in specified input selector and dispatches input/change events
   *    - "scroll": scrolls window to top or specified position
   * 4. Returns `true` if an action was recognized and executed, `false` otherwise.
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

      if (!action) {
        return false;
      }

      switch (action.toLowerCase()) {
        // ── Action 1: Navigation to a specific app route ──
        case 'navigate': {
          const target = result.target || '/';
          const label = result.label || target;

          // Display a friendly toast notification to inform user of automatic voice navigation
          toast.success(`Navigating to ${label}...`, {
            icon: '🧭',
            id: 'voice-nav-toast',
            duration: 2500,
          });

          navigate(target);
          return true;
        }

        // ── Action 2: Go back to previous page in history ──
        case 'back': {
          toast.success('Going back...', {
            icon: '⬅️',
            id: 'voice-back-toast',
            duration: 2500,
          });

          navigate(-1);
          return true;
        }

        // ── Action 3: Programmatic click on DOM element ──
        case 'click': {
          if (result.selector) {
            try {
              const element = document.querySelector(result.selector);
              if (element) {
                element.click();
                return true;
              }
            } catch (err) {
              console.warn('Voice action click error:', err);
            }
          }
          return false;
        }

        // ── Action 4: Form input fill ──
        case 'fill': {
          if (result.selector && result.value !== undefined) {
            try {
              const element = document.querySelector(result.selector);
              if (element) {
                element.value = result.value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            } catch (err) {
              console.warn('Voice action fill error:', err);
            }
          }
          return false;
        }

        // ── Action 5: Smooth page scrolling ──
        case 'scroll': {
          const top = typeof result.top === 'number' ? result.top : 0;
          window.scrollTo({ top, behavior: 'smooth' });
          return true;
        }

        default:
          return false;
      }
    },
    [navigate]
  );

  return { executeAction };
}

export default useVoiceAction;
