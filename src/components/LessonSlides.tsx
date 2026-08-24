import { useEffect, useRef, useState } from "react";

const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;

const artifacts = [
  {
    name: "무령왕릉",
    kingdom: "백제",
    question: "무덤 안에서 무엇이 발견되었을까?",
    image: `${imageRoot}/muryeong-tomb.jpg`,
    alt: "공주 무령왕릉 내부 재현 공간",
    source: "Bernard Gagnon · CC0",
    href: "https://commons.wikimedia.org/wiki/File:King_Muryeong_Tomb_01.jpg",
  },
  {
    name: "백제 금동대향로",
    kingdom: "백제",
    question: "향로의 산과 동물은 무엇을 뜻할까?",
    image: `${imageRoot}/baekje-incense-burner.jpg`,
    alt: "백제 금동대향로",
    source: "Gary Todd · CC0",
    href: "https://commons.wikimedia.org/wiki/File:Baekje_Gilt_Bronze_Incense_Burner,_6th-7th_Cent._(30165906226).jpg",
  },
  {
    name: "첨성대",
    kingdom: "신라",
    question: "이 돌 건물은 무엇에 쓰였을까?",
    image: `${imageRoot}/cheomseongdae.jpg`,
    alt: "경주 첨성대",
    source: "Matt & Nayoung Wilson · CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Korea-Gyeongju-Cheomseongdae-02.jpg",
  },
  {
    name: "신라 금관",
    kingdom: "신라",
    question: "금관은 누가, 언제 썼을까?",
    image: `${imageRoot}/silla-crown.jpg`,
    alt: "국립중앙박물관의 신라 금관",
    source: "Ismoon · CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Royal_Crown_of_Silla._National_Museum_of_Korea.jpg",
  },
  {
    name: "고구려 고분벽화",
    kingdom: "고구려",
    question: "그림 속 사람들은 무엇을 하고 있을까?",
    image: `${imageRoot}/goguryeo-mural.jpg`,
    alt: "고구려 무용총 수렵도 벽화",
    source: "작자 미상 · Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Goguryeo_tomb_mural.jpg",
  },
  {
    name: "가야 고분군",
    kingdom: "가야",
    question: "봉분 안에는 어떤 이야기가 남았을까?",
    image: `${imageRoot}/gaya-tombs.jpg`,
    alt: "창녕 비화가야 고분군",
    source: "Visviva · Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Changnyeong_tombs_below.jpg",
  },
] as const;

function PhotoCredit({ artifactIndex }: { artifactIndex: number }) {
  const artifact = artifacts[artifactIndex];
  return (
    <a className="class-slide__credit" href={artifact.href} target="_blank" rel="noreferrer">
      사진: {artifact.source}
    </a>
  );
}

