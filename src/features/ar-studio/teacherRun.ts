export type Actor = 'teacher' | 'student';
export interface RunStep { actor: Actor; minutes: number; title: string; detail: string; press?: string }
export interface RunLesson { id: number; name: string; minutes: number; summary: string; prepare: string[]; steps: RunStep[]; finish: string }

export const GROUP_CHOICES = [2, 3, 4, 5, 6] as const;
export const groupCountKey = 'history-ar-maker-groups';

export const runLessons: RunLesson[] = [
  {
    id: 1,
    name: 'AR 카드 만들기',
    minutes: 40,
    summary: '유물 하나에 설명·녹음을 붙이고 공유합니다.',
    prepare: ['유물 카드 6종 A4 출력', '태블릿 마이크 허용', '모둠별 이어폰'],
    steps: [
      { actor: 'teacher', minutes: 3, title: '수업코드 정하고 QR 띄우기', press: '학생 입장 QR 만들기', detail: '숫자 6자리. ‘저장 완료’ 뜨면 됩니다.' },
      { actor: 'student', minutes: 3, title: 'QR 찍고 입장', press: '수업 입장', detail: '이름과 모둠만 고르면 됩니다.' },
      { actor: 'student', minutes: 2, title: '우리 유물 고르기', press: '우리 유물', detail: '모형이 바로 열립니다.' },
      { actor: 'student', minutes: 12, title: '설명점 3~4곳 찍고 글 쓰기', press: '점 찍기·설명·녹음', detail: '번호를 고른 뒤 모형을 누르면 점이 붙습니다.' },
      { actor: 'student', minutes: 10, title: '설명점마다 녹음', detail: '하나당 30초 이내.' },
      { actor: 'student', minutes: 7, title: '문제 2~3개 만들기', press: '퀴즈 만들기', detail: '덜 만든 문제는 자동으로 빠집니다.' },
      { actor: 'student', minutes: 3, title: '모둠 대표 한 명만 공유', press: '모둠에 공유', detail: '처음 누른 태블릿이 저장 담당이 됩니다.' },
    ],
    finish: '아래 현황에서 모둠이 다 올라왔는지 확인합니다.',
  },
  {
    id: 2,
    name: '우리 반 관람회',
    minutes: 40,
    summary: '카드를 비춰 관람하고 각자 문제를 풉니다.',
    prepare: ['모둠 책상에 유물 카드 놓기', '지난 시간과 같은 수업코드', '이어폰'],
    steps: [
      { actor: 'student', minutes: 3, title: '같은 수업코드로 다시 입장', press: '수업 입장', detail: 'QR로 열어야 지난 작업이 뜹니다.' },
      { actor: 'student', minutes: 5, title: '못 올린 모둠 마무리 공유', press: '모둠에 공유', detail: '지난번 그 태블릿에서 눌러야 합니다.' },
      { actor: 'teacher', minutes: 2, title: '모둠이 다 공유됐는지 확인', detail: '아래 현황이 다 초록색이 된 뒤 시작합니다.' },
      { actor: 'student', minutes: 15, title: '카드 비추며 관람', press: 'AR 카메라로 카드 비추기', detail: '카드를 바꿔 비추면 그 유물이 나옵니다.' },
      { actor: 'teacher', minutes: 1, title: '자리로 돌려보내고 퀴즈 안내', detail: '공유가 다 끝난 뒤에 시작합니다.' },
      { actor: 'student', minutes: 10, title: '문제 풀고 제출', press: '내 답안과 활동 기록 제출', detail: '한 번만 낼 수 있습니다.' },
      { actor: 'teacher', minutes: 4, title: '정답 근거 확인하며 마무리', detail: '‘해설 다시 확인하기’로 녹음을 들려줍니다.' },
    ],
    finish: '모두 제출하면 끝입니다.',
  },
];

export interface SharingStatus { shared: number[]; missing: number[]; ready: boolean }
export function sharingStatus(groupCount: number, gallery?: { group: number }[]): SharingStatus {
  const expected = Array.from({ length: groupCount }, (_, index) => index + 1);
  const shared = expected.filter(group => gallery?.some(work => work.group === group));
  const missing = expected.filter(group => !shared.includes(group));
  // Groups beyond the class size may still have shared; they never block the quiz.
  return { shared, missing, ready: gallery !== undefined && missing.length === 0 };
}
export function readGroupCount(storage?: Pick<Storage, 'getItem'>) {
  const value = Number(storage?.getItem(groupCountKey));
  return GROUP_CHOICES.includes(value as (typeof GROUP_CHOICES)[number]) ? value : 6;
}
