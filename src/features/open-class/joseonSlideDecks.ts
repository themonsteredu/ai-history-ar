import slides from './joseonSlides.json';

export type Reveal = {
  image: string;
  alt: string;
  left: number;
  top: number;
  width: number;
  height: number;
  durationMs?: number;
  offsetY?: number;
  /** What the 'next' button says while this layer is still hidden; '다음 사진' when not given. */
  nextLabel?: string;
};
/** `chapter` marks the first slide of a part the teacher can jump to from the slide show's header. */
export type Slide = { image: string; alt: string; autoAdvanceMs?: number; chapter?: string; reveals?: Reveal[] };

export const presentations = [
  { id: 'flash-quiz', title: '조선 유물 깜빡퀴즈', firstSlide: 1 },
  { id: 'lesson-recap', title: '조선 과학기술 수업 정리', firstSlide: 0 },
  // Made in advance from the history newspapers for a lesson without internet: scripts/build_joseon_ox_backup_slides.mjs.
  { id: 'ox-backup', title: '조선 유물 OX 예비 퀴즈', firstSlide: 0 },
] as const;
export type Presentation = typeof presentations[number];

export const deckSlides = (deck: Presentation): Slide[] => slides[deck.id];

export function slideUrl(deck: Presentation, image: string) {
  return `${import.meta.env.BASE_URL}presentations/joseon/${deck.id}/${image}`;
}

/** Every picture of every deck, so '수업 준비하기' on the teacher page keeps the slides for a lesson without internet. */
export function allSlideUrls() {
  return presentations.flatMap(deck => deckSlides(deck)
    .flatMap(slide => [slide.image, ...slide.reveals?.map(layer => layer.image) ?? []])
    .map(image => slideUrl(deck, image)));
}
