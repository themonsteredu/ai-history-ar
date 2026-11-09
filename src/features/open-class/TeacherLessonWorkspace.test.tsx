import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { TeacherLessonWorkspace, TeacherQuizPresentation } from './TeacherLessonWorkspace';
import { teacherWorkspaceGroups, type TeacherEra } from './teacherWorkspaceGroups';
import { TeacherGroupDashboard } from './TeacherGroupDashboard';
import { newCard, newPoint, newSelfVerification, newVerifyItem } from './model';
import type { OpenState } from './api';

function fixture(): OpenState {
  const card = newCard(1, 3);
  card.points = [{ ...newPoint([0, 0, 0]), title: '유물의 쓰임', text: '학생이 쓴 카드 설명' }];
  const check = newSelfVerification(1);
  check.selfQuestions!.forEach((question, index) => { question.statement = `발표용 문장 ${index + 1}`; question.answer = 'X'; question.explanation = ''; });
  check.items = check.selfQuestions!.map(question => ({ ...newVerifyItem(question.id, 'student'), solved: 'O', why: '역사신문', decision: 'adopt', reason: '자료에서 확인했어요' }));
  return { cards: [{ key: '1', version: 1, data: card, updatedAt: '' }], checks: [{ key: '1:1', version: 1, data: check, updatedAt: '' }], teacher: [] };
}
function render(era: TeacherEra, view: string, state = fixture(), updatedAt: number | undefined = 1) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[`/teacher/${era}/open-class?code=5252&teacher_view=${view}`]}><TeacherLessonWorkspace era={era} code="5252" groupCount={2} state={state} updatedAt={updatedAt} error="" onGroupCount={vi.fn()} onRefresh={vi.fn()} /></MemoryRouter>);
}

describe.each(['goryeo', 'joseon'] as const)('%s teacher menus', era => {
  it('separates AR presentation, quiz presentation and live progress without exposing answers in the chooser', () => {
    for (const view of ['ar', 'quiz', 'progress']) {
      const html = render(era, view);
      expect(html).toContain('수업 진행 메뉴');
      expect(html).toContain('현재 모둠별 진행 상황');
      expect(html).not.toContain('전체 모둠 내용 보기');
      expect(html).not.toContain('역사박물관 칠판 화면');
      expect(html).not.toContain('발표용 문장');
      expect(html).not.toContain('AI의 답 X');
      if (view === 'ar') expect(html).toContain('aria-label="1모둠 AR 카드 발표"');
      if (view === 'quiz') expect(html).toContain('aria-label="1모둠 OX 문제 발표"');
      if (view === 'progress') expect(html).toContain('aria-label="2모둠 진행 내용 확인"');
    }
  });
  it('opens the quiz itself with one question and hidden answers, without a teacher-review detour', () => {
    const group = teacherWorkspaceGroups(era, 2, fixture())[0];
    expect(group.canPresentQuiz).toBe(true);
    const html = renderToStaticMarkup(<TeacherQuizPresentation era={era} group={group} onClose={vi.fn()} />);
    expect(html).toContain('발표용 문장 1');
    expect(html).not.toContain('발표용 문장 2');
    expect(html).toContain('AI 정답 보기');
    expect(html).not.toContain('AI의 답 X');
    expect(html).not.toContain('검증 과정 보기');
    expect(html).toContain('OX 발표 모둠 목록');
  });
});

it('distinguishes completed verification from presentation readiness and never uses another group’s check', () => {
  const state = fixture();
  state.checks[0].data.items[1].decision = 'exclude';
  const [first, second] = teacherWorkspaceGroups('goryeo', 2, state);
  expect(first.quiz.verified).toBe(2);
  expect(first.questions).toHaveLength(1);
  expect(first.canPresentQuiz).toBe(false);
  expect(second.check).toBeUndefined();
  expect(second.canPresentQuiz).toBe(false);
});

it('keeps partially written work available for inspection in progress mode', () => {
  const state = fixture();
  state.checks[0].data.items = [];
  const group = teacherWorkspaceGroups('goryeo', 2, state)[0];
  expect(group.quiz.written).toBe(2);
  expect(group.canPresentQuiz).toBe(false);
  const html = renderToStaticMarkup(<TeacherGroupDashboard reviewOnly group={1} era="goryeo" cardItem={group.cardItem} checkItem={group.checkItem} onBack={vi.fn()} onCardPresentation={vi.fn()} onQuizPresentation={vi.fn()} />);
  expect(html).toContain('학생이 쓴 카드 설명');
  expect(html).toContain('OX 퀴즈 작성 현황');
  expect(html).not.toContain('AR 카드 발표');
  expect(html).not.toContain('OX 퀴즈 발표');
});

it('does not claim waiting groups are unfinished before the first response arrives', () => {
  const html = render('goryeo', 'progress', { cards: [], checks: [], teacher: [] }, 0);
  expect(html).toContain('모둠 기록을 불러오는 중');
  expect(html).not.toContain('진행 내용 확인');
});
