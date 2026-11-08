import { useEffect, useRef } from 'react';

export function usePresentationDialog(onClose: () => void) {
  const root = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!root.current) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') || [])
      .filter(element => element.getClientRects().length > 0);
    (root.current?.querySelector<HTMLElement>('[data-autofocus]') || focusable()[0])?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0]; const last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !root.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return root;
}
