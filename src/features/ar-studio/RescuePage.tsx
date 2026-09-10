import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadProjectFile } from '../../content/three-kingdoms/project';
import { listProjectDrafts } from '../../lib/projectDraftStore';
import { collectDrafts, rescueFileName, type DraftSummary } from './rescue';
import './studio.css';
import './maker.css';

export default function RescuePage() {
  const [drafts, setDrafts] = useState<DraftSummary[]>();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    void listProjectDrafts()
      .then(values => { if (!cancelled) setDrafts(collectDrafts(values)); })
      .catch(() => { if (!cancelled) setError('저장 공간을 열지 못했어요. 학생이 쓰던 브라우저에서 열어 주세요.'); });
    return () => { cancelled = true; };
  }, []);
  function save(summary: DraftSummary, index: number) {
    downloadProjectFile(JSON.stringify(summary.project), rescueFileName(summary, index), 'application/json');
    setSaved(previous => previous.includes(summary.key) ? previous : [...previous, summary.key]);
  }
  const withWork = drafts?.filter(draft => draft.hasWork) || [];

  return <main className="studio-page page-width rescue-page">
    <header className="maker-titlebar"><div><Link to="/three-kingdoms">← 삼국시대</Link><h1>학생 작업 복구</h1></div></header>
    <p className="rescue-lead">이 태블릿에 남은 작업을 찾아 파일로 꺼냅니다. <b>지우거나 바꾸지 않습니다.</b></p>

    {error && <p className="studio-notice" role="alert">{error}</p>}
    {!drafts && !error && <p role="status">찾는 중…</p>}

    {drafts && <>
      <div className="rescue-summary" role="status">
        {withWork.length ? <><strong>작업 {withWork.length}개를 찾았어요.</strong> 녹음도 파일 안에 함께 들어갑니다.</>
          : <><strong>작업을 찾지 못했어요.</strong> 학생이 쓰던 브라우저에서 다시 열어 주세요.</>}
      </div>

      {withWork.length > 1 && <div className="studio-actions"><button className="studio-primary" onClick={() => withWork.forEach((draft, index) => save(draft, index))}>찾은 작업 {withWork.length}개 모두 저장</button></div>}

      <ul className="rescue-list">{withWork.map((draft, index) => <li key={draft.key} className={saved.includes(draft.key) ? 'is-saved' : undefined}>
        <div className="rescue-item-head"><h2>{draft.group ? `${draft.group}모둠` : '모둠 미지정'} · {draft.heritage}</h2>{saved.includes(draft.key) && <span className="rescue-done">저장함</span>}</div>
        <ul className="rescue-facts">
          <li><b>{draft.recordings}</b>개 녹음{draft.seconds > 0 && ` · 약 ${draft.seconds}초`}</li>
          <li>설명점 <b>{draft.points}</b>곳</li>
          <li>글 <b>{draft.letters}</b>자</li>
          <li>문제 <b>{draft.questions}</b>개</li>
        </ul>
        <p className="rescue-where">{draft.classCode ? `수업코드 ${draft.classCode}` : '수업코드 없음'}</p>
        <p className="rescue-filename"><code>{rescueFileName(draft, index)}</code></p>
        <div className="studio-actions"><button className="studio-primary" onClick={() => save(draft, index)}>파일로 저장</button><Link className="rescue-open" to={draft.classCode ? `/three-kingdoms/ar-maker?hub_code=${draft.classCode}` : '/three-kingdoms/ar-maker'}>이 작업이 있는 화면 열기</Link></div>
      </li>)}</ul>

      {drafts.length > withWork.length && <details className="maker-extra"><summary>빈 저장본 {drafts.length - withWork.length}개</summary>
        <ul className="rescue-list rescue-list--empty">{drafts.filter(draft => !draft.hasWork).map((draft, index) => <li key={draft.key}>
          <div className="rescue-item-head"><h2>{draft.group ? `${draft.group}모둠` : '모둠 미지정'} · {draft.heritage}</h2></div>
          <p className="rescue-where">내용 없음 · {draft.classCode || '수업코드 없음'}</p>
          <div className="studio-actions"><button onClick={() => save(draft, index)}>그래도 파일로 저장</button></div>
        </li>)}</ul>
      </details>}
    </>}

    <section className="rescue-next">
      <h2>꺼낸 파일 쓰는 법</h2>
      <ol>
        <li>파일을 한 폴더에 모아 둡니다.</li>
        <li><Link to="/three-kingdoms/ar-maker">AR 만들기</Link> → <b>작업 파일 열기</b>로 엽니다.</li>
        <li>수업코드 입장 → <b>모둠에 공유</b>. 모둠당 한 대만 누릅니다.</li>
      </ol>
    </section>
  </main>;
}
