import { useMemo, useState } from 'react';
import { createClassroomQr, type EntryPage } from '../../lib/qr/classroomQr';
import { NumericCodeStatus } from './NumericCodeStatus';

/** Student entry QR. `compact` drops the code input and help text for a screen that already chose the class. */
export default function ClassroomQr({ code, onCode, compact = false }: { code: string; onCode: (code: string) => void; compact?: boolean }) {
  const [message, setMessage] = useState('');
  const [page, setPage] = useState<EntryPage>('visit');
  const qr = useMemo(() => createClassroomQr(code, page), [code, page]);
  async function copyLink() {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.url); setMessage('링크를 복사했어요.'); }
    catch { setMessage('복사가 안 되면 아래 주소를 길게 눌러 복사하세요.'); }
  }
  const target = <div className="classroom-qr-target" role="group" aria-label="QR로 열 화면">
    <button type="button" aria-pressed={page === 'visit'} onClick={() => { setPage('visit'); setMessage(''); }}>관람·퀴즈 화면</button>
    <button type="button" aria-pressed={page === 'maker'} onClick={() => { setPage('maker'); setMessage(''); }}>작품 만들기 화면</button>
  </div>;
  const image = qr && <figure className="classroom-qr-image"><svg role="img" aria-label={`수업코드 ${qr.code} 학생 입장 QR`} viewBox={`0 0 ${qr.size} ${qr.size}`} width="320" height="320" shapeRendering="crispEdges"><title>학생 입장 QR · {qr.code}</title><rect width="100%" height="100%" fill="#fff"/><path d={qr.path} fill="#000" /></svg><figcaption>수업코드 <strong>{qr.code}</strong></figcaption></figure>;
  const actions = qr && <div className="studio-actions classroom-qr-actions"><button type="button" onClick={() => { void copyLink(); }}>링크 복사</button><a className="classroom-qr-download" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.svg)}`} download={`AR_수업입장_${page === 'visit' ? '관람' : '만들기'}_${qr.code}.svg`}>이미지 받기</a></div>;

  if (compact) return <section className="classroom-qr-panel is-compact" aria-label="학생 입장 QR">
    {target}
    {image}
    {actions}
    <p className="maker-entry-help" role="status">{message || (page === 'visit' ? '학생은 QR을 찍고 이름·모둠만 고르면 돼요.' : '모둠 대표가 작품을 만들고 공유하는 화면이 열려요.')}</p>
  </section>;

  return <section className="classroom-qr-panel" aria-label="학생 입장 QR 생성">
    <div className="classroom-qr-info">
      <h3>학생 입장 QR</h3>
      <label>수업코드<input value={code} onChange={event => { onCode(event.target.value.trim().toLowerCase()); setMessage(''); }} minLength={4} maxLength={12} pattern="[a-z0-9]{4,12}" inputMode="numeric" autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="숫자 4~12자리" /></label>
      <p className="maker-entry-help">숫자를 넣으면 자동 저장되고 QR이 만들어져요.</p>
      <NumericCodeStatus code={code} />
      {target}
      <p className="maker-entry-help">{page === 'visit' ? '학생 화면에 관람하기·퀴즈 풀기만 나와요.' : '모둠 대표가 작품을 만들고 공유하는 화면이에요.'} 학생은 QR을 찍고 이름·모둠만 고르면 돼요.</p>
      {actions}
      {qr && <a className="classroom-qr-url" href={qr.url} target="_blank" rel="noopener noreferrer">{qr.url}</a>}
      <p role="status">{message || (!qr ? '영문·숫자 4~12자리로 입력해 주세요.' : '')}</p>
    </div>
    {image}
  </section>;
}
