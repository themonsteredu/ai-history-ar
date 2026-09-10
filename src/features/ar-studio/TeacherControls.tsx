import { useState } from 'react';
import { allArCardsUrl } from '../../components/ArRecognitionCard';

export function TeacherControls({ initialCode, onCode }: { initialCode: string; onCode: (code: string) => void }) {
  const [code, setCode] = useState(initialCode);
  return <section><header><h1>수업코드로 우리 반 연결</h1><p>숫자 4~12자리를 정하면 이 화면에서 바로 수업이 만들어집니다. 학생도 선생님도 별도 계정이 필요 없어요.</p></header>
    <ol><li>화면 위 <b>학생 입장 QR 만들기</b>에서 숫자 6자리를 입력하고 <b>수업코드 저장 완료</b> 표시를 확인하세요.</li><li>QR을 화면에 띄우거나 숫자를 칠판에 적어 주세요. 학생은 코드·이름·모둠만 입력해 입장합니다.</li><li>모둠 대표 한 명이 <b>모둠에 공유</b>를 누르면 모두가 자기 태블릿에서 관람합니다.</li></ol>
    <p>처음 공유한 태블릿이 그 모둠의 저장을 맡습니다. <b>전시 시작 버튼은 따로 없고</b>, 공유하는 즉시 반 전체에 보입니다. 같은 숫자 수업은 90일 동안 이어 쓸 수 있어요.</p>
    <p>개인 퀴즈는 모둠이 <b>모두 공유를 마친 뒤</b> 시작해 주세요. 도중에 새로 공유하는 모둠이 있으면 문제가 늘어나 학생 제출이 막힙니다. 진행 상황은 위 진행판의 모둠 공유 현황에서 확인할 수 있어요.</p>
    <div className="studio-room-form"><label>이 화면에 적용할 수업코드<input value={code} maxLength={12} autoCapitalize="none" spellCheck={false} inputMode="numeric" onChange={event => setCode(event.target.value.trim().toLowerCase())} /></label><button className="studio-primary" disabled={!/^[a-z0-9]{4,12}$/.test(code)} onClick={() => onCode(code)}>이 화면에 코드 적용</button></div>
    <p><a href={allArCardsUrl()} download>책상에 놓을 유물 카드 6종 받기 · A4</a></p>
    <p>기존 <a href="https://hub.moakit.ai/app" target="_blank" rel="noopener noreferrer">수업허브</a>의 참여 코드도 그대로 사용할 수 있습니다. 그때는 수업 마감·다시 열기를 수업허브에서 관리하세요.</p>
    <p>공유된 작품·녹음과 개인 답안은 AR 전용 영역에 저장됩니다. 기존 수업허브의 학생 명단이나 수업자료는 바꾸지 않습니다.</p>
  </section>;
}
