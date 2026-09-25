# 인공지능과 역사 홍보영상

- `ai-history-ar-promo.mp4` — 1920×1080, 30fps, 약 54초, 배경음악 + 하단 자막 포함
- `ai-history-ar-promo.srt` — 자막 파일 (유튜브 등에 따로 올릴 때 사용)
- `source/` — 다시 만들 때 쓰는 녹화·편집 스크립트 (앱 배포에는 포함되지 않음)

## 영상에 나오는 장면

모든 장면은 이 앱을 **내 컴퓨터(로컬)에서 실행해 실제로 녹화한 화면**입니다. 학급 서버나 외부 서비스에는 접속하지 않았습니다.

1. 시작 화면 — “오늘, 우리 반이 문화유산 해설사가 됩니다” (앱 첫 화면의 수묵화 그림 사용)
2. STEP 1 의심하기 — 조선시대 2차시 수업 PPT와 “AI가 한 말 판단하기”(○ × △ ?) 활동
3. STEP 2 확인하고 정리하기 — 5차시 우리 표 고치기 (예시 표로 시작 → 같은 종류끼리 모으기)
4. STEP 2 그래프 만들기 — 6차시 “이 표로 그래프 만들기”
5. STEP 3 해설사 되기 — AR 만들기에서 백제 금동대향로 3D 모형을 돌리고 해설 쓰기 → 내 작품 체험
6. AR 예제 체험 — 첨성대 3D 모형을 돌려 보고 1·2·3번 해설 보기
7. 12가지 문화유산 — 삼국시대 6곳 · 조선시대 6곳 (앱에 들어 있는 사진)
8. 선생님 화면 — PIN 잠금 교사 화면과 활동지 다운로드 센터
9. 마무리 — 앱 이름, 한 줄 소개, 주소 ai-history-ar.vercel.app

배경음악은 컴퓨터로 직접 만든 곡이라 저작권 걱정 없이 쓸 수 있습니다.

## 다시 만들 때 (개발 도구 필요)

1. 앱 폴더에서 `pnpm install` → `pnpm dev --port 5173`
2. 작업 폴더에서 `npm i playwright@1.56.1`, `pip install imageio-ffmpeg numpy`
3. `node go.mjs judge|table|graph|teacher` 로 녹화, 3D 장면은 `DPR=1 node go.mjs maker|sample`
4. `./extract.sh ppt judge table graph maker sample teacher` 로 프레임 추출 (`work/meta.js` 생성)
5. `work/assets/`에 앱의 `public/fonts/SCDream5~8.otf`, `public/images/home-cover-ink-v2.jpg`, `public/images/heritage/`를 복사
6. `python3 music.py 54.4` → `node render.mjs` → ffmpeg로 `out/` 프레임과 `music.wav`를 합치기
