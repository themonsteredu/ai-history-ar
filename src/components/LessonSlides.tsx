import { useEffect, useRef, useState } from "react";
import {
  getThreeKingdomsSlides,
  type HeritageImageKey,
  type LessonSlide,
  type SlideSource,
} from "../content/three-kingdoms/slides";

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

interface PromptSlide {
  kind: "prompt";
  image: HeritageImageKey;
  source?: SlideSource;
  eyebrow: string;
  title: string;
  question: string;
  instruction: string;
}

type PresentationSlide = LessonSlide | PromptSlide;

function revealClass(visible: boolean) {
  return visible ? "slide-reveal is-visible" : "slide-reveal";
}

function getRevealCount(slide: PresentationSlide) {
  if (slide.kind === "fact") return slide.points.length + (slide.takeaway ? 1 : 0);
  if (slide.kind === "compare") return 2;
  if (slide.kind === "activity") return slide.steps.length;
  if (slide.kind === "quiz") return 1;
  if (slide.kind === "gallery") return 3;
  if (slide.kind === "closing") return 2;
  return 0;
}

function expandPresentationSlides(slides: readonly LessonSlide[]): readonly PresentationSlide[] {
  return slides.flatMap<PresentationSlide>((slide): readonly PresentationSlide[] => {
    if (slide.kind === "quiz") {
      return [
        {
          kind: "prompt" as const,
          image: slide.image,
          source: slide.source,
          eyebrow: slide.eyebrow,
          title: slide.title,
          question: slide.statement,
          instruction: "확인·틀림·보류 중 하나를 고르고, 그렇게 생각한 까닭을 말해 봅시다.",
        },
        slide,
      ];
    }

    if (slide.kind === "compare") {
      return [
        {
          kind: "prompt" as const,
          image: slide.image,
          source: slide.source,
          eyebrow: slide.eyebrow,
          title: slide.title,
          question: `‘${slide.left.label}’과 ‘${slide.right.label}’은 무엇이 다를까요?`,
          instruction: "사진과 앞에서 배운 내용을 떠올려 차이점을 먼저 말해 봅시다.",
        },
        slide,
      ];
    }

    if (slide.kind === "closing") {
      return [
        {
          kind: "prompt" as const,
          image: slide.image,
          source: slide.source,
          eyebrow: "오늘의 Q&A",
          title: "마지막 질문",
          question: slide.title,
          instruction: "친구와 먼저 답을 말해 본 뒤 다음 장에서 핵심 답을 확인해 봅시다.",
        },
        slide,
      ];
    }

    return [slide];
  });
}

function SlideSources({ slide }: { slide: { image: HeritageImageKey; source?: SlideSource } }) {
  const artifact = artifactByKey[slide.image];
  return (
    <div className="class-slide__source-row">
      {slide.source ? <a href={slide.source.href} target="_blank" rel="noreferrer">{slide.source.label}</a> : <span />}
      <a href={artifact.href} target="_blank" rel="noreferrer">사진: {artifact.source}</a>
    </div>
  );
}

