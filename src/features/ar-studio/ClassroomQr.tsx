import { useMemo, useState } from 'react';
import { createClassroomQr } from '../../lib/qr/classroomQr';
import { NumericCodeStatus } from './NumericCodeStatus';

export default function ClassroomQr({ initialCode, onCode }: { initialCode: string; onCode?: (code: string) => void }) {
  const [code, setCode] = useState(initialCode), [message, setMessage] = useState('');
  const qr = useMemo(() => createClassroomQr(code), [code]);
  async function copyLink() {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.url); setMessage('학생 입장 링크를 복사했어요.'); }
    catch { setMessage('자동 복사가 안 돼요. 아래 주소를 길게 눌러 복사해 주세요.'); }
  }
  return <section className="classroom-qr-panel" aria-label="학생 입장 QR 생성">
    <div className="classroom-qr-info">
      <h3>학생 입장 QR</h3>
      <p>숫자 수업코드를 입력하면 자동 저장되고, 학생 입장 QR도 만들어져요.</p>
      <label>QR에 넣을 수업코드<input value={code} onChange={event => { const next = event.target.value.trim().toLowerCase(); setCode(next); onCode?.(next); setMessage(''); }} minLength={4} maxLength={12} pattern="[a-z0-9]{4,12}" inputMode="numeric" autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="숫자 4~12자리" /></label>
      <NumericCodeStatus code={code} />
      <p className="maker-entry-help">학생은 태블릿 기본 카메라로 QR을 찍고, 열린 화면에서 이름과 모둠을 고르면 됩니다.</p>
      <p className="maker-entry-help">다른 반과 겹치지 않는 6자리 이상을 권장해요. 같은 숫자 수업은 90일간 이어 쓸 수 있어요. 이 QR은 입장용이며, 유물을 띄우는 AR 사진 카드는 별도예요.</p>
      {qr && <><div className="studio-actions"><button type="button" onClick={() => { void copyLink(); }}>입장 링크 복사</button><a className="classroom-qr-download" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.svg)}`} download={`AR_수업입장_${qr.code}.svg`}>QR 이미지 받기</a></div><a className="classroom-qr-url" href={qr.url} target="_blank" rel="noopener noreferrer">{qr.url}</a></>}
      <p role="status">{message || (!qr ? '영문·숫자로 된 4~12자리 수업코드를 입력해 주세요.' : '')}</p>
    </div>
    {qr && <figure className="classroom-qr-image"><svg role="img" aria-label={`수업코드 ${qr.code} 학생 입장 QR`} viewBox={`0 0 ${qr.size} ${qr.size}`} width="320" height="320" shapeRendering="crispEdges"><title>학생 입장 QR · {qr.code}</title><rect width="100%" height="100%" fill="#fff"/><path d={qr.path} fill="#000" /></svg><figcaption>수업코드 <strong>{qr.code}</strong></figcaption></figure>}
  </section>;
}
