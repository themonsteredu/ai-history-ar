import { useEffect, useRef, useState } from "react";
import { getThreeKingdomsSlides, type HeritageImageKey, type LessonSlide } from "../content/three-kingdoms/slides";

const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;

const artifacts = [
  {
    key: "muryeong",
    name: "무령왕릉",
    kingdom: "백제",
    question: "무덤의 주인을 어떻게 알았을까?",
    image: `${imageRoot}/muryeong-tomb.jpg`,
    alt: "공주 무령왕릉 내부 재현 공간",
    source: "Bernard Gagnon · CC0",
    href: "https://commons.wikimedia.org/wiki/File:King_Muryeong_Tomb_01.jpg",
  },
  {
    key: "incense",
    name: "백제 금동대향로",
    kingdom: "백제",
    question: "향로의 산과 동물은 무엇을 뜻할까?",
    image: `${imageRoot}/baekje-incense-burner.jpg`,
    alt: "백제 금동대향로",
    source: "Gary Todd · CC0",
    href: "https://commons.wikimedia.org/wiki/File:Baekje_Gilt_Bronze_Incense_Burner,_6th-7th_Cent._(30165906226).jpg",
  },
  {
    key: "cheomseongdae",
    name: "첨성대",
    kingdom: "신라",
    question: "이 돌 건물은 어떻게 사용했을까?",
    image: `${imageRoot}/cheomseongdae.jpg`,
    alt: "경주 첨성대",
    source: "Matt & Nayoung Wilson · CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Korea-Gyeongju-Cheomseongdae-02.jpg",
  },
  {
    key: "crown",
    name: "신라 금관",
    kingdom: "신라",
    question: "금관은 언제 어떻게 사용했을까?",
    image: `${imageRoot}/silla-crown.jpg`,
    alt: "국립중앙박물관의 신라 금관",
    source: "Ismoon · CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Royal_Crown_of_Silla._National_Museum_of_Korea.jpg",
  },
  {
    key: "mural",
    name: "고구려 고분벽화",
    kingdom: "고구려",
    question: "그림 속 사람들은 무엇을 하고 있을까?",
    image: `${imageRoot}/goguryeo-mural.jpg`,
    alt: "고구려 무용총 수렵도 벽화",
    source: "작자 미상 · Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Goguryeo_tomb_mural.jpg",
  },
  {
    key: "gaya",
    name: "가야 고분군",
    kingdom: "가야",
    question: "여러 지역의 큰 무덤은 무엇을 뜻할까?",
    image: `${imageRoot}/gaya-tombs.jpg`,
    alt: "창녕 비화가야 고분군",
    source: "Visviva · Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Changnyeong_tombs_below.jpg",
  },
] as const;

const artifactByKey = Object.fromEntries(artifacts.map((artifact) => [artifact.key, artifact])) as Record<HeritageImageKey, (typeof artifacts)[number]>;

function SlideSources({ slide }: { slide: LessonSlide }) {
  const artifact = artifactByKey[slide.image];
  return (
    <div className="class-slide__source-row">
      {slide.source ? <a href={slide.source.href} target="_blank" rel="noreferrer">{slide.source.label}</a> : <span />}
      <a href={artifact.href} target="_blank" rel="noreferrer">사진: {artifact.source}</a>
    </div>
  );
}