const slides = [
  <section className="class-slide class-slide--cover" key="cover">
    <img src={artifacts[0].image} alt={artifacts[0].alt} />
    <div className="class-slide__shade" />
    <div className="class-slide__cover-copy">
      <p>초등학교 5학년 사회 · 삼국시대 1차시</p>
      <h3>1500년 전에는<br />무엇이 있었을까?</h3>
      <span>사진을 보고, 우리 모둠이 탐구할 유물을 골라 봅시다.</span>
    </div>
    <PhotoCredit artifactIndex={0} />
  </section>,
  <section className="class-slide class-slide--split" key="question">
    <div className="class-slide__copy">
      <p className="class-slide__kicker">오늘의 질문</p>
      <h3>사진만 보고<br />무엇을 알 수 있을까?</h3>
      <div className="class-slide__prompt">
        <strong>학습 목표</strong>
        <p>삼국시대 문화유산을 살펴보고, 우리 모둠의 탐구 주제를 정할 수 있다.</p>
      </div>
    </div>
    <figure className="class-slide__photo">
      <img src={artifacts[4].image} alt={artifacts[4].alt} />
      <figcaption>보이는 것과 짐작한 것을 나누어 말해 보세요.</figcaption>
    </figure>
    <PhotoCredit artifactIndex={4} />
  </section>,
  <section className="class-slide class-slide--cards" key="cards">
    <header>
      <div><p className="class-slide__kicker">모둠 선택 활동</p><h3>어떤 유물이 가장 궁금한가요?</h3></div>
      <span>한 장을 고르고 이유를 말해요</span>
    </header>
    <div className="artifact-choice-grid">
      {artifacts.map((artifact) => (
        <article className="artifact-choice-card" key={artifact.name}>
          <img src={artifact.image} alt={artifact.alt} />
          <div><span>{artifact.kingdom}</span><h4>{artifact.name}</h4><p>{artifact.question}</p></div>
        </article>
      ))}
    </div>
    <p className="class-slide__sources">사진 출처·라이선스는 각 사진과 마지막 자료에서 확인할 수 있습니다.</p>
  </section>,
  <section className="class-slide class-slide--observe" key="observe">
    <figure>
      <img src={artifacts[1].image} alt={artifacts[1].alt} />
      <PhotoCredit artifactIndex={1} />
    </figure>
    <div>
      <p className="class-slide__kicker">사진 탐정 활동</p>
      <h3>먼저 자세히 관찰해요</h3>
      <ol className="class-slide__number-list">
        <li><span>1</span><p><strong>보이는 것</strong>모양·무늬·재료를 찾아요.</p></li>
        <li><span>2</span><p><strong>궁금한 것</strong>알아보고 싶은 질문을 만들어요.</p></li>
        <li><span>3</span><p><strong>아직 모르는 것</strong>사진만으로 단정하지 않아요.</p></li>
      </ol>
    </div>
  </section>,
  <section className="class-slide class-slide--steps" key="steps">
    <header><p className="class-slide__kicker">모둠에서 정하는 방법</p><h3>세 단계면 충분해요</h3></header>
    <div className="choice-steps">
      <article><img src={artifacts[3].image} alt={artifacts[3].alt} /><span>1</span><h4>각자 하나 고르기</h4><p>가장 궁금한 유물을 손가락으로 짚어요.</p></article>
      <article><img src={artifacts[2].image} alt={artifacts[2].alt} /><span>2</span><h4>이유 한 문장 말하기</h4><p>“나는 ○○가 궁금해. 왜냐하면…”</p></article>
      <article><img src={artifacts[5].image} alt={artifacts[5].alt} /><span>3</span><h4>모둠 선택 기록하기</h4><p>유물 이름과 선택한 이유를 활동지에 써요.</p></article>
    </div>
  </section>,
  <section className="class-slide class-slide--record" key="record">
    <img src={artifacts[2].image} alt={artifacts[2].alt} />
    <div className="class-slide__record-sheet">
      <p className="class-slide__kicker">활동지에 이렇게 기록해요</p>
      <h3>우리 모둠의 선택</h3>
      <dl>
        <div><dt>고른 유물</dt><dd>____________________</dd></div>
        <div><dt>선택한 이유</dt><dd>____________________<br />____________________</dd></div>
        <div><dt>가장 궁금한 점</dt><dd>____________________</dd></div>
      </dl>
    </div>
    <PhotoCredit artifactIndex={2} />
  </section>,
  <section className="class-slide class-slide--same" key="same">
    <div className="class-slide__same-photos">
      <img src={artifacts[0].image} alt={artifacts[0].alt} />
      <img src={artifacts[3].image} alt={artifacts[3].alt} />
      <img src={artifacts[5].image} alt={artifacts[5].alt} />
    </div>
    <div>
      <p className="class-slide__kicker">선택 약속</p>
      <h3>다른 모둠과<br />같은 유물을 골라도 괜찮아요.</h3>
      <p className="class-slide__lead">대신 우리 모둠만의 <strong>궁금한 질문</strong>을 만들어요.</p>
      <div className="class-slide__question-example">예: “금관은 예쁜데, 실제로 머리에 쓰기 편했을까?”</div>
    </div>
  </section>,
  <section className="class-slide class-slide--closing" key="closing">
    <img src={artifacts[4].image} alt={artifacts[4].alt} />
    <div className="class-slide__shade" />
    <div className="class-slide__closing-copy">
      <p>오늘의 마무리</p>
      <h3>우리가 고른 유물에 대해<br />지금 알고 있는 것과<br />궁금한 것은 무엇인가요?</h3>
      <div><span>다음 시간</span><strong>AI에게 질문하고, 설명이 맞는지 살펴봅니다.</strong></div>
    </div>
    <PhotoCredit artifactIndex={4} />
  </section>,
] as const;

export function LessonSlides() {
  const [current, setCurrent] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const move = (direction: number) => {
    setCurrent((index) => Math.min(slides.length - 1, Math.max(0, index + direction)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!viewerRef.current?.contains(document.activeElement) && document.fullscreenElement !== viewerRef.current) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") move(1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") move(-1);
      if (event.key === "Home") setCurrent(0);
      if (event.key === "End") setCurrent(slides.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const enterFullscreen = async () => {
    await viewerRef.current?.requestFullscreen();
    viewerRef.current?.focus();
  };

  return (
    <section className="lesson-slides-section" aria-labelledby="lesson-slides-title">
      <div className="lesson-slides-section__heading">
        <div>
          <p>교실 화면용 · 별도 다운로드 없음</p>
          <h2 id="lesson-slides-title">1차시 수업 슬라이드</h2>
        </div>
        <button className="lesson-slides__fullscreen" type="button" onClick={enterFullscreen}>전체 화면으로 수업하기</button>
      </div>

      <div className="lesson-slides" ref={viewerRef} tabIndex={0} aria-label="삼국시대 1차시 수업 슬라이드">
        <div className="lesson-slides__stage" aria-live="polite">
          {slides[current]}
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
