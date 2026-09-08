import { useState } from 'react';
import { Link } from 'react-router-dom';
import { evidenceCategories, recordProblems, type HeritageProject } from '../content/three-kingdoms/project';
import { categoryNames } from './SimpleTableLesson';

export function SimpleGraphLesson({ project, message, onUpdate, onSave, onImport, lessonUrl }: {
  project: HeritageProject; message: string; onUpdate: (patch: Partial<HeritageProject>) => void;
  onSave: () => void; onImport: (file?: File) => void; lessonUrl: (id: number) => string;
}) {
  const [error, setError] = useState('');
  const rows = evidenceCategories.map(category => ({ label: categoryNames[category], count: project.records.filter(record => record.category === category).length }));
  const ready = project.records.length > 0 && recordProblems(project.records).length === 0;
  const title = project.graph.title || `${project.tableMaterial?.topic || '우리 모둠 표'} · 이야기 종류별 개수`;
  const current = ready && !!project.graph.image && project.graph.revision === project.revision;
  function makeGraph() {
    try {
      const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 620;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error();
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1000, 620);
      ctx.fillStyle = '#172c35'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(title, 40, 50, 920);
      ctx.font = '20px sans-serif'; ctx.fillText('표에 적은 내용 수(개)', 40, 90);
      const max = Math.max(1, ...rows.map(row => row.count));
      const step = Math.max(1, Math.ceil(max / 6)); const ceiling = Math.ceil(max / step) * step;
      for (let value = 0; value <= ceiling; value += step) {
        const y = 490 - value / ceiling * 340;
        ctx.strokeStyle = '#dbe4e7'; ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(960, y); ctx.stroke();
        ctx.fillStyle = '#172c35'; ctx.fillText(String(value), 45, y + 7);
      }
      rows.forEach((row, index) => {
        const x = 130 + index * 215; const height = row.count / ceiling * 340;
        ctx.fillStyle = '#277c85'; ctx.fillRect(x, 490 - height, 125, height);
        ctx.fillStyle = '#172c35'; ctx.textAlign = 'center'; ctx.fillText(String(row.count), x + 62, 475 - height);
        ctx.font = '18px sans-serif'; ctx.fillText(row.label, x + 62, 530); ctx.font = '20px sans-serif';
      });
      ctx.fillText('이야기 종류', 500, 585);
      onUpdate({ cleanedRevision: project.revision, graph: { image: canvas.toDataURL('image/png'), dimension: 'category', revision: project.revision, title }, interpretation: '', limitation: '' });
      setError('');
    } catch { setError('그래프를 만들지 못했어요. 다시 눌러 주세요.'); }
  }
  return <section className="heritage-project simple-table-lesson" aria-label="6차시 그래프 활동">
    <header className="table-lesson-heading"><p>6차시</p><h2>내가 쓴 표로 그래프를 만들어요</h2><p>표의 한 줄을 한 개로 세어요. 같은 종류의 내용이 몇 개인지 비교해요.</p></header>
    {message && <p role="status">{message}</p>}
    <section className="project-paper"><h3>저장한 우리 표</h3>
      <div className="research-table-scroll"><table className="project-counts"><thead><tr><th>어떤 이야기?</th><th>내가 정리한 내용</th></tr></thead><tbody>{project.records.map(record => <tr key={record.id}><td>{record.category ? categoryNames[record.category] : '아직 고르지 않았어요'}</td><td>{record.text || '아직 쓰지 않았어요'}</td></tr>)}</tbody></table></div>
      <Link to={lessonUrl(5)}>표 고치러 가기</Link>
    </section>
    <section className="project-paper"><h3>종류별로 몇 개일까요?</h3><table className="project-counts"><thead><tr><th>이야기 종류</th><th>내용 수</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><td>{row.label}</td><td>{row.count}개</td></tr>)}</tbody></table>
      <label className="student-table-title">그래프 제목<input aria-label="그래프 제목" maxLength={180} value={project.graph.title} placeholder={title} onChange={event => onUpdate({ graph: { ...project.graph, title: event.target.value, image: '', revision: -1 } })} /></label>
      <button className="button button--primary" disabled={!ready} onClick={makeGraph}>이 표로 그래프 만들기</button>
      {!ready && <p>표에 내용을 쓰고 이야기 종류를 골라 주세요. 같은 내용은 한 줄만 남겨요.</p>}
      {project.graph.image && !current && <p role="status">표가 바뀌었어요. 위 버튼을 눌러 그래프에 반영해요.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
    {current && <figure className="project-graph"><img src={project.graph.image} alt={title} /><figcaption>우리 표 전체 {project.records.length}개 · 위 표와 같은 개수예요.</figcaption><button onClick={() => { const link = document.createElement('a'); link.href = project.graph.image; link.download = '우리모둠-그래프.png'; link.click(); }}>그래프 그림 저장</button></figure>}
    <div className="project-actions"><button onClick={onSave}>표와 그래프 저장</button><label className="project-file-button">저장한 작업 열기<input aria-label="저장한 작업 열기" type="file" accept=".json,application/json" onChange={event => { onImport(event.target.files?.[0]); event.target.value = ''; }} /></label>{current && <Link to={lessonUrl(7)}>이 그래프로 7차시 시작 →</Link>}</div>
    <p>같은 기기에는 자동으로 보관해요. 다른 기기에서는 저장한 작업 파일을 열어요.</p>
  </section>;
}
