import type { ExhibitPoint } from '../../lib/ar/exhibit';

/** 학생들이 조사하여 작성했다고 가정한 수업 시뮬레이션용 설명점입니다. */
export const goryeoCardPoints: Record<string, [ExhibitPoint, ExhibitPoint, ExhibitPoint]> = {
  buddha: [
    { id: 'buddha-1', title: '돌로 만든 보살상', text: '이 유물은 돌로 만든 미륵보살상이에요. 논산 관촉사에 있고 은진미륵이라고도 불러요.', position: [-.16, .78, .12], photoPosition: [.32, .22] },
    { id: 'buddha-2', title: '아주 큰 크기', text: '높이는 약 18m예요. 사람보다 훨씬 커서 멀리서도 잘 보여요.', position: [.16, .52, .12], photoPosition: [.68, .5] },
    { id: 'buddha-3', title: '고려 불상의 특징', text: '대범한 모습에서 고려 초기 불교 예술과 지방의 특징을 살펴볼 수 있어요.', position: [-.16, .25, .12], photoPosition: [.32, .78] },
  ],
  type: [
    { id: 'type-1', title: '무엇으로 만들었을까?', text: '금속활자는 나무가 아닌 금속으로 만든 글자예요. 구리나 쇠 등을 재료로 썼어요.', position: [-.25, .78, .22], photoPosition: [.25, .25] },
    { id: 'type-2', title: '글자를 살펴봐요', text: '활자 하나에 글자 하나가 있어요. 필요한 글자들을 골라 나란히 놓을 수 있어요.', position: [.25, .52, .22], photoPosition: [.75, .5] },
    { id: 'type-3', title: '책을 찍어요', text: '글자를 모아 잉크를 묻히고 종이에 찍어 책을 인쇄할 때 사용했어요.', position: [-.25, .25, .22], photoPosition: [.25, .75] },
  ],
  tripitaka: [
    { id: 'tripitaka-1', title: '나무로 만든 판', text: '팔만대장경을 찍는 대장경판은 금속판이 아니라 나무판이에요.', position: [-.38, .25, .04], photoPosition: [.2, .3] },
    { id: 'tripitaka-2', title: '판에 새긴 내용', text: '나무판에 불교 경전을 새겼어요. 이 판에 먹을 묻혀 종이에 찍어 냈어요.', position: [0, .31, .04], photoPosition: [.5, .55] },
    { id: 'tripitaka-3', title: '어디에 있을까?', text: '경판이 8만여 장이나 되어 팔만대장경이라고 불러요. 지금은 해인사 장경판전에 보관돼요.', position: [.38, .25, .04], photoPosition: [.8, .3] },
  ],
  vase: [
    { id: 'vase-1', title: '매병의 모양과 쓰임', text: '입구가 좁고 어깨가 넓은 병이에요. 매병은 술을 담아 두는 데 쓰기도 했어요.', position: [-.24, .83, .18], photoPosition: [.27, .22] },
    { id: 'vase-2', title: '구름과 학 무늬', text: '몸통에 구름과 학 무늬가 있어요. ‘운학문’은 구름과 학을 뜻해요.', position: [.26, .54, .23], photoPosition: [.72, .5] },
    { id: 'vase-3', title: '상감 기법', text: '표면에 무늬를 새긴 뒤 다른 색의 흙을 채워 넣어 선명한 무늬를 만들었어요.', position: [-.22, .28, .19], photoPosition: [.3, .75] },
  ],
  incense: [
    { id: 'incense-1', title: '구멍이 뚫린 뚜껑', text: '뚜껑의 칠보무늬를 뚫어서 만들었어요. 이렇게 무늬를 뚫어 표현하는 것을 투각이라고 해요.', position: [-.24, .78, .2], photoPosition: [.27, .25] },
    { id: 'incense-2', title: '향을 피우는 그릇', text: '향로는 향을 태울 때 사용하는 도구예요. 향을 피우면 뚜껑의 구멍으로 향이 올라와요.', position: [.26, .48, .25], photoPosition: [.73, .52] },
    { id: 'incense-3', title: '고려청자의 색', text: '은은한 푸른빛의 청자로 만들었어요. 몸통과 받침, 뚜껑을 함께 살펴보세요.', position: [-.24, .2, .2], photoPosition: [.27, .8] },
  ],
  lacquer: [
    { id: 'lacquer-1', title: '경전을 담는 함', text: '고려 사람들이 불교 경전을 담아 보관하려고 만든 상자예요.', position: [-.35, .38, .22], photoPosition: [.2, .3] },
    { id: 'lacquer-2', title: '반짝이는 자개', text: '조개껍데기 안쪽을 얇게 갈아 무늬대로 오려 붙이는 장식 기법을 나전이라고 해요.', position: [0, .52, .22], photoPosition: [.5, .5] },
    { id: 'lacquer-3', title: '꽃과 넝쿨 무늬', text: '검게 칠한 표면에 자개와 금속 선을 이용해 모란꽃과 넝쿨 무늬를 장식했어요.', position: [.35, .27, .22], photoPosition: [.8, .75] },
  ],
};
