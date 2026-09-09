import { cheomseongdaeModel } from '../../content/three-kingdoms/arModels';
import { newStudioProject, type StudioProject } from './project';

export function samplePath(search = '') {
  const query = new URLSearchParams(search);
  query.delete('step'); query.delete('lesson'); query.delete('view');
  return `/three-kingdoms/ar-sample${query.size ? `?${query}` : ''}`;
}

/** Standalone practice content. Never inserted into a classroom or a saved draft. */
export function newSampleProject(): StudioProject {
  const project = newStudioProject(1, 3);
  project.ar.model = cheomseongdaeModel();
  project.ar.points = [
    { id: 'sample-time', title: '언제 만들었나요?', text: '첨성대는 신라 선덕여왕 때 세운 것으로 본다.', position: [0, .8, .175], photoPosition: [.5, .2] },
    { id: 'sample-material', title: '무엇으로 만들었나요?', text: '다듬은 돌을 층층이 쌓아 만든 건축물이다.', position: [0, .3, .275], photoPosition: [.5, .7] },
    { id: 'sample-use', title: '어디에 썼을까요?', text: '첨성대는 신라에서 하늘의 별 등을 살피는 데 쓴 것으로 설명된다.', position: [0, .5, .21], photoPosition: [.5, .5] },
  ];
  project.ar.answerId = project.ar.points[0].id;
  project.questions = [
    { id: 'sample-question-material', prompt: '첨성대는 무엇을 층층이 쌓아 만들었나요?', options: ['돌', '나무', '흙'], answer: 0, pointId: 'sample-material' },
    { id: 'sample-question-use', prompt: '자료에서는 첨성대가 어떤 활동과 관련 있다고 설명하나요?', options: ['곡식 보관하기', '하늘의 별 살피기', '배 만들기'], answer: 1, pointId: 'sample-use' },
  ];
  project.modelChecked = project.pointsChecked = true;
  return project;
}