function FactSlide({ slide, revealStep }: { slide: Extract<LessonSlide, { kind: "fact" }>; revealStep: number }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--lesson-fact">
      <figure><img src={artifact.image} alt={artifact.alt} /></figure>
      <div className="class-slide__lesson-copy">
        <p className="class-slide__kicker">{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <ul>{slide.points.map((point, index) => <li aria-hidden={revealStep < index + 1} className={revealClass(revealStep >= index + 1)} key={point}>{point}</li>)}</ul>
        {slide.takeaway ? <p aria-hidden={revealStep < slide.points.length + 1} className={`class-slide__takeaway ${revealClass(revealStep >= slide.points.length + 1)}`}>{slide.takeaway}</p> : null}
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function CompareSlide({ slide, revealStep }: { slide: Extract<LessonSlide, { kind: "compare" }>; revealStep: number }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--lesson-compare">
      <img className="class-slide__compare-photo" src={artifact.image} alt={artifact.alt} />
      <div className="class-slide__compare-body">
        <p className="class-slide__kicker">답 확인 · {slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <div className="class-slide__comparison">
          {[slide.left, slide.right].map((column, index) => (
            <article aria-hidden={revealStep < index + 1} className={revealClass(revealStep >= index + 1)} key={column.label}>
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

function ActivitySlide({ slide, revealStep }: { slide: Extract<LessonSlide, { kind: "activity" }>; revealStep: number }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--lesson-activity">
      <div className="class-slide__activity-copy">
        <p className="class-slide__kicker">{slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <p className="class-slide__activity-instruction">{slide.instruction}</p>
        <ol>{slide.steps.map((step, index) => <li aria-hidden={revealStep < index + 1} className={revealClass(revealStep >= index + 1)} key={step}><span>{index + 1}</span>{step}</li>)}</ol>
      </div>
      <figure><img src={artifact.image} alt={artifact.alt} /></figure>
      <SlideSources slide={slide} />
    </section>
  );
}

function QuizSlide({ slide, revealStep }: { slide: Extract<LessonSlide, { kind: "quiz" }>; revealStep: number }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className={`class-slide class-slide--lesson-quiz class-slide--verdict-${slide.verdict}`}>
      <img src={artifact.image} alt={artifact.alt} />
      <div className="class-slide__quiz-shade" />
      <div className="class-slide__quiz-copy">
        <p>답 확인 · {slide.eyebrow}</p>
        <h3>{slide.title}</h3>
        <blockquote>“{slide.statement}”</blockquote>
        <div aria-hidden={revealStep < 1} className={revealClass(revealStep >= 1)}><strong>{slide.verdict}</strong><span>{slide.explanation}</span></div>
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function PromptSlideView({ slide }: { slide: PromptSlide }) {
  const artifact = artifactByKey[slide.image];
  return (
    <section className="class-slide class-slide--prompt">
      <img src={artifact.image} alt={artifact.alt} />
      <div className="class-slide__prompt-shade" />
      <div className="class-slide__prompt-copy">
        <p>{slide.eyebrow} · 먼저 생각하기</p>
        <h3>{slide.title}</h3>
        <blockquote>“{slide.question}”</blockquote>
        <span>{slide.instruction}</span>
        <strong>답과 근거는 다음 장에서 확인합니다 →</strong>
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function GallerySlide({ slide, revealStep }: { slide: Extract<LessonSlide, { kind: "gallery" }>; revealStep: number }) {
  return (
    <section className="class-slide class-slide--cards">
      <header>
        <div><p className="class-slide__kicker">{slide.eyebrow}</p><h3>{slide.title}</h3></div>
        <span>{slide.instruction}</span>
      </header>
      <div className="artifact-choice-grid">
        {artifacts.map((artifact, index) => (
          <article aria-hidden={revealStep < Math.floor(index / 2) + 1} className={`artifact-choice-card ${revealClass(revealStep >= Math.floor(index / 2) + 1)}`} key={artifact.name}>
            <img src={artifact.image} alt={artifact.alt} />
            <div><span>{artifact.kingdom}</span><h4>{artifact.name}</h4><p>{artifact.question}</p></div>
          </article>
        ))}
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

function ClassSlide({ slide, revealStep }: { slide: PresentationSlide; revealStep: number }) {
  const artifact = artifactByKey[slide.image];

  if (slide.kind === "prompt") return <PromptSlideView slide={slide} />;
  if (slide.kind === "fact") return <FactSlide revealStep={revealStep} slide={slide} />;
  if (slide.kind === "compare") return <CompareSlide revealStep={revealStep} slide={slide} />;
  if (slide.kind === "activity") return <ActivitySlide revealStep={revealStep} slide={slide} />;
  if (slide.kind === "quiz") return <QuizSlide revealStep={revealStep} slide={slide} />;
  if (slide.kind === "gallery") return <GallerySlide revealStep={revealStep} slide={slide} />;

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
        <p>{slide.eyebrow} · 답 공개</p>
        <h3>{slide.title}</h3>
        <div aria-hidden={revealStep < 1} className={`class-slide__closing-answer ${revealClass(revealStep >= 1)}`}><span>핵심 답</span><strong>{slide.prompt}</strong></div>
        <div aria-hidden={revealStep < 2} className={revealClass(revealStep >= 2)}><span>이어 보기</span><strong>{slide.next}</strong></div>
      </div>
      <SlideSources slide={slide} />
    </section>
  );
}

export function LessonSlides({ lessonId }: { lessonId: number }) {
  const slides = expandPresentationSlides(getThreeKingdomsSlides(lessonId));
  const [current, setCurrent] = useState(0);
  const [revealStep, setRevealStep] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const slide = slides[current];
  const revealTotal = getRevealCount(slide);

  const goTo = (index: number) => {
    setCurrent(Math.min(slides.length - 1, Math.max(0, index)));
    setRevealStep(0);
  };

  const advance = () => {
    if (revealStep < revealTotal) {
      setRevealStep((step) => Math.min(revealTotal, step + 1));
      return;
    }
    if (current < slides.length - 1) goTo(current + 1);
  };

  const retreat = () => {
    if (revealStep > 0) {
      setRevealStep((step) => Math.max(0, step - 1));
      return;
    }
    if (current > 0) goTo(current - 1);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!viewerRef.current?.contains(document.activeElement) && document.fullscreenElement !== viewerRef.current) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        advance();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        retreat();
      }
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(slides.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, revealStep, revealTotal, slides.length]);

  const enterFullscreen = async () => {
    await viewerRef.current?.requestFullscreen();
    viewerRef.current?.focus();
  };

  return (
    <section className="lesson-slides-section" aria-labelledby={`lesson-slides-title-${lessonId}`}>
      <div className="lesson-slides-section__heading">
        <div>
          <p>교실 화면용 · 질문 → 생각 → 클릭 공개</p>
          <h2 id={`lesson-slides-title-${lessonId}`}>{lessonId}차시 수업 슬라이드</h2>
        </div>
        <button className="lesson-slides__fullscreen" type="button" onClick={enterFullscreen}>전체 화면으로 수업하기</button>
      </div>

      <div className="lesson-slides" ref={viewerRef} tabIndex={0} aria-label={`삼국시대 ${lessonId}차시 수업 슬라이드`}>
        <div className="lesson-slides__stage" aria-live="polite">
          <ClassSlide key={current} revealStep={revealStep} slide={slide} />
        </div>
        <div className="lesson-slides__controls">
          <button type="button" onClick={retreat} disabled={current === 0 && revealStep === 0} aria-label="이전 내용">←</button>
          <div className="lesson-slides__dots" aria-label="슬라이드 선택">
            {slides.map((_, index) => (
              <button
                type="button"
                className={index === current ? "is-active" : ""}
                onClick={() => goTo(index)}
                aria-label={`${index + 1}번 슬라이드`}
                aria-current={index === current ? "step" : undefined}
                key={index}
              />
            ))}
          </div>
          <div className="lesson-slides__counter"><span>{current + 1} / {slides.length}</span>{revealTotal > 0 ? <small>내용 {revealStep} / {revealTotal}</small> : null}</div>
          <button className="lesson-slides__reveal-button" disabled={current === slides.length - 1 && revealStep === revealTotal} onClick={advance} type="button">
            {revealStep < revealTotal ? "다음 내용 공개" : "다음 슬라이드"}
          </button>
          <button type="button" onClick={advance} disabled={current === slides.length - 1 && revealStep === revealTotal} aria-label={revealStep < revealTotal ? "다음 내용 공개" : "다음 슬라이드"}>→</button>
        </div>
      </div>
      <p className="lesson-slides-section__hint">질문을 먼저 보여 준 뒤 ‘다음 내용 공개’를 누르세요. 키보드 → 또는 Space로도 한 단계씩 진행됩니다.</p>
    </section>
  );
}
