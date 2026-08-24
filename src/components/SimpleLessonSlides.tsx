import { useEffect, useRef, useState } from "react";
import type { Era, Lesson } from "../types/curriculum";

interface SimpleSlide {
  kicker: string;
  title: string;
  body: readonly string[];
  prompt?: string;
}

function buildSlides(era: Era, lesson: Lesson): readonly SimpleSlide[] {
  return [
    {
      kicker: `${era.grade} 사회 · ${era.shortName} ${lesson.id}차시`,
      title: lesson.title,
      body: [lesson.role],
      prompt: lesson.keyQuestion,
    },
    {
      kicker: "오늘 만날 문화유산",
      title: `${era.shortName}의 여섯 가지 역사 단서`,
      body: era.groups.map((group) => `${group.category} · ${group.heritage}`),
    },
    {
      kicker: "오늘의 질문",
      title: lesson.keyQuestion,
      body: [lesson.objective],
    },
    ...lesson.activities.map((activity) => ({
      kicker: `${activity.stage} · ${activity.minutes}분`,
      title: activity.title,
      body: activity.details,
    })),
    {
      kicker: "웹앱 활동",
      title: "화면에서 직접 확인하고 시험해요",
      body: ["친구와 함께 화면을 조작합니다.", "결과가 나온 까닭을 역사 근거로 설명합니다.", "기록이 필요한 내용은 교사가 안내할 때만 정리합니다."],
    },
    {
      kicker: "오늘의 마무리",
      title: "근거를 들어 한 문장으로 설명해 볼까요?",
      body: [lesson.keyQuestion],
      prompt: lesson.nextLessonPrep,
    },
  ];
}

export function SimpleLessonSlides({ era, lesson }: { era: Era; lesson: Lesson }) {
  const slides = buildSlides(era, lesson);
  const [current, setCurrent] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const slide = slides[current];
  const image = `${import.meta.env.BASE_URL}images/${era.id === "joseon" ? "joseon-cover.webp" : "three-kingdoms-cover.webp"}`;

  function move(direction: number) {
    setCurrent((index) => Math.min(slides.length - 1, Math.max(0, index + direction)));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!viewerRef.current?.contains(document.activeElement) && document.fullscreenElement !== viewerRef.current) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") move(1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") move(-1);
      if (event.key === "Home") setCurrent(0);
      if (event.key === "End") setCurrent(slides.length - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  async function enterFullscreen() {
    await viewerRef.current?.requestFullscreen();
    viewerRef.current?.focus();
  }

  return (
    <section className="lesson-slides-section" aria-labelledby={`simple-slides-title-${lesson.id}`}>
      <div className="lesson-slides-section__heading">
        <div><p>교실 화면용 · 다운로드 없음</p><h2 id={`simple-slides-title-${lesson.id}`}>{lesson.id}차시 수업 PPT</h2></div>
        <button className="lesson-slides__fullscreen" onClick={enterFullscreen} type="button">전체 화면으로 수업하기</button>
      </div>
      <div className="lesson-slides simple-slides" ref={viewerRef} tabIndex={0} aria-label={`${era.shortName} ${lesson.id}차시 수업 슬라이드`}>
        <div className="lesson-slides__stage" aria-live="polite">
          <section className="simple-slide">
            <img alt="" src={image} />
            <div className="simple-slide__shade" />
            <div className="simple-slide__copy">
              <p>{slide.kicker}</p>
              <h3>{slide.title}</h3>
              <ul>{slide.body.map((item) => <li key={item}>{item}</li>)}</ul>
              {slide.prompt ? <blockquote>“{slide.prompt}”</blockquote> : null}
            </div>
          </section>
        </div>
        <div className="lesson-slides__controls">
          <button aria-label="이전 슬라이드" disabled={current === 0} onClick={() => move(-1)} type="button">←</button>
          <div className="lesson-slides__dots" aria-label="슬라이드 선택">
            {slides.map((_, index) => (
              <button aria-current={index === current ? "step" : undefined} aria-label={`${index + 1}번 슬라이드`} className={index === current ? "is-active" : ""} key={index} onClick={() => setCurrent(index)} type="button" />
            ))}
          </div>
          <span>{current + 1} / {slides.length}</span>
          <button aria-label="다음 슬라이드" disabled={current === slides.length - 1} onClick={() => move(1)} type="button">→</button>
        </div>
      </div>
      <p className="lesson-slides-section__hint">화면을 한 번 누른 뒤 키보드 ← → 로도 넘길 수 있습니다.</p>
    </section>
  );
}
