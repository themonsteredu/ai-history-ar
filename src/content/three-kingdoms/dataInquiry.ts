import slides from './data-inquiry-slides.json';

const base = import.meta.env.BASE_URL;
const materials = `${base}downloads/three-kingdoms/data-inquiry/`;
export const dataInquiryFiles = {
  ppt: `${materials}teaching.pptx`,
  students: `${materials}student-all.pdf`,
  teacher: `${materials}teacher-guide.pdf`,
  bundle: `${materials}data-inquiry-all.zip`,
};
export const dataInquirySessions = [
  {
    id: 1, title: 'AI·데이터 이해와 자료조사',
    objective: 'AI의 답을 자료로 확인하고, 기존 조사 내용에서 근거 문장과 출처를 정리해요.',
    range: [1, 9], timing: '이론 10분 · 조사 내용 정리 25분 · 공유 5분',
    steps: ['우리 문화유산과 조사 질문을 확인해요.', '기존 자료를 읽고 짧은 근거 문장과 출처를 남겨요.', '친구와 원문을 대조하고, 미확인 내용은 보류해요.'],
    takeaway: '이미 조사한 자료부터 사용합니다. 문장 수를 맞추려고 새로 만들지 않아요.',
  },
  {
    id: 2, title: '문장을 표로 정리·정제하기',
    objective: '한 행에 한 가지 사실을 놓고, 종류 이름·중복·출처를 점검해요.',
    range: [10, 18], timing: '이론 10분 · 표 정리·정제 25분 · 제출 5분',
    steps: ['1차시의 확인한 문장을 한 행씩 옮겨요.', '이야기종류를 통일하고, 같은 사실과 빈칸을 점검해요.', '검토한 표와 출처 목록을 선생님께 제출해요.'],
    takeaway: '모둠에서는 정제 표만 준비합니다. 모둠별 그래프는 만들지 않아요.',
  },
  {
    id: 3, title: '학급 전체 그래프 만들고 읽기',
    objective: '1~6모둠의 자료를 한 표로 합쳐, 종류별 문장 수를 그래프로 설명해요.',
    range: [19, 27], timing: '이론 8분 · 통합 확인·그래프 22분 · 해석·저장 10분',
    steps: ['학급 통합 표의 종류별 개수와 합계를 확인해요.', 'CODAP에서 이야기종류를 가로축으로 옮겨 막대그래프를 만들어요.', '같은 그래프를 보고 설명한 뒤 파일로 저장해요.'],
    takeaway: '문장 수는 조사 내용의 구성입니다. 유산이나 나라의 우열을 뜻하지 않아요.',
  },
] as const;

export function getDataInquirySession(value: string | undefined) {
  return dataInquirySessions.find(session => String(session.id) === value);
}
export function dataInquirySlides(sessionId: number) {
  const session = dataInquirySessions.find(item => item.id === sessionId);
  return session ? slides.filter(slide => slide.number >= session.range[0] && slide.number <= session.range[1]) : [];
}
export function dataInquirySlideImage(number: number) {
  return `${base}images/three-kingdoms/data-inquiry/slide-${number}.png`;
}
export function dataInquiryWorksheet(sessionId: number) {
  return `${materials}student-${sessionId}.pdf`;
}
export function dataInquiryPath(sessionId: number, view = 'start', currentSearch = '') {
  const params = new URLSearchParams(currentSearch);
  params.delete('view');
  if (view !== 'start') params.set('view', view);
  return `/three-kingdoms/data/${sessionId}${params.size ? `?${params}` : ''}`;
}