function FactSlide({ slide }: { slide: Extract<LessonSlide, { kind: "fact" }> }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--lesson-fact">
      <figure><img src={artifact.image} alt={artifact.alt} /></figure>
      <div className="class-slide__lesson-copy">
        <p className="class-slide__kicker">{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <ul>{slide.points.map((point) => <li key={point}>{point}</li>)}</ul>
        {slide.takeaway ? <p className="class-slide__takeaway">{slide.takeaway}</p> : null}
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function CompareSlide({ slide }: { slide: Extract<LessonSlide, { kind: "compare" }> }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--lesson-compare">
      <img className="class-slide__compare-photo" src={artifact.image} alt={artifact.alt} />
      <div className="class-slide__compare-body">
        <p className="class-slide__kicker">{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <div className="class-slide__comparison">
          {[slide.left, slide.right].map((column) => (
            <article key={column.label}>
              <span>{column.label}</span>
              <h4>{column.title}</h4>
              <ul>{column.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function ActivitySlide({ slide }: { slide: Extract<LessonSlide, { kind: "activity" }> }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--lesson-activity">
      <div className="class-slide__activity-copy">
        <p className="class-slide__kicker">{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <p className="class-slide__activity-instruction">{slide.instruction}</p>
        <ol>{slide.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
      </div>
      <figure><img src={artifact.image} alt={artifact.alt} /></figure>
      <SlideSources slide={slide} />
    </section>
  );
}

function QuizSlide({ slide }: { slide: Extract<LessonSlide, { kind: "quiz" }> }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className={`class-slide class-slide--lesson-quiz class-slide--verdict-${slide.verdict}`}>
      <img src={artifact.image} alt={artifact.alt} />
      <div className="class-slide__quiz-shade" />
      <div className="class-slide__quiz-copy">
        <p>{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <blockquote>“{slide.statement}”</blockquote>
        <div><strong>{slide.verdict}</strong><span>{slide.explanation}</span></div>
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function GallerySlide({ slide }: { slide: Extract<LessonSlide, { kind: "gallery" }> }) {
  return (
    <section className="class-slide class-slide--cards">
      <header>
        <div><p className="class-slide__kicker">{slide.eyebrow}</p><h3>{slide.title}</h3></div>
        <span>{slide.instruction}</span>
      </header>
      <div className="artifact-choice-grid">
        {artifacts.map((artifact) => (
          <article className="artifact-choice-card" key={artifact.name}>
            <img src={artifact.image} alt={artifact.alt} />
            <div><span>{artifact.kingdom}</span><h4>{artifact.name}</h4><p>{artifact.question}</p></div>
          </article>
        ))}
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function ClassSlide({ slide }: { slide: LessonSlide }) {
  const artifact = artifactByKey[slide.image];

  if (slide.kind === "fact") return <FactSlide slide={slide} />;
  if (slide.kind === "compare") return <CompareSlide slide={slide} />;
  if (slide.kind === "activity") return <ActivitySlide slide={slide} />;
  if (slide.kind === "quiz") return <QuizSlide slide={slide} />;
  if (slide.kind === "gallery") return <GallerySlide slide={slide} />;

  if (slide.kind === "cover") {
    return (
      <section className="class-slide class-slide--cover">
        <img src={artifact.image} alt={artifact.alt} />
        <div className="class-slide__shade" />
        <div className="class-slide__cover-copy">
          <p>{slide.tag}</p>
          <h3>{slide.title.split("\n").map((line, index) => <span key={line}>{index > 0 ? <br /> : null}{line}</span>)}</h3>
          <span>{slide.subtitle}</span>
        </div>
        <SlideSources slide={slide} />
      </section>
    );
  }

  return (
    <section className="class-slide class-slide--closing">
      <img src={artifact.image} alt={artifact.alt} />
      <div className="class-slide__shade" />
      <div className="class-slide__closing-copy">
        <p>{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <div className="class-slide__closing-prompt">{slide.prompt}</div>
        <div><span>이어 보기</span><strong>{slide.next}</strong></div>
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

export function LessonSlides({ lessonId }: { lessonId: number }) {
  const slides = getThreeKingdomsSlides(lessonId);
  const [current, setCurrent] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const move = (direction: number) => {
    setCurrent((index) => Math.min(slides.length - 1, Math.max(0, index + direction)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!viewerRef.current?.contains(document.activeElement) && document.fullscreenElement !== viewerRef.current) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") setCurrent((index) => Math.min(slides.length - 1, index + 1));
      if (event.key === "ArrowLeft" || event.key === "PageUp") setCurrent((index) => Math.max(0, index - 1));
      if (event.key === "Home") setCurrent(0);
      if (event.key === "End") setCurrent(slides.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  const enterFullscreen = async () => {
    await viewerRef.current?.requestFullscreen();
    viewerRef.current?.focus();
  };

  return (
    <section className="lesson-slides-section" aria-labelledby={`lesson-slides-title-${lessonId}`}>
      <div className="lesson-slides-section__heading">
        <div>
          <p>교실 화면용 · 역사 내용 + 활동 안내 · 별도 다운로드 없음</p>
          <h2 id={`lesson-slides-title-${lessonId}`}>{lessonId}차시 수업 슬라이드</h2>
        </div>
        <button className="lesson-slides__fullscreen" type="button" onClick={enterFullscreen}>전체 화면으로 수업하기</button>
      </div>

      <div className="lesson-slides" ref={viewerRef} tabIndex={0} aria-label={`삼국시대 ${lessonId}차시 수업 슬라이드`}>
        <div className="lesson-slides__stage" aria-live="polite">
          <ClassSlide slide={slides[current]} />
        </div>
        <div className="lesson-slides__controls">
          <button type="button" onClick={() => move(-1)} disabled={current === 0} aria-label="이전 슬라이드">←</button>
          <div className="lesson-slides__dots" aria-label="슬라이드 선택">
            {slides.map((_, index) => (
              <button
                type="button"
                className={index === current ? "is-active" : ""}
                onClick={() => setCurrent(index)}
                aria-label={`${index + 1}번 슬라이드`}
                aria-current={index === current ? "step" : undefined}
                key={index}
              />
            ))}
          </div>
          <span>{current + 1} / {slides.length}</span>
          <button type="button" onClick={() => move(1)} disabled={current === slides.length - 1} aria-label="다음 슬라이드">→</button>
        </div>
      </div>
      <p className="lesson-slides-section__hint">화면을 한 번 누른 뒤 키보드 ← → 로도 넘길 수 있습니다.</p>
    </section>
  );
}
