import { worksheetsForEra } from '../content/heritageCatalog';
import type { EraId } from '../types/curriculum';

export function WorksheetSteps({ lessonId, eraId = "three-kingdoms" }: { lessonId: number; eraId?: EraId }) {
  const sheet = worksheetsForEra(eraId).find(item => item.id === lessonId);
  if (!sheet) return null;
  return <details className="project-paper worksheet-steps" open>
    <summary>활동지 순서 · {sheet.title}</summary>
    <ol>{sheet.tasks.map(task => <li key={task.title}><strong>{task.title}</strong><p>{task.instruction}</p></li>)}</ol>
    <p>종이에는 체크·숫자·핵심 낱말만 남겨요.</p>
  </details>;
}
