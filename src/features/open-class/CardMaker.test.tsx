import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CardMaker } from './CardMaker';
import { newCard } from './model';

vi.mock('./ArCard', () => ({ ArCard: () => <div>입체 모형</div>, LessonCamera: () => null }));
vi.mock('./HeritageReading', () => ({ HeritageReading: () => null }));

function fixture(artifactId = 1) {
  const data = newCard(1, artifactId);
  data.points = [{ id: 'today', position: [0, 0, 0], title: '오늘 설명', text: '아이들이 작성한 내용' }];
  data.questions[0].statement = '오늘 작성한 문제';
  return { data, dirty: false, version: 4, state: 'saved' as const, message: '', savedAt: '', update: vi.fn(), saveNow: vi.fn(), takeServer: vi.fn(), keepMine: vi.fn(), prepareReentry: vi.fn() };
}

describe.each(['goryeo', 'joseon'] as const)('%s student artifact protection', era => {
  it('shows existing explanations and removes the artifact switching path without altering the draft', () => {
    const draft = fixture();
    const before = JSON.stringify(draft.data);
    const html = renderToStaticMarkup(<CardMaker era={era} draft={draft} assignedArtifactId={1} />);
    expect(html).toContain('유물은 학생이 바꿀 수 없어요');
    expect(html).toContain('아이들이 작성한 내용');
    expect(html).not.toContain('유물 고르기');
    expect(html).not.toContain('oc-artifacts');
    expect(JSON.stringify(draft.data)).toBe(before);
    expect(draft.update).not.toHaveBeenCalled();
    expect(draft.saveNow).not.toHaveBeenCalled();
  });
  it('waits for the teacher instead of allowing a local artifact to be saved', () => {
    const draft = fixture();
    const html = renderToStaticMarkup(<CardMaker era={era} draft={draft} assignedArtifactId={0} />);
    expect(html).toContain('선생님이 우리 모둠 유물을 배정하면');
    expect(html).not.toContain('입체 모형');
    expect(html).toContain('disabled="">지금 우리 반에 저장');
    expect(draft.update).not.toHaveBeenCalled();
  });
  it('blocks a mismatched old local artifact and offers loading the preserved shared card', () => {
    const draft = { ...fixture(), state: 'conflict' as const, dirty: true };
    const before = JSON.stringify(draft.data);
    const html = renderToStaticMarkup(<CardMaker era={era} draft={draft} assignedArtifactId={2} />);
    expect(html).toContain('모둠 저장본 불러오기');
    expect(html).not.toContain('내 내용으로 덮어쓰기');
    expect(html).not.toContain('입체 모형');
    expect(JSON.stringify(draft.data)).toBe(before);
  });
});
