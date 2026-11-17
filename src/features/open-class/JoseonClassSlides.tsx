import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import slides from './joseonSlides.json';
import { usePresentationDialog } from './usePresentationDialog';
import './joseon-class-slides.css';

type Reveal = {
  image: string;
  alt: string;
  left: number;
  top: number;
  width: number;
  height: number;
  durationMs?: number;
  offsetY?: number;
};
type Slide = { image: string; alt: string; autoAdvanceMs?: number; reveals?: Reveal[] };

const presentations = [
  { id: 'flash-quiz', title: '조선 유물 깜빡퀴즈', firstSlide: 1 },
  { id: 'lesson-recap', title: '조선 과학기술 수업 정리', firstSlide: 0 },
] as const;
type Presentation = typeof presentations[number];

function assetUrl(deck: Presentation, image: string) {
  return `${import.meta.env.BASE_URL}presentations/joseon/${deck.id}/${image}`;
}

export function JoseonClassSlides() {
  const [deck, setDeck] = useState<Presentation>();
  return <>
    <div className="joseon-slides-links" role="group" aria-label="조선 수업 PPT">
      {presentations.map(presentation => <button type="button" key={presentation.id} onClick={() => setDeck(presentation)}>
        {presentation.title}
      </button>)}
    </div>
    {deck && <SlideShow key={deck.id} deck={deck} onClose={() => setDeck(undefined)} />}
  </>;
}

function SlideShow({ deck, onClose }: { deck: Presentation; onClose: () => void }) {
  const root = usePresentationDialog(onClose);
  const pages: Slide[] = slides[deck.id];
  const [position, setPosition] = useState({ page: deck.firstSlide as number, revealed: 0, animateFrom: 0 });
  const [readyImage, setReadyImage] = useState('');
  const [failedImage, setFailedImage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { page, revealed, animateFrom } = position;
  const slide = pages[page];
  const image = assetUrl(deck, slide.image);
  const revealCount = slide.reveals?.length ?? 0;
  const canGoNext = !slide.autoAdvanceMs && (revealed < revealCount || page < pages.length - 1);
  const canGoBack = revealed > 0 || page > 0;

  useEffect(() => {
    // Decode the flash and its follow-up before the teacher advances from the prompt.
    const preloaded: HTMLImageElement[] = [];
    for (const nearby of pages.slice(Math.max(page - 1, 0), page + 3)) {
      for (const file of [nearby.image, ...nearby.reveals?.map(layer => layer.image) ?? []]) {
        const next = new Image();
        next.src = assetUrl(deck, file);
        preloaded.push(next);
        void next.decode().catch(() => {});
      }
    }
    return () => { preloaded.length = 0; };
  }, [deck, page, pages]);

  useEffect(() => {
    if (!slide.autoAdvanceMs || readyImage !== image) return;
    let timeout: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      timeout = window.setTimeout(() => {
        setPosition({ page: page + 1, revealed: 0, animateFrom: 0 });
      }, slide.autoAdvanceMs);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [image, page, readyImage, slide.autoAdvanceMs]);

  function advance() {
    if (!canGoNext || readyImage !== image) return;
    if (revealed < revealCount) setPosition({ ...position, revealed: revealed + 1 });
    else setPosition({ page: page + 1, revealed: 0, animateFrom: 0 });
  }

  function goBack() {
    if (revealed > 0) {
      setPosition({ ...position, revealed: revealed - 1, animateFrom: 0 });
    } else if (page > 0) {
      let previous = page - 1;
      if (pages[previous].autoAdvanceMs) previous -= 1;
      const visible = pages[previous].reveals?.length ?? 0;
      setPosition({ page: previous, revealed: visible, animateFrom: visible });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key) &&
      !(event.key === ' ' && (event.target as HTMLElement).closest('button'))) {
      event.preventDefault();
      if (!event.repeat) advance();
    } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) goBack();
    }
  }

  return <section ref={root} className="joseon-slide-show" role="dialog" aria-modal="true" aria-label={deck.title} onKeyDown={onKeyDown}>
    <header>
      <strong>{deck.title}</strong>
      <button type="button" data-autofocus onClick={onClose}>발표 닫기</button>
    </header>
    <div className="joseon-slide-show__canvas">
      <div className="joseon-slide-show__slide" key={page} onClick={advance}>
        <img className="joseon-slide-show__base" key={attempt} src={image} alt={slide.alt || '빈 슬라이드'}
          onLoad={() => { setReadyImage(image); setFailedImage(''); }} onError={() => setFailedImage(image)} />
        {slide.reveals?.map((layer, index) => {
          const style = {
            left: `${layer.left}%`, top: `${layer.top}%`, width: `${layer.width}%`, height: `${layer.height}%`,
            '--reveal-duration': `${layer.durationMs ?? 0}ms`,
            '--reveal-offset': `${(layer.offsetY ?? 0) * 100 / layer.height}%`,
          } as CSSProperties;
          return <img className="joseon-slide-show__reveal" key={layer.image} src={assetUrl(deck, layer.image)}
            alt={layer.alt} hidden={index >= revealed} data-motion={Boolean(layer.durationMs && index >= animateFrom)} style={style} />;
        })}
        {failedImage === image && <div className="joseon-slide-show__error" onClick={event => event.stopPropagation()}>
          <p role="alert">슬라이드를 불러오지 못했어요.</p>
          <button type="button" onClick={() => { setFailedImage(''); setAttempt(value => value + 1); }}>다시 불러오기</button>
        </div>}
      </div>
    </div>
    <footer>
      <button type="button" onClick={goBack} disabled={!canGoBack}>이전</button>
      <span aria-live="polite">{page + 1} / {pages.length}</span>
      <button type="button" onClick={advance} disabled={!canGoNext || readyImage !== image}>
        {revealed < revealCount ? '다음 사진' : '다음'}
      </button>
    </footer>
  </section>;
}
