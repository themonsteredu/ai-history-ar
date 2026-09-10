import { lazy, Suspense, useState } from 'react';
import type { StudioSession } from './api';
import { NumericCodeStatus } from './NumericCodeStatus';

const ClassroomQr = lazy(() => import('./ClassroomQr'));

interface EntryProps {
  session?: StudioSession; inputCode: string; name: string; joinGroup: number; disabled: boolean;
  onInputCode: (value: string) => void; onName: (value: string) => void;
  onJoinGroup: (value: number) => void; onJoin: () => void; onGallery: () => void;
}
export function ClassroomEntry(props: EntryProps) {
  const [changing, setChanging] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const { session, disabled } = props;
  return <section className="maker-class-entry" aria-label="수업코드 입장">
    <div className="maker-entry-heading"><div><h2>{session ? '우리 반에 연결됨' : '수업코드로 입장'}</h2><p>{session ? `${session.code} · ${session.group}모둠 · ${session.name}` : '선생님이 알려 준 수업코드를 넣으세요.'}</p></div>
      <div className="studio-actions"><button type="button" aria-expanded={showQr} onClick={() => setShowQr(value => !value)}>{showQr ? '입장 QR 닫기' : '학생 입장 QR 만들기'}</button>{session && <><button className="studio-primary" disabled={disabled} onClick={props.onGallery}>우리 반 작품 보기</button><button disabled={disabled} onClick={() => setChanging(value => !value)}>{changing ? '입력칸 닫기' : '입장 정보 바꾸기'}</button></>}</div>
    </div>
    {!session && <p className="maker-entry-help">선생님용 · 숫자 6자리를 넣으면 수업코드가 자동 저장돼요.</p>}
    {showQr && <Suspense fallback={<p role="status">입장 QR을 준비해요…</p>}><ClassroomQr code={props.inputCode} onCode={props.onInputCode} /></Suspense>}
    {(!session || changing) && <form className="studio-room-form" onSubmit={event => { event.preventDefault(); if (!disabled) props.onJoin(); }}>
      <label>수업코드<input required pattern="[a-zA-Z0-9]{4,12}" disabled={disabled} minLength={4} maxLength={12} autoCapitalize="none" spellCheck={false} value={props.inputCode} onChange={event => props.onInputCode(event.target.value.trim())} placeholder="선생님의 참여 코드" /></label>
      <label>이름 또는 별명<input required maxLength={30} disabled={disabled} value={props.name} onChange={event => props.onName(event.target.value)} placeholder="내 이름 또는 별명" /></label>
      <label>내 모둠<select disabled={disabled} value={props.joinGroup} onChange={event => props.onJoinGroup(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label>
      <button className="studio-primary" disabled={disabled || !props.name.trim() || !/^[a-z0-9]{4,12}$/i.test(props.inputCode)} type="submit">수업 입장</button>
    </form>}
    {!session && <NumericCodeStatus code={props.inputCode} />}
    <p className="maker-entry-help">{session ? '공유는 모둠 대표 한 명만. 관람은 각자 해요.' : '연습만 할 때는 입장하지 않아도 돼요.'}</p>
  </section>;
}
