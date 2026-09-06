import worksheets from '../content/three-kingdoms/worksheet-guide.json';

export function WorksheetSteps({ lessonId }: { lessonId: number }) {
  const sheet = worksheets.find(item => item.id === lessonId);
  if (!sheet) return null;
  return <details className="project-paper worksheet-steps" open>
    <summary>활동지 순서 · {sheet.title}</summary>
    <ol>{sheet.tasks.map(task => <li key={task.title}><strong>{task.title}</strong><p>{task.instruction}</p></li>)}</ol>
    <p>종이에는 체크·숫자·핵심 낱말만 남겨요.</p>
  </details>;
}
