import { useState } from 'react';
import { arLessons } from './curriculum';
export function TeacherGuide({ lessonId, onLesson, onStep }: { lessonId: number; onLesson: (id: number) => void; onStep: (step: string) => void }) {
  const lesson = arLessons.find(item => item.id === lessonId) || arLessons[0];
  const [slide, setSlide] = useState<number | null>(null);
  return <section className="studio-guide">
    <div className="studio-tabs">{arLessons.map(item => <button key={item.id} aria-pressed={item.id === lesson.id} onClick={() => { onLesson(item.id); setSlide(null); }}>{item.id}차시 · {item.id === 4 ? '모형' : item.id === 5 ? '해설·문제' : '관람·퀴즈'}</button>)}</div>
    <header><p className="eyebrow">{lesson.id}차시 · 40분</p><h1>{lesson.title}</h1><p>{lesson.goal}</p></header>
    <div className="studio-guide-layout"><div><h2>이 순서로 진행하세요</h2><ol className="studio-timing">{lesson.segments.map((segment, index) => <li key={segment.title}><span>{segment.minutes}분</span><div><h3>{index + 1}. {segment.title}</h3><p>{segment.detail}</p></div></li>)}</ol></div><aside className="studio-guide-summary"><h2>오늘의 완성 기준</h2><p>{lesson.finish}</p><p>{lesson.id === 4 ? '태블릿으로 도형을 넣고 크기·위치를 조절합니다. 마우스 없이 할 수 있어요.' : lesson.id === 5 ? '근거가 부족하면 기존 조사 자료를 다시 확인합니다. 녹음은 1개당 30초 이내예요.' : '카드를 이동하며 관람한 뒤 자리로 돌아와 각자 문제를 풉니다. 이어폰을 준비해 주세요.'}</p><button className="studio-primary" onClick={() => setSlide(0)}>먼저 설명하기 · 수업 슬라이드</button><button onClick={() => onStep(lesson.id === 4 ? 'demo' : lesson.step)}>함께 따라 하기 · 교사 시범</button><button onClick={() => onStep(lesson.step)}>학생 활동 열기</button>{lesson.id === 6 && <button onClick={() => onStep('teacher')}>전시·퀴즈 진행 관리</button>}</aside></div>
    {slide !== null && <section className="studio-theory" aria-label={`${lesson.id}차시 수업 슬라이드`}><p>{lesson.id}차시 핵심 개념 · {slide + 1} / {lesson.theory.length}</p><h2>{lesson.theory[slide]}</h2><div className="studio-actions"><button disabled={slide === 0} onClick={() => setSlide(slide - 1)}>이전</button><button disabled={slide === lesson.theory.length - 1} onClick={() => setSlide(slide + 1)}>다음</button><button onClick={() => setSlide(null)}>설명 마치기</button></div></section>}
  </section>;
}
