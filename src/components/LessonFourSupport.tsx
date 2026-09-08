import { useState } from 'react';
import type { EraId } from '../types/curriculum';
import { eraName, researchForEra } from '../content/heritageCatalog';
import { lessonFourSample, previousWorksheetAnswers } from '../content/lessonFourSamples';
import { downloadProjectFile, projectCsv, type HeritageProject, type ResearchRecord } from '../content/three-kingdoms/project';

export function ResearchTable({ records, caption }: { records: readonly ResearchRecord[]; caption: string }) {
  return <div className="research-table-scroll" tabIndex={0} role="region" aria-label={caption}>
    <table className="project-counts research-table"><caption>{caption}</caption>
      <thead><tr>{['번호', '자료에서 찾은 문장', '어떤 내용?', '확인 상태', '출처'].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
      <tbody>{records.map((record, index) => <tr key={record.id}><th scope="row">{index + 1}</th><td>{record.text}</td><td>{record.category || '5차시에 고르기'}</td><td>{record.status}</td><td><a href={record.url} target="_blank" rel="noreferrer">{record.source} ↗</a></td></tr>)}</tbody>
    </table>
  </div>;
}

export function LessonFourSupport({ eraId, project, onAddSample, onFillCorrection }: {
  eraId: EraId; project: HeritageProject;
  onAddSample: (sample: HeritageProject) => void;
  onFillCorrection: (sample: HeritageProject) => void;
}) {
  const [previewId, setPreviewId] = useState(project.heritageId);
  const heritages = researchForEra(eraId);
  const heritage = heritages.find(item => item.id === previewId)!;
  const sample = lessonFourSample(eraId, previewId);
  const answers = previousWorksheetAnswers(eraId).find(item => item.id === previewId)!;
  const ownHeritage = previewId === project.heritageId;
  const hasAllSamples = sample.records.every(item => project.records.some(record => record.id === item.id || record.text.replace(/\s/g, '') === item.text.replace(/\s/g, '')));
  const fileBase = `${eraName(eraId)}_${previewId}모둠_${heritage.heritage}_4차시_샘플`;

  return <section className="project-paper lesson-four-support" aria-labelledby="lesson-four-support-title">
    <p className="lesson-four-support__eyebrow">표 만들기가 처음이라면</p>
    <h3 id="lesson-four-support-title">모둠별 샘플 표와 지난 활동지 답안</h3>
    <p>표 한 줄에는 문장 하나를 담아요. 아래 완성 모양을 보고, 샘플 문장 세 개로 시작해도 좋아요.</p>
    <ol className="sample-howto"><li>담당 유산의 샘플 표를 살펴봐요.</li><li>‘샘플 문장 3개를 우리 표에 추가’를 눌러요.</li><li>출처를 읽고 아래 편집 칸에서 문장과 확인 상태를 고쳐요.</li></ol>
    <div className="sample-group-picker" role="group" aria-label="모둠별 샘플 선택">
      {heritages.map(item => <button type="button" key={item.id} aria-pressed={previewId === item.id} onClick={() => setPreviewId(item.id)}>{item.id}모둠 · {item.heritage}</button>)}
    </div>
    <h4>{previewId}모둠 · {heritage.heritage} 샘플 데이터</h4>
    <ResearchTable records={sample.records} caption="샘플 표 · 문장 3개 (내용 분류는 예시)" />
    <p>샘플은 ‘추가 확인’으로 시작해요. 출처를 직접 읽은 뒤 ‘확인됨’ 또는 ‘판단 보류’로 바꿔요. 같은 기관의 문장 여러 개를 서로 다른 출처로 세지 않아요.</p>
    {!ownHeritage && <p>지금은 다른 유산의 샘플을 보고 있어요. 내 표에 사용하려면 화면 맨 위의 ‘담당 유산’을 먼저 선택하세요.</p>}
    <div className="project-actions">
      <button type="button" disabled={!ownHeritage || hasAllSamples} onClick={() => onAddSample(sample)}>{ownHeritage && hasAllSamples ? '샘플 문장이 이미 표에 있어요' : '샘플 문장 3개를 우리 표에 추가'}</button>
      <button type="button" onClick={() => downloadProjectFile(projectCsv(sample), `${fileBase}.csv`, 'text/csv;charset=utf-8')}>이 모둠 샘플 표 받기 (CSV)</button>
      <button type="button" onClick={() => downloadProjectFile(JSON.stringify(sample, null, 2), `${fileBase}.json`, 'application/json')}>이 모둠 샘플 작업 받기</button>
    </div>
    <p className="project-save-note">추가는 이미 쓴 문장을 유지해요. 샘플 작업 파일에는 고친 말 예시도 들어 있으며, ‘지난 작업 열기’로 열 수 있어요.</p>
    <details className="sample-answers" key={previewId}>
      <summary>{previewId}모둠 · 지난 활동지 6문장 답안 보기</summary>
      <p>지난 활동지와 비교해 잘못 쓴 부분을 고쳐요. 아직 자료를 읽지 못했다면 ?로 남겨도 괜찮아요. △는 근거 부족이나 해석의 차이를 살펴보라는 뜻이에요.</p>
      <ol>{answers.items.map(([statement, verdict, explanation], index) => <li key={statement}>
        <strong>{index + 1}번 · {verdict}</strong><p>{statement}</p><p className="sample-answer-reason">근거·바르게 고친 설명: {explanation}</p>
      </li>)}</ol>
      <p>확인 자료: {answers.source}</p>
      <div className="project-actions">{[...new Map(heritage.sources.map(source => [source.href, source])).values()].map(source => <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.institution} 자료 열기 ↗</a>)}</div>
      <h4>4차시 ‘지난 시간에 고친 말’ 작성 예시</h4>
      <p><strong>우리가 의심했던 말:</strong> {sample.previousClaim}</p>
      <p><strong>자료를 읽고 어떻게 고쳤나요?</strong> {sample.correction}</p>
      <button type="button" disabled={!ownHeritage || (!!project.previousClaim.trim() && !!project.correction.trim())} onClick={() => onFillCorrection(sample)}>고친 말 예시를 빈칸에 채우기</button>
      <p className="project-save-note">이미 적은 답은 바뀌지 않아요. 잘못 쓴 답은 아래 ‘지난 시간에 고친 말’ 입력 칸에서 직접 고쳐요.</p>
    </details>
  </section>;
}
