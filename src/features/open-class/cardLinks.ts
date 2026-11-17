import type { GroupCard } from './model';

const SITE = 'https://ai-history-ar.vercel.app';

export function openClassUrl(code: string) {
  return `${SITE}/joseon/open-class?code=${encodeURIComponent(code)}`;
}

export function printedGroupCardUrl(code: string, card: Pick<GroupCard, 'group' | 'artifactId'>) {
  return `${openClassUrl(code)}&view=card&group=${card.group}&artifact=${card.artifactId}`;
}

export interface PrintedCardTarget { code: string; group: number; artifactId?: number }

export function readPrintedCardLink(params: URLSearchParams): PrintedCardTarget | 'invalid' | undefined {
  const view = params.get('view');
  // The cards already printed for this lesson used view=look with a group number.
  if (view !== 'card' && !(view === 'look' && params.has('group'))) return;
  const code = (params.get('code') || params.get('hub_code') || '').trim().toLowerCase();
  const group = params.get('group') ?? '';
  const artifact = params.get('artifact');
  if (!/^[a-z0-9]{4,12}$/.test(code) || !/^[1-6]$/.test(group) ||
    (view === 'card' && artifact === null) || (artifact !== null && !/^[1-6]$/.test(artifact))) return 'invalid';
  return { code, group: Number(group), artifactId: artifact === null ? undefined : Number(artifact) };
}
