/** Copies inside the tap itself so the copy still works when Gemini opens in a new tab right after. */
export function copyText(value: string): boolean {
  let copied = false;
  try {
    const area = document.createElement('textarea');
    area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select(); area.setSelectionRange(0, value.length);
    copied = document.execCommand('copy');
    area.remove();
  } catch { copied = false; }
  try { void navigator.clipboard?.writeText(value).catch(() => undefined); copied = copied || !!navigator.clipboard; } catch { /* the textarea copy above is the fallback */ }
  return copied;
}
