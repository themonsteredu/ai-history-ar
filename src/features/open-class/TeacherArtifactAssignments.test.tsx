import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeacherArtifactAssignments } from './TeacherArtifactAssignments';
import { newCard } from './model';

describe.each(['goryeo', 'joseon'] as const)('%s teacher artifact allocation', era => {
  it('locks an existing artifact without exposing an assignment control for that group', () => {
    const card = newCard(1, 1);
    card.members = '오늘 작업한 학생들';
    card.points = [{ id: 'point', position: [0, 0, 0], title: '오늘 설명', text: '그대로 보존할 내용' }];
    const before = JSON.stringify(card);
    const html = renderToStaticMarkup(<TeacherArtifactAssignments era={era} code="5252" groupCount={2} loaded cards={[{ key: '1', version: 9, data: card, updatedAt: '' }]} sessionToken="token" onRefresh={vi.fn()} />);
    expect(html).toContain('배정 유지 · 변경 불가');
    expect(html).not.toContain('1모둠 배정할 유물');
    expect(html).not.toContain('1모둠 배정 저장');
    expect(html).toContain('2모둠 배정할 유물');
    expect(JSON.stringify(card)).toBe(before);
  });
  it('waits for shared records before offering any assignments', () => {
    const html = renderToStaticMarkup(<TeacherArtifactAssignments era={era} code="5252" groupCount={6} loaded={false} cards={[]} sessionToken="token" onRefresh={vi.fn()} />);
    expect(html).toContain('기존 모둠 기록을 확인하는 중');
    expect(html).not.toContain('<select');
    expect(html).not.toContain('배정 저장');
  });
});
