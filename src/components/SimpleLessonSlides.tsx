import { getJoseonSlides } from "../content/joseon/slides";
import { heritageImageUrl, imageCreditForEra } from "../content/heritageCatalog";
import { CodapStep } from "./CodapTutorial";
import { codapTutorial } from "../content/three-kingdoms/codapTutorial";
import { useEffect, useRef, useState } from "react";
import type { Era, Lesson } from "../types/curriculum";

export function SimpleLessonSlides({ era, lesson }: { era: Era; lesson: Lesson }) {
  const slides = getJoseonSlides(lesson.id);
  const [current, setCurrent] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const slide = slides[current];
  const heritageId = slide.heritageId ?? ((lesson.id - 1) % 6 + 1);
  const image = heritageImageUrl(era.id, heritageId);
  const credit = imageCreditForEra(era.id, heritageId);

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
          {slide.tutorial ? <CodapStep key={slide.tutorial.id} step={slide.tutorial} index={codapTutorial.indexOf(slide.tutorial)} /> : <section className="simple-slide">
            <img alt="" src={image} />
            <div className="simple-slide__shade" />
            <div className="simple-slide__copy">
              <p>{slide.kicker}</p>
              <h3>{slide.title}</h3>
              <ul>{slide.body.map((item) => <li key={item}>{item}</li>)}</ul>
              {slide.prompt ? <blockquote>“{slide.prompt}”</blockquote> : null}
            </div>
          </section>}
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
      {slide.source && <p className="lesson-slides-section__hint">자료: <a href={slide.source.href} target="_blank" rel="noreferrer">{slide.source.label}</a></p>}
      {!slide.tutorial && credit && <p className="lesson-slides-section__hint">사진: {credit.alt} · <a href={credit.source} target="_blank" rel="noreferrer">{credit.credit}</a> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">이용 조건</a></p>}
      <p className="lesson-slides-section__hint">화면을 한 번 누른 뒤 키보드 ← → 로도 넘길 수 있습니다.</p>
    </section>
  );
}
