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
    summary: '모둠마다 유물 하나를 골라 설명점·설명·녹음을 붙이고, 우리 문제까지 만들어 공유합니다.',
    prepare: [
      '유물 카드 6종을 A4로 출력해 둡니다. (아래 ‘사진 카드 출력’)',
      '태블릿에서 마이크 사용을 허용해 둡니다. 녹음이 안 되면 대부분 이 설정입니다.',
      '이어폰을 모둠마다 하나씩 준비합니다.',
      '첨성대를 맡을 모둠이 있으면 미리 한 번 열어 둡니다. 처음 한 번 36MB를 내려받습니다.',
    ],
    steps: [
      { actor: 'teacher', minutes: 3, title: '수업코드를 정하고 QR을 띄웁니다', press: '학생 입장 QR 만들기', detail: '숫자 6자리(예: 오늘 날짜)를 입력하면 자동 저장됩니다. ‘수업코드 저장 완료’가 뜬 뒤 QR을 화면에 띄워 주세요.' },
      { actor: 'student', minutes: 3, title: '태블릿 카메라로 QR을 찍고 입장합니다', press: '수업 입장', detail: '이름 또는 별명과 내 모둠을 고르면 끝입니다. 계정은 없습니다.' },
      { actor: 'student', minutes: 2, title: '우리 모둠 유물을 고릅니다', press: '우리 유물', detail: '고르면 준비된 입체 모형이 바로 열립니다. 도형을 조립할 필요는 없습니다.' },
      { actor: 'student', minutes: 12, title: '설명점 3~4곳을 찍고 설명을 씁니다', press: '점 찍기·설명·녹음', detail: '번호를 고른 뒤 모형을 짧게 누르면 점이 붙습니다. 손가락으로 끌면 모형이 돌아갑니다.' },
      { actor: 'student', minutes: 10, title: '설명점마다 목소리를 녹음합니다', detail: '하나당 30초를 넘기지 않게 해 주세요. 작품 전체가 4MB를 넘으면 공유가 실패합니다.' },
      { actor: 'student', minutes: 7, title: '우리 모둠 문제 2~3개를 만듭니다', press: '퀴즈 만들기', detail: '보기 3개에 정답 하나, 답을 확인할 해설까지 골라 줍니다. 덜 만든 문제는 반 퀴즈에서 자동으로 빠집니다.' },
      { actor: 'student', minutes: 3, title: '모둠 대표 한 명만 공유합니다', press: '모둠에 공유', detail: '처음 누른 태블릿이 그 모둠의 저장 담당이 됩니다. 다른 친구가 눌러도 저장되지 않습니다.' },
    ],
    finish: '아래 공유 현황에서 우리 반 모둠이 모두 올라왔는지 확인하고 마칩니다. 못 올린 모둠은 2차시 시작에 마무리합니다.',
  },
  {
    id: 2,
    name: '우리 반 관람회',
    minutes: 40,
    summary: '출력한 카드를 비춰 다른 모둠 작품을 관람하고, 자리로 돌아와 각자 문제를 풉니다.',
    prepare: [
      '모둠 책상마다 그 모둠의 유물 카드를 놓습니다.',
      '지난 시간과 같은 수업코드를 준비합니다. 90일 동안 이어 쓸 수 있습니다.',
      '이어폰을 나눠 줍니다. 녹음을 들어야 문제를 풀 수 있습니다.',
    ],
    steps: [
      { actor: 'student', minutes: 3, title: '지난 시간과 같은 수업코드로 다시 입장합니다', press: '수업 입장', detail: '같은 태블릿이면 대부분 그대로 이어집니다.' },
      { actor: 'student', minutes: 5, title: '아직 못 올린 모둠이 마무리해 공유합니다', press: '모둠에 공유', detail: '지난 시간에 공유한 태블릿에서 눌러야 저장됩니다.' },
      { actor: 'teacher', minutes: 2, title: '모둠이 모두 공유됐는지 확인합니다', detail: '가장 중요한 확인입니다. 아래 공유 현황이 전부 초록색이 된 뒤에 관람을 시작해 주세요.' },
      { actor: 'student', minutes: 15, title: '카드를 비추며 다른 모둠을 관람합니다', press: 'AR 카메라로 카드 비추기', detail: '‘우리 반 전시·퀴즈’를 연 뒤 카메라를 켭니다. 카드를 바꿔 비추면 그 유물의 작품을 찾습니다.' },
      { actor: 'teacher', minutes: 1, title: '자리로 돌아오게 하고 퀴즈를 안내합니다', detail: '공유가 끝난 뒤에 풀어야 합니다. 퀴즈 도중에 새로 공유하는 모둠이 있으면 문제가 늘어나 제출이 막힙니다.' },
      { actor: 'student', minutes: 10, title: '각자 문제를 풀고 활동 기록을 제출합니다', press: '내 답안과 활동 기록 제출', detail: '답 + 내가 맡은 일 + 배운 점을 모두 채워야 제출됩니다. 제출하면 바로 채점되고 다시 풀 수 없습니다.' },
      { actor: 'teacher', minutes: 4, title: '정답의 근거를 함께 확인하며 마칩니다', detail: '학생 화면의 ‘해설 다시 확인하기’로 그 모둠의 녹음을 다시 들려줄 수 있습니다.' },
    ],
    finish: '모든 학생이 답안과 활동 기록을 제출하면 끝입니다.',
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
