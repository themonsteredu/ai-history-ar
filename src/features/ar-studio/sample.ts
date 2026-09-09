import { researchForEra } from '../../content/heritageCatalog';
import type { ModelPart } from '../../lib/ar/primitives';
import { newStudioProject, type StudioProject } from './project';

export function samplePath(search = '') {
  const query = new URLSearchParams(search);
  query.delete('step'); query.delete('lesson'); query.delete('view');
  return `/three-kingdoms/ar-sample${query.size ? `?${query}` : ''}`;
}

/** Standalone practice content. Never inserted into a classroom or a saved draft. */
export function newSampleProject(): StudioProject {
  const project = newStudioProject(1, 3);
  const heritage = researchForEra('three-kingdoms').find(item => item.id === 3)!;
  const parts: ModelPart[] = [];
  function part(id: string, kind: ModelPart['kind'], position: ModelPart['position'], scale: ModelPart['scale'], color = '#bbaa8b') {
    parts.push({ id, kind, position, scale, color, rotation: [0, 0, 0] });
  }
  part('sample-base', 'box', [0, .07, 0], [.7, .14, .7]);
  for (let i = 0; i < 12; i++) {
    const width = .5 - Math.sin(i / 11 * Math.PI / 2) * .17;
    part(`sample-stone-${i}`, 'cylinder', [0, .14 + (i + .5) * .065, 0], [width, .064, width], i % 2 ? '#bcad92' : '#cbbb9e');
  }
  part('sample-window', 'box', [0, .48, .195], [.10, .12, .05], '#40382d');
  part('sample-top-left', 'box', [-.205, .975, 0], [.075, .11, .49]);
  part('sample-top-right', 'box', [.205, .975, 0], [.075, .11, .49]);
  part('sample-top-front', 'box', [0, .975, .205], [.49, .11, .075]);
  part('sample-top-back', 'box', [0, .975, -.205], [.49, .11, .075]);
  project.ar.model = { format: 'primitives', data: '', parts, rotation: [0, 0, 0], name: '첨성대 AR 연습용 모형', credit: '기본 도형으로 만든 학습용 예제 모형', source: heritage.sources[0].href };
  project.ar.points = [
    { id: 'sample-time', title: '언제 만들었나요?', text: '첨성대는 신라 선덕여왕 때 세운 것으로 본다.', position: [0, .91, .24], photoPosition: [.5, .2] },
    { id: 'sample-material', title: '무엇으로 만들었나요?', text: '다듬은 돌을 층층이 쌓아 만든 건축물이다.', position: [.12, .31, .21], photoPosition: [.5, .7] },
    { id: 'sample-use', title: '어디에 썼을까요?', text: '첨성대는 신라에서 하늘의 별 등을 살피는 데 쓴 것으로 설명된다.', position: [0, .52, .21], photoPosition: [.5, .5] },
  ];
  project.ar.answerId = project.ar.points[0].id;
  project.questions = [
    { id: 'sample-question-material', prompt: '첨성대는 무엇을 층층이 쌓아 만들었나요?', options: ['돌', '나무', '흙'], answer: 0, pointId: 'sample-material' },
    { id: 'sample-question-use', prompt: '자료에서는 첨성대가 어떤 활동과 관련 있다고 설명하나요?', options: ['곡식 보관하기', '하늘의 별 살피기', '배 만들기'], answer: 1, pointId: 'sample-use' },
  ];
  project.modelChecked = project.pointsChecked = true;
  return project;
}
