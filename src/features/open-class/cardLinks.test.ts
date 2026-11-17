import { describe, expect, it } from 'vitest';
import { openClassUrl, printedGroupCardUrl, readPrintedCardLink } from './cardLinks';

describe('printed Joseon group card links', () => {
  it('opens the same group on old printouts and pins new printouts to the matching artifact', () => {
    const artifactIds = [1, 2, 4, 5, 6, 3];
    for (const [index, artifactId] of artifactIds.entries()) {
      const group = index + 1;
      const legacy = new URL(openClassUrl('5252') + `&view=look&group=${group}`);
      expect(readPrintedCardLink(legacy.searchParams)).toEqual({ code: '5252', group });
      const current = new URL(printedGroupCardUrl('5252', { group, artifactId }));
      expect(current.pathname).toBe('/joseon/open-class');
      expect(readPrintedCardLink(current.searchParams)).toEqual({ code: '5252', group, artifactId });
    }
  });

  it('keeps the normal class entry and the student presentation tab separate from QR links', () => {
    for (const search of ['code=5252', 'code=5252&view=look', 'code=5252&view=make&group=3']) {
      expect(readPrintedCardLink(new URLSearchParams(search))).toBeUndefined();
    }
    for (const search of ['code=5252&view=card&group=3', 'code=5252&view=look&group=7', 'view=look&group=3']) {
      expect(readPrintedCardLink(new URLSearchParams(search))).toBe('invalid');
    }
  });
});
