export interface Artifact { id: number; key: string; name: string; hanja: string; kind: string; look: string[]; teacherNote: string }

/** The six Joseon science artifacts of the open lesson. `look` gives students places to observe, never the answers. */
export const ARTIFACTS: Artifact[] = [
  { id: 1, key: 'cheugugi', name: '측우기', hanja: '測雨器', kind: '비의 양을 재는 기구',
    look: ['비를 받는 그릇은 어떤 모양일까요?', '그릇을 올려 둔 받침은 무엇으로 만들었을까요?', '빗물의 깊이는 무엇으로 쟀을까요?'],
    teacherNote: '세종 때(1441년 무렵) 만들어 전국에 두고 비의 양을 기록했어요. 쇠 그릇을 돌 받침(측우대)에 올리고 자(주척)로 빗물 깊이를 쟀어요.' },
  { id: 2, key: 'jagyeongnu', name: '자격루', hanja: '自擊漏', kind: '스스로 시각을 알리는 물시계',
    look: ['물은 어디에서 어디로 흘러갈까요?', '시간이 되면 무엇이 소리를 낼까요?', '왜 높이가 다른 항아리를 여러 개 썼을까요?'],
    teacherNote: '1434년 장영실 등이 만든 물시계예요. 물이 일정하게 흘러 잣대가 떠오르면 장치가 움직여 인형이 종·북·징을 울렸어요. 지금 남은 것은 중종 때(1536년) 다시 만든 것의 일부예요.' },
  { id: 3, key: 'ganui', name: '간의', hanja: '簡儀', kind: '별과 해의 위치를 재는 관측 기구',
    look: ['둥근 고리는 몇 개이고 어떤 방향으로 놓였을까요?', '하늘을 볼 때 어느 부분으로 들여다볼까요?', '혼천의와 비교하면 무엇이 더 간단할까요?'],
    teacherNote: '세종 때(1432년 무렵) 만든 천문 관측 기구로, 혼천의를 간단하게 만들었다는 뜻의 이름이에요. 경복궁 간의대에 두고 해와 별의 위치를 관측했어요.' },
  { id: 4, key: 'angbuilgu', name: '앙부일구', hanja: '仰釜日晷', kind: '솥 모양 해시계',
    look: ['그릇은 무엇을 닮았을까요?', '그림자를 만드는 바늘은 어디에 있을까요?', '안쪽의 가로줄과 세로줄은 무엇을 알려 줄까요?'],
    teacherNote: '1434년 무렵 만든 해시계로, 하늘을 우러러보는 솥이라는 뜻이에요. 바늘(영침) 그림자로 시각과 절기를 알았고, 길가에 두어 백성도 볼 수 있게 했어요.' },
  { id: 5, key: 'honcheonui', name: '혼천의', hanja: '渾天儀', kind: '해·달·별의 움직임을 보는 천문 기구',
    look: ['고리가 여러 겹으로 겹친 까닭은 무엇일까요?', '가운데에는 무엇이 있을까요?', '고리를 돌리면 무엇을 알 수 있을까요?'],
    teacherNote: '세종 때(1433년 무렵) 만든 천문 기구로, 여러 겹의 고리로 해·달·별의 위치와 움직임을 살폈어요. 현종 때(1669년) 송이영이 만든 혼천시계도 남아 있어요.' },
  { id: 6, key: 'nongsajikseol', name: '농사직설', hanja: '農事直說', kind: '우리 땅에 맞는 농사법을 모은 책',
    look: ['책은 어떤 글자로 썼을까요?', '누구에게 물어보고 내용을 모았을까요?', '이 책으로 농사가 어떻게 달라졌을까요?'],
    teacherNote: '1429년 세종 때 정초 등이 펴낸 농사책이에요. 각 지방의 경험 많은 농부에게 물어 우리 땅과 기후에 맞는 농사법을 한문으로 정리했어요.' },
];
export const artifactById = (id: number) => ARTIFACTS.find(item => item.id === id);
