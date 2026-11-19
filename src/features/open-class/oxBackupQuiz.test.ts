import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import quiz from './oxBackupQuiz.json';
import readings from './heritage-reading.json';
import slides from './joseonSlides.json';
import { ARTIFACTS } from './artifacts';
import { allSlideUrls, presentations } from './joseonSlideDecks';
import { buildCreationPrompt, emptyParts, newCard } from './model';

/** The question number the Gemini prompt tells the AI to answer wrongly for this group. */
function wrongNumberInPrompt(group: number, artifactId: number) {
  const prompt = buildCreationPrompt(emptyParts(), newCard(group, artifactId), true, undefined, 'joseon');
  return Number(/(\d)번: AI가 제안한 정답은 실제 정답의 반대로/.exec(prompt)?.[1]);
}

describe('OX quiz made in advance for a lesson without internet', () => {
  it('has two questions for each of the six artifacts', () => {
    expect(quiz.artifacts.map(item => item.id)).toEqual(ARTIFACTS.map(item => item.id));
    for (const artifact of quiz.artifacts) expect(artifact.questions).toHaveLength(2);
  });

  it('gets exactly one AI answer wrong, at the place the Gemini prompt would for the group with that number', () => {
    for (const artifact of quiz.artifacts) {
      const wrong = artifact.questions.flatMap((question, index) => question.aiAnswer !== question.answer ? [index + 1] : []);
      expect(wrong, ARTIFACTS[artifact.id - 1].name).toEqual([wrongNumberInPrompt(artifact.id, artifact.id)]);
    }
  });

  it('asks only what the history newspaper says, in its own words', () => {
    for (const artifact of quiz.artifacts) {
      const reading = readings.joseon.find(item => item.id === artifact.id)!;
      for (const question of artifact.questions) {
        expect(question.statement.length).toBeLessThanOrEqual(200);
        expect(question.statement).toMatch(/^[^.]+다\.$/);
        expect(['O', 'X']).toContain(question.answer);
        expect(['O', 'X']).toContain(question.aiAnswer);
        expect(question.evidence.length).toBeGreaterThan(0);
        for (const { paragraph, quote } of question.evidence) expect(reading.paragraphs[paragraph], quote).toContain(quote);
        // A false sentence the AI called true gets a corrected sentence to present.
        if (question.answer === 'X' && question.aiAnswer === 'O') expect('revised' in question && question.revised).toMatch(/다\.$/);
      }
    }
  });

  it('is a slide deck with a chapter for each artifact, every picture on disk', () => {
    const deck = slides['ox-backup'];
    expect(presentations.map(item => item.id)).toContain('ox-backup');
    expect(deck).toHaveLength(1 + quiz.artifacts.length * 3);
    expect(deck.flatMap(slide => 'chapter' in slide ? [slide.chapter] : [])).toEqual(ARTIFACTS.map(item => item.name));
    const questions = deck.filter(slide => 'reveals' in slide);
    expect(questions.map(slide => slide.alt)).toEqual(quiz.artifacts.flatMap(artifact => artifact.questions.map(question => expect.stringContaining(question.statement))));
    for (const slide of questions) expect(slide.reveals?.map(layer => layer.nextLabel)).toEqual(['AI 정답 보기', '검증 결과 보기']);
    for (const url of allSlideUrls()) expect(existsSync(new URL(`../../../public${url}`, import.meta.url)), url).toBe(true);
  });
});
