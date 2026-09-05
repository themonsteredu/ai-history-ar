export interface CodapTutorialStep {
  id: string;
  title: string;
  action: string;
  screenLabel: string;
  classroomLabel: string;
  check: string;
  help: string;
  screenshot: string;
  source: { label: string; href: string };
}

const source = (path: string) => ({ label: 'CODAP 공식 도움말 화면', href: `https://codap.concord.org/how-to/${path}/` });

// These are official help screenshots, not captures of a student's work or a
// claim that the current live app was photographed. Keep that distinction visible.
export const codapTutorial: readonly CodapTutorialStep[] = [
  {
    id: 'import', title: '우리 표 파일을 불러와요',
    action: '왼쪽 위 ≡ 메뉴에서 Import를 누르고, Local File에서 우리 CSV 파일을 골라요.',
    screenLabel: 'Import → Local File', classroomLabel: '웹앱에서 받은 ‘고친 표’ CSV 파일',
    check: '우리 표의 문장과 맨 위 항목 이름이 보이나요?',
    help: '시작 화면이 나오면 Create New Document를 먼저 눌러요. 파일은 기기의 다운로드 폴더에서 찾아요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/07/import_local_file.gif',
    source: source('import-data-from-a-csv-codap-or-txt-file'),
  },
  {
    id: 'graph', title: 'Graph를 눌러 그래프 창을 열어요',
    action: '위쪽 도구 줄에서 Graph를 눌러요.',
    screenLabel: 'Graph', classroomLabel: '지금은 점이 흩어져 있어도 괜찮아요.',
    check: '표 옆에 점들이 있는 그래프 창이 생겼나요?',
    help: '표가 먼저 열려 있어야 해요. 창이 겹치면 창 위쪽 제목 부분을 잡아 옮겨요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/09/graphs-1.gif',
    source: source('getting-started-with-graphs'),
  },
  {
    id: 'axis', title: '표의 항목 이름을 아래쪽으로 옮겨요',
    action: '표 맨 위의 ‘살펴본항목’을 잡아 그래프 아래쪽 가로축에 놓아요.',
    screenLabel: '표 맨 위 항목 이름 → 그래프 아래쪽', classroomLabel: '우리 표에서는 ‘살펴본항목’을 골라요.',
    check: '그래프 아래에 ‘시기·발견’, ‘재료·구조’ 같은 이름이 보이나요?',
    help: '칸 안의 문장이 아니라 맨 위 제목을 잡아요. 중앙에 놓았다면 아래쪽 가로축에 다시 놓아요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/09/graphs-3.png',
    source: source('getting-started-with-graphs'),
  },
  {
    id: 'count', title: 'Count를 켜서 개수를 보여 줘요',
    action: '그래프를 누른 뒤 오른쪽 자 모양 도구에서 Count를 체크해요.',
    screenLabel: '자 모양 도구 → Count', classroomLabel: 'Count는 ‘개수’라는 뜻이에요.',
    check: '종류마다 숫자가 보이나요? 숫자를 더하면 우리 표의 문장 수와 같나요?',
    help: '오른쪽 도구가 안 보이면 그래프 안을 한 번 눌러요. 처음에는 가로축에만 항목을 놓아요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/08/add-the-counts-1024x589.png',
    source: source('add-counts-percentages-to-categorical-attribute-graphs'),
  },
  {
    id: 'bars', title: '점을 막대로 바꿔 비교해요',
    action: '오른쪽 그래프 설정 도구에서 Fuse Dots into Bars를 골라요.',
    screenLabel: 'Fuse Dots into Bars', classroomLabel: '점들을 모아 막대로 보여 주는 기능이에요.',
    check: '점이 막대로 바뀌어도 종류별 문장 수는 그대로인가요?',
    help: '메뉴가 다르면 점 그래프에 개수를 표시한 상태로 진행해도 돼요. 막대의 길이는 우리가 고른 문장 수예요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/08/DotsToBars.gif',
    source: source('fuse-dots-into-bars-create-a-stacked-bar-chart-and-use-a-formula-to-determine-bar-length'),
  },
  {
    id: 'export', title: '그래프를 그림 파일로 저장해요',
    action: '그래프 오른쪽 그림 모양 도구를 누르고 Export as PNG Image를 골라요.',
    screenLabel: '그림 모양 도구 → Export as PNG Image', classroomLabel: 'PNG는 웹앱에 넣을 그림 파일이에요.',
    check: '파일 이름과 저장할 곳을 고르는 창이 열렸나요?',
    help: '도구가 안 보이면 그래프 안을 눌러요. SVG 대신 PNG를 골라야 우리 웹앱에서 열 수 있어요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/08/Picture-icon.png',
    source: source('save-an-image-of-a-codap-graph'),
  },
  {
    id: 'download', title: '모둠 이름을 적고 Download를 눌러요',
    action: 'Filename에 모둠 이름을 적고, Local File에서 Download를 눌러요.',
    screenLabel: 'Filename → Local File → Download', classroomLabel: '이름 예: 1모둠_문장종류',
    check: '다운로드 폴더에 .png로 끝나는 그림 파일이 있나요?',
    help: '우리 웹앱으로 돌아가 ‘3. 그래프 그림 가져오기’에서 이 PNG를 골라요. 제목을 적고 ‘오늘 작업 저장하기’도 눌러요.',
    screenshot: 'https://codap.concord.org/wp-content/uploads/2024/08/export-file-as.png',
    source: source('save-an-image-of-a-codap-graph'),
  },
];
