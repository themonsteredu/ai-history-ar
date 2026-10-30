import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearTeacherAccess, grantTeacherAccess } from '../auth/teacherAccess';
import { AppShell } from './AppShell';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

function renderNavigation(storage: ReturnType<typeof createStorage>, path = '/classes') {
  vi.stubGlobal('window', { sessionStorage: storage });
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={<AppShell />}><Route path="*" element={<span>본문</span>} /></Route></Routes>
    </MemoryRouter>,
  );
  return html.match(/<nav aria-label="주요 메뉴"[\s\S]*?<\/nav>/)?.[0] ?? '';
}

afterEach(() => vi.unstubAllGlobals());

describe('상단 수업 메뉴', () => {
  it('학생에게 수업과 설정만 보여 주고 수업은 선택 화면으로 연결한다', () => {
    const nav = renderNavigation(createStorage());
    expect(nav).toContain('href="/classes"');
    expect(nav).toMatch(/>수업<\/a>/);
    expect(nav).toContain('href="/teacher"');
    expect(nav).not.toContain('공개수업');
    for (const label of ['과정 선택', '삼국시대', '고려유물수업', '조선시대', 'AR 만들기']) expect(nav).not.toContain(label);
  });

  it('교사 확인 후 기존 메뉴의 주소를 유지하고 잠그면 다시 감춘다', () => {
    const storage = createStorage();
    grantTeacherAccess(storage);
    const nav = renderNavigation(storage, '/classes?hub_code=CLASS');
    expect(nav).toContain('href="/classes"');
    expect(nav).toContain('href="/teacher"');
    for (const path of ['/', '/three-kingdoms', '/goryeo', '/joseon']) expect(nav).toContain(`href="${path}"`);
    expect(nav).toContain('href="/three-kingdoms/ar-maker?hub_code=CLASS"');
    for (const label of ['과정 선택', '삼국시대', '고려유물수업', '조선시대', 'AR 만들기']) expect(nav).toContain(label);
    clearTeacherAccess(storage);
    expect(renderNavigation(storage)).not.toContain('AR 만들기');
  });
});
