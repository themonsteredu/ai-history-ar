export const arLessons = [
  { id: 4, title: '기본 도형으로 유물 모형 만들기', goal: '사진을 관찰하고 도형의 크기·위치를 바꿔 학습용 모형을 만들어요.', finish: '모형을 돌려 보고, 유물의 특징을 한 곳 이상 표현했는지 확인해요.', step: 'model',
    segments: [{ minutes: 5, title: '모양 관찰', detail: '우리 모둠 유물 사진에서 큰 모양과 특징을 찾아요.' }, { minutes: 8, title: '교사 설명·시범', detail: '도형 넣기 → 크기 바꾸기 → 위치 옮기기를 보여 줘요.' }, { minutes: 22, title: '모둠 모형 제작', detail: '도형을 쌓고 돌려 보며 우리 모둠 모형을 만들어요.' }, { minutes: 5, title: '확인·저장', detail: '실제 유물 사진과 비교한 뒤 모형을 저장해요.' }],
    theory: ['입체모형은 앞·옆·위에서 볼 수 있어요. 사진은 한 방향에서 본 모습이에요.', '네모·원기둥·고리를 조합해 큰 모양을 표현해요. 정교한 복원보다 관찰한 특징이 중요해요.', '먼저 도형을 고르고, 크기를 바꾸고, 위치를 옮겨요. 돌아가며 한 가지씩 조작해요.', '만든 모형은 학습용 표현이에요. 실제 유물과 다른 부분도 설명할 수 있어야 해요.'] },
  { id: 5, title: '해설 녹음과 전시 문제 만들기', goal: '확인한 근거로 해설 3개와 문제 2개를 만들어요. 여유가 있으면 하나씩 추가해요.', finish: '녹음을 들어 보고, 모든 문제의 답이 해설에 있는지 확인해요.', step: 'narration',
    segments: [{ minutes: 8, title: '근거·역할 정하기', detail: '확인한 내용을 3~4개로 나누고 설명할 곳을 정해요.' }, { minutes: 16, title: '해설 붙이기·녹음', detail: '모형에 설명점을 놓고 각 30초 안으로 녹음해요.' }, { minutes: 11, title: '문제 2~3개 만들기', detail: '해설에서 답을 찾을 수 있는 보기 3개의 문제를 만들어요.' }, { minutes: 5, title: '듣기·제출', detail: '해설과 정답을 점검한 뒤 모둠 작품을 제출해요.' }],
    theory: ['설명점은 관람객에게 보여 주고 싶은 곳이에요. 모형을 눌러 위치를 정해요.', '모양·재료와 방법·쓰임·특징 중 자료로 확인한 내용을 골라요. 없는 내용을 채우지 않아요.', '마이크를 허용하고 한 명씩 또박또박 녹음해요. 녹음 중에는 배경음과 효과음이 멈춰요.', '문제에는 서로 다른 보기 3개와 정답 하나가 있어요. 어느 해설에서 확인하는지도 지정해요.'] },
  { id: 6, title: '우리 반 AR 박물관과 개인 퀴즈', goal: '모둠 전시를 관람한 뒤 해설을 근거로 각자 문제를 풀어요.', finish: '개인 답안과 내가 맡은 역할·배운 점을 남겨요.', step: 'gallery',
    segments: [{ minutes: 5, title: '관람 준비', detail: '수업코드·태블릿·이어폰·출력 카드를 확인해요.' }, { minutes: 15, title: '모둠 전시 관람', detail: '카드를 비춰 작품을 찾고 모형과 해설을 관람해요.' }, { minutes: 12, title: '개인 퀴즈', detail: '자리로 돌아와 각자 답을 골라요. 필요하면 해설을 다시 들어요.' }, { minutes: 8, title: '정답·활동 돌아보기', detail: '내 역할·배운 점과 답안을 제출해요. 선생님이 마감한 뒤 정답의 근거를 확인해요.' }],
    theory: ['AR은 카메라 화면 속 실제 카드 위에 디지털 모형을 겹쳐 보여 줘요.', '수업에 들어와 AR 카메라를 열어요. 유물 카드를 바꿔 비추고 설명점을 눌러요. 같은 카드를 쓰는 모둠은 선택해서 관람해요.', '관람이 끝나면 자리에 앉아요. 선생님이 퀴즈를 시작한 뒤 각자 답해요.', '해설을 다시 확인해도 괜찮아요. 정답을 맞힌 근거와 내가 맡은 일을 남겨요.'] },
] as const;
export function studioPath(search: string, step = 'model', teacher = false, lesson = 4) {
  const params = new URLSearchParams(search); params.delete('view'); params.set('step', step); params.set('lesson', String(lesson));
  return `${teacher ? '/teacher' : ''}/three-kingdoms/ar-studio?${params}`;
}
