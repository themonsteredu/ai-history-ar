import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { joseonModels } from '../../lib/ar/joseon/catalog';
import { cssUrls, lessonFileUrls, lessonPhotoPaths, lessonScope, prepStatusText, prepTime, readPrepRecord } from './lessonPrep';

const origin = 'https://ai-history-ar.vercel.app';

describe('lesson files to keep on the tablet', () => {
  it('keeps same-site files only, once each, without the server API, the worker or page addresses', () => {
    const urls = lessonFileUrls([
      `${origin}/assets/index-abc.js`, '/assets/index-abc.js#x', 'assets/three-def.js', `${origin}/api/open-lesson/rooms/1234`,
      'https://storage.googleapis.com/tfjs/model.json', `${origin}/open-lesson-sw.js`, `${origin}/joseon/open-class?code=1234`,
      '/ar/joseon-science-targets.mind', '/fonts/SCDream4.otf', undefined, null, '', 'http://[bad',
    ], origin, '/');
    expect(urls).toEqual([
      `${origin}/ar/joseon-science-targets.mind`, `${origin}/assets/index-abc.js`, `${origin}/assets/three-def.js`, `${origin}/fonts/SCDream4.otf`,
    ]);
  });

  it('stays inside a sub-folder base', () => {
    expect(lessonFileUrls(['/ai-history-ar/assets/a.js', '/assets/b.js', '/ai-history-ar/api/x.json'], origin, '/ai-history-ar/')).toEqual([`${origin}/ai-history-ar/assets/a.js`]);
  });

  it('reads font addresses from @font-face rules', () => {
    expect(cssUrls('@font-face { font-family: "S-Core Dream"; src: url("/fonts/SCDream4.otf") format("opentype"), url(SCDream5.ttf); }', `${origin}/assets/index-x.css`))
      .toEqual([`${origin}/fonts/SCDream4.otf`, `${origin}/assets/SCDream5.ttf`]);
  });

  it('takes the model texture for students and adds the printed photo for the teacher', () => {
    const photos = [{ path: 'images/a.jpg' }, undefined, { path: 'images/b-full.jpg', texture: 'images/b.jpg' }];
    expect(lessonPhotoPaths(photos, 'student')).toEqual(['images/a.jpg', 'images/b.jpg']);
    expect(lessonPhotoPaths(photos, 'teacher')).toEqual(['images/a.jpg', 'images/a.jpg', 'images/b.jpg', 'images/b-full.jpg']);
  });

  it('covers the six artifact photos, which exist in public/', () => {
    const paths = lessonPhotoPaths(joseonModels.map(info => info.photo), 'student');
    expect(paths).toHaveLength(6);
    for (const path of paths) expect(readFileSync(new URL(`../../../public/${path}`, import.meta.url)).length).toBeGreaterThan(0);
  });

  it('gives each lesson page its own worker scope', () => {
    expect(lessonScope('student', '/')).toBe('/joseon/open-class');
    expect(lessonScope('teacher', '/')).toBe('/teacher/joseon/open-class');
  });
});

describe('what the button says', () => {
  const now = new Date(2026, 9, 19, 15, 0);
  it('shows progress, then the time it was ready', () => {
    expect(prepStatusText({ kind: 'working', done: 0, total: 0 })).toBe('준비 중…');
    expect(prepStatusText({ kind: 'working', done: 7, total: 12 })).toBe('준비 중… 7/12');
    expect(prepStatusText({ kind: 'done', at: new Date(2026, 9, 19, 14, 5) }, now)).toBe('준비 완료 · 오후 2:05 · 인터넷이 느려도 화면과 3D·AR이 열려요');
  });

  it('adds the date when it was prepared on another day', () => {
    expect(prepTime(new Date(2026, 9, 18, 9, 30), now)).toBe('10월 18일 오전 9:30');
  });

  it('explains problems calmly', () => {
    expect(prepStatusText({ kind: 'error', reason: 'partial', missing: 3 })).toContain('파일 3개를 받지 못했어요');
    expect(prepStatusText({ kind: 'error', reason: 'offline' })).toContain('인터넷이 안 돼요');
    expect(prepStatusText({ kind: 'error', reason: 'full' })).toContain('저장 공간');
    expect(prepStatusText({ kind: 'stale' })).toContain('한 번 더 눌러');
    expect(prepStatusText({ kind: 'error', reason: 'outdated' })).toContain('새로 고친 뒤');
    expect(prepStatusText({ kind: 'idle' })).toContain('수업 전에 한 번');
  });

  it('reads only a well-formed saved record', () => {
    expect(readPrepRecord(JSON.stringify({ at: '2026-10-19T05:05:00.000Z', build: '/assets/index-abc.js' }))).toEqual({ at: '2026-10-19T05:05:00.000Z', build: '/assets/index-abc.js' });
    expect(readPrepRecord(null)).toBeUndefined();
    expect(readPrepRecord('{bad')).toBeUndefined();
    expect(readPrepRecord(JSON.stringify({ at: 'yesterday', build: '' }))).toBeUndefined();
  });
});
