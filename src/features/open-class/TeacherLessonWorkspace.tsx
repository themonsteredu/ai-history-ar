import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OpenState } from './api';
import { GROUP_CHOICES } from '../ar-studio/teacherRun';
import { TeacherArPresentation } from './TeacherArPresentation';
import { TeacherGroupDashboard, TeacherQuizStatus } from './TeacherGroupDashboard';
import { Presentation } from './Presentation';
import { usePresentationDialog } from './usePresentationDialog';
import { teacherWorkspaceGroups, type TeacherEra, type TeacherGroup } from './teacherWorkspaceGroups';
import { TeacherArtifactAssignments } from './TeacherArtifactAssignments';
import './teacher-workspace.css';

const menus = [
  { id: 'ar', label: 'AR 카드 발표' },
  { id: 'quiz', label: 'OX 문제 발표' },
  { id: 'progress', label: '현재 모둠별 진행 상황' },
] as const;
type View = typeof menus[number]['id'];
type Props = {
  era: TeacherEra; code: string; groupCount: number; state: OpenState; sessionToken?: string;
  updatedAt?: number; error: string; onGroupCount: (count: number) => void; onRefresh: () => Promise<unknown>;
};

export function TeacherLessonWorkspace({ era, code, groupCount, state, sessionToken, updatedAt, error, onGroupCount, onRefresh }: Props) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('teacher_view');
  const view: View = requested === 'quiz' || requested === 'progress' ? requested : 'ar';
  const [detail, setDetail] = useState<number>();
  const [quizReview, setQuizReview] = useState<number>();
  const [presentation, setPresentation] = useState<{ kind: 'ar' | 'quiz'; group: number }>();
  const [refreshing, setRefreshing] = useState(false);
  const groups = teacherWorkspaceGroups(era, groupCount, state);
  const selected = groups.find(item => item.group === detail);
  const reviewing = groups.find(item => item.group === quizReview);
  const presenting = groups.find(item => item.group === presentation?.group);
  function selectView(next: View) {
    const search = new URLSearchParams(params);
    search.set('teacher_view', next);
    setParams(search, { replace: true });
    setDetail(undefined);
    setQuizReview(undefined);
    setPresentation(undefined);
  }
  async function refresh() { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } }
  const ready = groups.filter(group => view === 'ar' ? group.canPresentCard : group.canPresentQuiz).length;

  return <section className="teacher-workspace" aria-label="수업 진행">
    <TeacherArtifactAssignments key={`${era}:${code}`} era={era} code={code} groupCount={groupCount} cards={state.cards} sessionToken={sessionToken} loaded={!!updatedAt && !error} onRefresh={onRefresh} />
    <nav className="teacher-workspace__menus" aria-label="수업 진행 메뉴">
      {menus.map(menu => <button key={menu.id} type="button" aria-pressed={view === menu.id} onClick={() => selectView(menu.id)}>{menu.label}</button>)}
    </nav>
    <div className="teacher-workspace__status">
      <p role="status">{error ? `연결 확인 필요 · ${error}${updatedAt ? ' · 마지막으로 받은 기록입니다.' : ''}` : updatedAt ? `2초마다 새로 확인 · ${new Date(updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : '수업 기록을 불러오는 중…'}</p>
      <button type="button" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? '확인 중…' : '새로고침'}</button>
    </div>

    {view === 'quiz' && reviewing ? <TeacherSavedQuiz group={reviewing} onBack={() => setQuizReview(undefined)} /> : view !== 'progress' ? <section className="teacher-workspace__content" aria-label={view === 'ar' ? 'AR 카드 발표 모둠 선택' : 'OX 문제 발표 모둠 선택'}>
      <header className="teacher-workspace__heading"><div><h2>{view === 'ar' ? '발표할 AR 카드를 선택하세요' : '발표할 모둠을 선택하세요'}</h2><p>{view === 'ar' ? '모둠의 유물과 설명을 크게 보여 줍니다.' : '문장이 저장되면 빈칸이 있어도 한 문제씩 발표할 수 있습니다.'}</p></div><span>{updatedAt ? `${ready} / ${groupCount}모둠 발표 가능` : '기록 확인 중'}</span></header>
      <div className="teacher-workspace__gallery">{groups.map(group => {
        const enabled = !!updatedAt && (view === 'ar' ? group.canPresentCard : group.canPresentQuiz);
        return <article className="teacher-workspace__group" key={group.group}>
          <GroupPhoto group={group} />
          <div className="teacher-workspace__group-body"><p className="teacher-workspace__group-number">{group.group}모둠</p><h3>{group.artifact?.name || (updatedAt ? '유물 선택 전' : '기록 확인 중')}</h3>
            <p>{!updatedAt ? '기록 확인 중' : view === 'ar' ? `${group.cardLabel} · 설명 ${group.card?.points.length || 0}개` : group.canPresentQuiz ? `발표 가능 ${group.questions.length}문제` : `발표 가능 ${group.questions.length} / 2문제`}</p>
            {view === 'quiz' && <>
              <p>{group.checkItem ? `서버 저장 확인 · ${new Date(group.checkItem.updatedAt).toLocaleTimeString('ko-KR')} · 저장 번호 ${group.checkItem.version}` : '저장된 OX 내용 없음'}</p>
              <button type="button" disabled={!updatedAt || !group.checkItem} onClick={() => setQuizReview(group.group)} aria-label={`${group.group}모둠 저장된 OX 내용 확인`}>저장된 OX 내용 확인</button>
            </>}
            <button type="button" disabled={!enabled} onClick={() => setPresentation({ kind: view, group: group.group })} aria-label={`${group.group}모둠 ${view === 'ar' ? 'AR 카드' : 'OX 문제'} 발표`}>{view === 'ar' ? 'AR 카드 발표' : 'OX 문제 발표'}</button>
          </div>
        </article>;
      })}</div>
    </section> : <section className="teacher-workspace__content" aria-label="현재 모둠별 진행 상황">
      <header className="teacher-workspace__heading"><h2>현재 모둠별 진행 상황</h2><label className="oc-inline">모둠 수<select value={groupCount} onChange={event => { onGroupCount(Number(event.target.value)); setDetail(undefined); }}>{GROUP_CHOICES.map(count => <option key={count} value={count}>{count}모둠</option>)}</select></label></header>
      {!updatedAt ? <p className="oc-empty">{error ? '수업 기록을 불러오지 못했어요.' : '모둠 기록을 불러오는 중…'}</p> : selected ? <TeacherGroupDashboard key={selected.group} reviewOnly group={selected.group} era={era} cardItem={selected.cardItem} checkItem={selected.checkItem} onBack={() => setDetail(undefined)} onCardPresentation={() => selectView('ar')} onQuizPresentation={() => selectView('quiz')} /> : <>
        <div className="teacher-workspace__table-wrap"><table className="teacher-workspace__table"><thead><tr><th scope="col">모둠·유물</th><th scope="col">AR 카드</th><th scope="col">OX 문제 작성</th><th scope="col">자료 검증</th><th scope="col">확인</th></tr></thead><tbody>{groups.map(group => <tr key={group.group}>
          <th scope="row"><b>{group.group}모둠</b><span>{group.artifact?.name || '유물 선택 전'}</span></th>
          <td>{group.cardLabel}<small>설명 {group.card?.points.length || 0}개</small></td>
          <td>{group.quiz.written} / 2문제<small>{group.quiz.label}</small></td>
          <td>{group.quiz.verified} / 2문제<small>{group.canPresentQuiz ? '발표 준비 완료' : `발표 가능 ${group.questions.length}문제`}</small></td>
          <td><button type="button" aria-label={`${group.group}모둠 진행 내용 확인`} onClick={() => setDetail(group.group)}>내용 확인</button></td>
        </tr>)}</tbody></table></div>
      </>}
    </section>}

    {presentation?.kind === 'ar' && presenting?.canPresentCard && <TeacherArPresentation era={era} code={code} groupCount={groupCount} cards={groups.flatMap(group => group.card ? [group.card] : [])} updatedAt={updatedAt} error={error} initialGroup={presentation.group} onClose={() => setPresentation(undefined)} />}
    {presentation?.kind === 'quiz' && presenting && <TeacherQuizPresentation key={presenting.group} era={era} group={presenting} onClose={() => setPresentation(undefined)} />}
  </section>;
}

function GroupPhoto({ group }: { group: TeacherGroup }) {
  return <figure className="teacher-workspace__photo">{group.photoPath ? <img src={`${import.meta.env.BASE_URL}${group.photoPath}`} alt={group.artifact?.name || '유물'} loading="lazy" /> : <span>{String(group.group).padStart(2, '0')}</span>}
    {group.photo && <figcaption><a href={group.photo.source} target="_blank" rel="noopener noreferrer">{group.photo.author}</a> · <a href={group.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{group.photo.license}</a></figcaption>}
  </figure>;
}

export function TeacherQuizPresentation({ era, group, onClose }: { era: TeacherEra; group: TeacherGroup; onClose: () => void }) {
  const root = usePresentationDialog(onClose);
  return <section ref={root} className="oc-present-modal teacher-workspace__quiz" role="dialog" aria-modal="true" aria-label={`${group.group}모둠 OX 문제 발표`}>
    <header className="oc-present-modal-bar"><b>{group.group}모둠 · OX 문제 발표</b><button type="button" data-autofocus onClick={onClose}>← OX 발표 모둠 목록</button></header>
    <Presentation big allowIncomplete era={era} artifactName={group.artifact?.name} card={group.card} check={group.check} questions={group.questions} />
  </section>;
}

/** Takes the current polled group, never a snapshot captured when the review was opened. */
export function TeacherSavedQuiz({ group, onBack }: { group: TeacherGroup; onBack: () => void }) {
  return <section className="teacher-workspace__content" aria-label={`${group.group}모둠 저장된 OX 내용`}>
    <button type="button" onClick={onBack}>← OX 모둠 목록</button>
    <h2>{group.group}모둠 · 저장된 OX 내용</h2>
    <p>{group.canPresentQuiz ? '발표 준비 완료' : '문제가 저장되면 발표할 수 있습니다.'}</p>
    <TeacherQuizStatus check={group.check} updatedAt={group.checkItem?.updatedAt} />
  </section>;
}
