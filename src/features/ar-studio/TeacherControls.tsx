import { useState } from 'react';
import { allArCardsUrl } from '../../components/ArRecognitionCard';

export function TeacherControls({ initialCode, onCode }: { initialCode: string; onCode: (code: string) => void }) {
  const [code, setCode] = useState(initialCode);
  return <section><header><h1>수업코드로 우리 반 연결</h1><p>기존 수업허브의 참여 코드를 그대로 사용합니다. 학생은 별도 계정 없이 입장해요.</p></header>
    <ol><li><a href="https://hub.moakit.ai/app" target="_blank" rel="noopener noreferrer">수업허브 열기</a>에서 수업을 열고 참여 코드를 확인하세요.</li><li>학생은 AR 만들기 맨 위에서 코드·이름 또는 별명·모둠을 입력해요.</li><li>모둠 대표 한 명이 ‘모둠에 공유’를 누르면 모두가 자기 태블릿에서 관람해요.</li></ol>
    <p>처음 공유한 태블릿이 그 모둠의 저장을 맡습니다. 퀴즈는 선택 활동이고, 전시 시작 버튼은 따로 누르지 않아도 됩니다. 수업 마감·다시 열기는 수업허브에서 관리하세요.</p>
    <div className="studio-room-form"><label>수업허브 참여 코드<input value={code} maxLength={12} autoCapitalize="none" spellCheck={false} onChange={event => setCode(event.target.value.trim().toLowerCase())} /></label><button className="studio-primary" disabled={!/^[a-z0-9]{4,12}$/.test(code)} onClick={() => onCode(code)}>이 화면에 코드 적용</button></div>
    <p><a href={allArCardsUrl()} download>책상에 놓을 유물 카드 6종 받기 · A4</a></p>
    <p>공유된 작품·녹음과 개인 답안은 AR 전용 영역에 저장됩니다. 기존 수업허브의 학생 명단이나 수업자료는 바꾸지 않습니다.</p>
  </section>;
}
