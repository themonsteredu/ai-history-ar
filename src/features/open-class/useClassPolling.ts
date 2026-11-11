import { useEffect } from 'react';

export const CLASS_POLL_INTERVAL = 2000;
/** Poll visible screens; returning from Gemini or restoring Wi-Fi refreshes immediately. */
export function startClassPolling(refresh: () => Promise<unknown>) {
  const tick = () => { if (document.visibilityState !== 'hidden') void refresh(); };
  tick();
  const timer = window.setInterval(tick, CLASS_POLL_INTERVAL);
  window.addEventListener('online', tick);
  window.addEventListener('focus', tick);
  document.addEventListener('visibilitychange', tick);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('online', tick);
    window.removeEventListener('focus', tick);
    document.removeEventListener('visibilitychange', tick);
  };
}
export function useClassPolling(refresh: () => Promise<unknown>) {
  useEffect(() => startClassPolling(refresh), [refresh]);
}
