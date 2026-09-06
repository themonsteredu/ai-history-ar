# CODAP 화면 따라하기

학생이 외부 사이트에서 혼자 사용법을 추측하지 않도록, 그래프 수업의 웹 PPT와 학생 활동에 같은 7단계 안내를 사용한다.

- 원본 안내: `src/content/three-kingdoms/codapTutorial.ts`
- 공통 화면: `src/components/CodapTutorial.tsx`
- 수업 PPT: 그래프 수업(현재 콘텐츠 ID 6), 활동 전 7장. ‘CODAP 따라하기부터 보기’로 바로 이동한다.
- 학생 화면: ‘화면을 보며 CODAP 따라하기’를 열고 이전·다음 또는 단계 선택으로 이동한다.
- 수업 진행: 한 장을 보여 주고 학생이 직접 조작한 뒤, 다음 내용 공개로 완료 질문을 확인한다.

## 단계

1. Import → Local File에서 지난 수업의 CSV 불러오기
2. Graph로 그래프 창 열기
3. 우리 표의 `살펴본항목`을 가로축으로 옮기기
4. 자 모양 도구의 Count로 문장 개수 확인
5. Fuse Dots into Bars로 막대와 점의 개수가 같은지 비교 (선택)
6. Export as PNG Image 선택
7. Local File → Download, 웹앱에 PNG 가져오기, 오늘 작업 저장하기

## 이미지 출처와 확인 범위

이 안내는 CODAP 공식 도움말에 공개된 실제 화면 이미지·GIF를 원래 주소로 연결한다. 직접 촬영한 최신 학생 화면으로 표시하지 않는다. 캡처 안의 예시 데이터와 우리 수업에서 골라야 할 항목을 따로 설명한다. 원문 출처 링크는 각 장에 표시한다.

이번 작업 환경에서는 캡처 브라우저의 CDP 연결이 반복해서 실패했다. 이미지 내려받기도 현재 네트워크에서 완료되지 않아 로컬 이미지나 독립 PPTX를 만들지 않았다. 따라서 외부 이미지 로딩과 실제 화면 배치는 브라우저에서 확인하지 못했다. 오류 시 빈 그림 대신 공식 도움말로 연결하는 안내를 제공한다.

인터넷 연결이 필요한 웹 PPT용 안내이며, 오프라인 내장 캡처로 포장하지 않는다. 수업용 실제 화면 촬영과 이미지 내장은 연결 복구 후 남은 작업이다. 화면 확인 없이 이미지 자리나 화살표 좌표를 임의로 만들지 않는다.

공식 출처:

- https://codap.concord.org/how-to/import-data-from-a-csv-codap-or-txt-file/
- https://codap.concord.org/how-to/getting-started-with-graphs/
- https://codap.concord.org/how-to/add-counts-percentages-to-categorical-attribute-graphs/
- https://codap.concord.org/how-to/fuse-dots-into-bars-create-a-stacked-bar-chart-and-use-a-formula-to-determine-bar-length/
- https://codap.concord.org/how-to/save-an-image-of-a-codap-graph/
