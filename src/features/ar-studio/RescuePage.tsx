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
      .catch(() => { if (!cancelled) setError('이 태블릿의 저장 공간을 열지 못했어요. 학생이 쓰던 브라우저와 같은 브라우저에서 열어 주세요.'); });
    return () => { cancelled = true; };
  }, []);
  function save(summary: DraftSummary, index: number) {
    downloadProjectFile(JSON.stringify(summary.project), rescueFileName(summary, index), 'application/json');
    setSaved(previous => previous.includes(summary.key) ? previous : [...previous, summary.key]);
  }
  const withWork = drafts?.filter(draft => draft.hasWork) || [];

  return <main className="studio-page page-width rescue-page">
    <header className="maker-titlebar"><div><Link to="/three-kingdoms">← 삼국시대</Link><h1>학생 작업 복구</h1></div></header>
    <p className="rescue-lead">이 태블릿에 저장된 AR 작업을 모두 찾아 파일로 꺼냅니다. <b>저장된 내용은 지우거나 바꾸지 않습니다.</b> 학생이 쓰던 그 태블릿, 그 브라우저에서 열어 주세요.</p>

    {error && <p className="studio-notice" role="alert">{error}</p>}
    {!drafts && !error && <p role="status">이 태블릿의 저장 공간을 살펴보고 있어요…</p>}

    {drafts && <>
      <div className="rescue-summary" role="status">
        {withWork.length ? <><strong>작업 {withWork.length}개를 찾았어요.</strong> 아래에서 <b>파일로 저장</b>을 눌러 하나씩 꺼내 주세요. 녹음도 파일 안에 함께 들어갑니다. 태블릿이 파일 이름을 <code>download</code> 같이 바꿔 저장하면, 아래 적힌 이름으로 고쳐 두세요.</>
          : <><strong>이 태블릿에서는 학생 작업을 찾지 못했어요.</strong> 다른 태블릿이거나 다른 브라우저일 수 있어요. 학생이 쓰던 브라우저에서 이 주소를 다시 열어 주세요.</>}
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
        <p className="rescue-where">{draft.classCode ? `수업코드 ${draft.classCode}로 작업함` : '수업코드 없이 작업함'}</p>
        <p className="rescue-filename">저장될 파일 이름 · <code>{rescueFileName(draft, index)}</code></p>
        <div className="studio-actions"><button className="studio-primary" onClick={() => save(draft, index)}>파일로 저장</button></div>
      </li>)}</ul>

      {drafts.length > withWork.length && <details className="maker-extra"><summary>내용이 없는 저장본 {drafts.length - withWork.length}개도 보기</summary>
        <ul className="rescue-list rescue-list--empty">{drafts.filter(draft => !draft.hasWork).map((draft, index) => <li key={draft.key}>
          <div className="rescue-item-head"><h2>{draft.group ? `${draft.group}모둠` : '모둠 미지정'} · {draft.heritage}</h2></div>
          <p className="rescue-where">글·녹음·문제가 없습니다. {draft.classCode ? `수업코드 ${draft.classCode}` : '수업코드 없음'}</p>
          <div className="studio-actions"><button onClick={() => save(draft, index)}>그래도 파일로 저장</button></div>
        </li>)}</ul>
      </details>}
    </>}

    <section className="rescue-next">
      <h2>꺼낸 파일로 다음 수업 하기</h2>
      <ol>
        <li>받은 파일 5개를 드라이브나 USB 한 폴더에 모아 둡니다.</li>
        <li>도슨트 수업 때 <Link to="/three-kingdoms/ar-maker">AR 만들기</Link>를 열고 아래 <b>작업 파일 보관·불러오기 → 작업 파일 열기</b>로 해당 모둠 파일을 엽니다.</li>
        <li>수업코드로 입장한 뒤 <b>모둠에 공유</b>를 누르면 그 모둠 작품으로 반 전체에 올라갑니다. 모둠마다 한 대에서만 누릅니다.</li>
      </ol>
      <p>파일에는 글·설명점 위치·녹음이 모두 들어 있습니다. 태블릿이 바뀌어도 파일만 있으면 그대로 이어집니다.</p>
    </section>
  </main>;
}
