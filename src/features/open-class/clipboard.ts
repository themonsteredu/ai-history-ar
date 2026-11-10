function copyInDocument(value: string): boolean {
  let area: HTMLTextAreaElement | undefined;
  try {
    area = document.createElement('textarea');
    area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select(); area.setSelectionRange(0, value.length);
    return document.execCommand('copy');
  } catch { return false; }
  finally { area?.remove(); }
}

/** Copies inside the tap itself so the copy still works when Gemini opens in a new tab right after. */
export function copyText(value: string): boolean {
  let copied = copyInDocument(value);
  try { void navigator.clipboard?.writeText(value).catch(() => undefined); copied = copied || !!navigator.clipboard; } catch { /* the textarea copy above is the fallback */ }
  return copied;
}

/** Do not report success just because the clipboard API exists: it can still reject the request. */
export async function copyTextConfirmed(value: string): Promise<boolean> {
  if (copyInDocument(value)) return true;
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(value);
    return true;
  } catch { return false; }
}
