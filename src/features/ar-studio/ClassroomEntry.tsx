import { useState } from 'react';
import type { StudioSession } from './api';

interface EntryProps {
  session?: StudioSession; inputCode: string; name: string; joinGroup: number; disabled: boolean;
  onInputCode: (value: string) => void; onName: (value: string) => void;
  onJoinGroup: (value: number) => void; onJoin: () => void; onGallery: () => void;
}
export function ClassroomEntry(props: EntryProps) {
  const [changing, setChanging] = useState(false);
  const { session, disabled } = props;
  return <section className="maker-class-entry" aria-label="수업코드 입장">
    <div className="maker-entry-heading"><div><h2>{session ? '우리 반에 연결됨' : '수업코드로 입장'}</h2><p>{session ? `${session.code} · ${session.group}모둠 · ${session.name}` : '선생님이 알려 준 수업코드를 입력하세요. 별도 계정은 필요 없어요.'}</p></div>
      {session && <div className="studio-actions"><button className="studio-primary" disabled={disabled} onClick={props.onGallery}>우리 반 작품 보기</button><button disabled={disabled} onClick={() => setChanging(value => !value)}>{changing ? '입력칸 닫기' : '입장 정보 바꾸기'}</button></div>}
    </div>
    {!session && <p className="maker-entry-help">선생님은 <a href="https://hub.moakit.ai/app" target="_blank" rel="noopener noreferrer">수업허브 열기</a>에서 수업을 열고 참여 코드를 확인해 주세요. 이 화면은 학생 입장용이에요.</p>}
    {(!session || changing) && <form className="studio-room-form" onSubmit={event => { event.preventDefault(); if (!disabled) props.onJoin(); }}>
      <label>수업코드<input required pattern="[a-zA-Z0-9]{4,12}" disabled={disabled} minLength={4} maxLength={12} autoCapitalize="none" spellCheck={false} value={props.inputCode} onChange={event => props.onInputCode(event.target.value.trim())} placeholder="선생님의 참여 코드" /></label>
      <label>이름 또는 별명<input required maxLength={30} disabled={disabled} value={props.name} onChange={event => props.onName(event.target.value)} placeholder="내 이름 또는 별명" /></label>
      <label>내 모둠<select disabled={disabled} value={props.joinGroup} onChange={event => props.onJoinGroup(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label>
      <button className="studio-primary" disabled={disabled || !props.name.trim() || !/^[a-z0-9]{4,12}$/i.test(props.inputCode)} type="submit">수업 입장</button>
    </form>}
    <p className="maker-entry-help">{session ? '모둠 대표가 처음 공유한 태블릿에서 저장해요. 모든 친구는 자기 태블릿으로 1~6모둠 작품을 볼 수 있어요.' : '혼자 연습할 때는 입장하지 않고 아래에서 바로 시작해도 돼요.'}</p>
  </section>;
}
