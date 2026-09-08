import { useState } from 'react';
import type { EraId } from '../types/curriculum';
import { researchForEra } from '../content/heritageCatalog';
import { evidenceCategories, recordProblems, type HeritageProject, type ResearchRecord } from '../content/three-kingdoms/project';
import { lessonFourSample } from '../content/lessonFourSamples';

export const categoryNames = { '시기·발견': '언제·어디', '재료·구조': '재료·만드는 방법', '모양·장면': '생김새', '사용·생활': '쓰임·생활' } as const;

type Props = {
  eraId: EraId; lessonId: 4 | 5; project: HeritageProject; message: string;
  onUpdate: (patch: Partial<HeritageProject>) => void;
  onRecords: (records: ResearchRecord[]) => void;
  onHeritage: (id: number) => void;
  onSave: () => void;
  onImport: (file?: File) => void;
  onContinue: () => Promise<void>;
};

export function SimpleTableLesson({ eraId, lessonId, project, message, onUpdate, onRecords, onHeritage, onSave, onImport, onContinue }: Props) {
  const [moving, setMoving] = useState(false);
  const heritage = researchForEra(eraId).find(item => item.id === project.heritageId)!;
  const sample = lessonFourSample(eraId, project.heritageId);
  const clues: ResearchRecord[] = project.tableMaterial
    ? project.tableMaterial.clues.map((text, index) => ({ id: `teacher-${index}`, text, category: '', status: '확인됨', source: '선생님 자료', url: '', providedByTeacher: true }))
    : heritage.sources.flatMap(source => source.facts.filter(fact => fact.kind === 'confirmed').map(fact => ({ id: fact.id, text: fact.text, category: '' as const, status: '확인됨' as const, source: source.institution, url: source.href })));
  const topic = project.tableMaterial?.topic || heritage.heritage;
  const [teacherTopic, setTeacherTopic] = useState(topic);
  const [teacherClues, setTeacherClues] = useState(clues.map(clue => clue.text).join('\n'));
  const [materialError, setMaterialError] = useState('');
  const ready = project.records.length > 0 && recordProblems(project.records).length === 0;

  function addRow() {
    if (project.records.length >= 60) return;
    onRecords([...project.records, { id: crypto.randomUUID(), text: '', category: '', status: '확인됨', source: '선생님 자료', url: '', providedByTeacher: true }]);
  }
  function changeRecord(id: string, patch: Partial<ResearchRecord>) {
    onRecords(project.records.map(record => record.id === id ? { ...record, ...patch } : record));
  }
  function useMaterial() {
    const lines = teacherClues.split('\n').map(line => line.trim()).filter(Boolean);
    if (!teacherTopic.trim() || !lines.length) { setMaterialError('주제와 문장을 적어 주세요.'); return; }
    if (lines.length > 20 || lines.some(line => line.length > 1000)) { setMaterialError('문장은 20개까지, 한 문장은 1,000자 안으로 적어 주세요.'); return; }
    onUpdate({ tableMaterial: { topic: teacherTopic.trim(), clues: lines }, question: teacherTopic.trim() });
    setMaterialError('자료를 바꿨어요. 이미 표에 넣은 문장은 그대로 있어요.');
  }
  async function continueLesson() {
    setMoving(true);
    try { await onContinue(); } finally { setMoving(false); }
  }

  return <section className="heritage-project simple-table-lesson" aria-label={`${lessonId}차시 표 활동`}>
    <header className="table-lesson-heading"><p>{lessonId}차시</p><h2>{lessonId === 4 ? '문장을 표로 정리해요' : '우리 표를 보기 좋게 고쳐요'}</h2>
      <p>{lessonId === 4 ? '단서 문장을 읽고, 중요한 내용을 표에 직접 써요.' : '4차시에서 만든 표예요. 비슷한 이야기끼리 모아 봐요.'}</p>
    </header>
    <div className="table-lesson-tools">
      <label>우리 모둠<select aria-label="우리 모둠" value={project.group} onChange={event => onUpdate({ group: Number(event.target.value) })}>{[1,2,3,4,5,6].map(id => <option key={id} value={id}>{id}모둠</option>)}</select></label>
      <label>우리 주제<select aria-label="우리 주제" value={project.heritageId} onChange={event => onHeritage(Number(event.target.value))}>{researchForEra(eraId).map(item => <option key={item.id} value={item.id}>{item.heritage}</option>)}</select></label>
    </div>
    {message && <p className="project-message" role="status">{message}</p>}
    <div className="table-lesson-flow" aria-label="오늘 할 일">{(lessonId === 4 ? ['단서 읽기', '종류 생각하기', '표에 직접 쓰기'] : ['같은 문장 빼기', '종류별로 모으기', '표 이름 붙이기']).map((text, index) => <span key={text}><b>{index + 1}</b>{text}</span>)}</div>

    {lessonId === 4 ? <section className="project-paper clue-sheet"><p className="table-section-label">선생님이 준 자료</p><h3>{topic}</h3>
      <p>어떤 이야기인지 생각해 본 뒤, 아래 표에 중요한 낱말이나 짧은 문장으로 써요.</p>
      <ol>{clues.map(clue => <li key={clue.id}><p>{clue.text}</p><label>어떤 이야기일까?<select aria-label={clue.text + ' 이야기 종류'} defaultValue=""><option value="">생각해 보고 골라요</option>{evidenceCategories.map(category => <option key={category} value={category}>{categoryNames[category]}</option>)}</select></label></li>)}</ol>
      <p>예: “무덤은 벽돌을 쌓아 만들었다.” → 표에서 ‘재료·만드는 방법’을 고르고 ‘벽돌’이라고 써요.</p>
    </section> : !project.records.length ? <section className="project-paper"><h3>아직 표가 없어요</h3><p>아래에서 빈 줄을 더해 직접 쓰거나, 예시 표로 시작해요.</p><button type="button" onClick={() => onRecords(sample.records.map(record => ({ ...record, status: '확인됨' })))}>예시 표로 시작하기</button></section> : null}

    <section className="project-paper table-work"><div className="project-section-title"><h3>우리 모둠 표</h3><span>내용 {project.records.length}개</span></div>
      <p>{lessonId === 4 ? '‘빈 줄 추가’를 누르고 종류를 고른 뒤, 중요한 내용을 직접 써요. 한 줄에는 한 가지 내용만 적어요.' : '같은 문장은 하나만 남겨요. 고칠 곳이 없으면 그대로 써도 좋아요.'}</p>
      {project.records.length ? <div className="research-table-scroll" tabIndex={0} role="region" aria-label="우리 모둠 표">
        <table className="project-counts student-table"><thead><tr><th scope="col">번호</th><th scope="col">내가 정리한 내용</th><th scope="col">어떤 이야기?</th><th scope="col">빼기</th></tr></thead>
          <tbody>{project.records.map((record, index) => <tr key={record.id}><th scope="row">{index + 1}</th><td>{<textarea aria-label={`${index + 1}번 문장`} maxLength={1000} value={record.text} onChange={event => changeRecord(record.id, { text: event.target.value })} placeholder="예: 벽돌" />}</td><td><select aria-label={`${index + 1}번 이야기 종류`} value={record.category} onChange={event => changeRecord(record.id, { category: event.target.value as ResearchRecord['category'] })}><option value="">골라 주세요</option>{evidenceCategories.map(category => <option key={category} value={category}>{categoryNames[category]}</option>)}</select></td><td><button type="button" aria-label={`${index + 1}번 문장 빼기`} onClick={() => onRecords(project.records.filter(item => item.id !== record.id))}>빼기</button></td></tr>)}</tbody>
        </table>
      </div> : <p className="empty-table-note">아직 빈 표예요. 아래 ‘빈 줄 추가’를 눌러 첫 줄을 써 보세요.</p>}
      <button type="button" disabled={project.records.length >= 60} onClick={addRow}>빈 줄 추가</button>
      {lessonId === 5 && project.records.length > 0 && <><button type="button" onClick={() => onRecords([...project.records].sort((a,b) => evidenceCategories.indexOf(a.category as typeof evidenceCategories[number]) - evidenceCategories.indexOf(b.category as typeof evidenceCategories[number])))}>같은 종류끼리 모으기</button><label className="student-table-title">우리 표 이름<input aria-label="우리 표 이름" maxLength={180} value={project.question} onChange={event => onUpdate({ question: event.target.value })} placeholder="예: 무령왕릉은 어떤 무덤일까?" /></label></>}
    </section>

    <footer className="table-next-step"><div><strong>{lessonId === 4 ? '이 표를 다음 시간에도 써요' : '다음에는 우리 표로 그래프를 만들어요'}</strong><p>같은 기기에서는 표가 그대로 이어져요.</p></div>
      <button className="button button--primary" type="button" disabled={moving || !ready} onClick={() => void continueLesson()}>{moving ? '표를 가져가고 있어요…' : lessonId === 4 ? '이 표로 5차시 시작 →' : '이 표로 6차시 시작 →'}</button>
    </footer>
    {project.records.length > 0 && !ready && <p role="status">빈 문장이나 ‘골라 주세요’로 남은 칸을 채워요. 똑같은 문장이 있으면 하나를 빼요.</p>}
    <div className="project-actions"><button type="button" onClick={onSave}>내 표 저장</button></div>
    <details className="table-save-tools"><summary>다른 기기에서 이어 하려면</summary><p>‘내 표 저장’을 눌러 파일을 받아요. 다른 기기에서 ‘저장한 표 열기’로 열어요.</p><div className="project-actions"><label className="project-file-button">저장한 표 열기<input aria-label="저장한 표 열기" type="file" accept=".json,application/json" onChange={event => { onImport(event.target.files?.[0]); event.target.value = ''; }} /></label></div></details>
    {lessonId === 4 && <details className="teacher-table-tools"><summary>선생님 · 주제와 단서 문장 바꾸기</summary><p>유산별 기본 문장이 들어 있습니다. 수업에 쓸 문장으로 바꿔 주세요. 한 줄에 한 문장을 씁니다.</p><label>주제<input aria-label="선생님 주제" maxLength={180} value={teacherTopic} onChange={event => setTeacherTopic(event.target.value)} /></label><label>단서 문장<textarea aria-label="선생님 단서 문장" rows={7} value={teacherClues} onChange={event => setTeacherClues(event.target.value)} /></label><p>이미 표에 담은 문장은 유지됩니다. 바꾼 자료에 맞게 표의 내용을 직접 고쳐 주세요.</p><button type="button" onClick={useMaterial}>이 자료로 수업하기</button>{materialError && <p role="status">{materialError}</p>}
      <details><summary>기본 자료를 찾은 곳</summary>{heritage.sources.filter((source,index,array) => array.findIndex(item => item.href === source.href) === index).map(source => <p key={source.id}><a href={source.href} target="_blank" rel="noreferrer">{source.institution}</a></p>)}</details>
    </details>}
  </section>;
}
