import type { ReactNode } from 'react';

/** A photo credit: a link to the photo's page or licence when there is one, plain text when the teacher supplied the photo without one. */
export function PhotoRef({ href, children }: { href?: string; children: ReactNode }) {
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <>{children}</>;
}
