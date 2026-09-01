import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";

const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:4173";
const usesHashRouter = process.env.APP_HASH_ROUTER === "true";
const outputDirectory = process.env.UI_CHECK_OUTPUT ?? path.resolve("work/ui-check");
const browserCandidates = [
  process.env.BROWSER_EXECUTABLE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const lessonTitles = [
  "역사 데이터 질문 찾기",
  "AI에게 물어보았습니다",
  "진짜인지 확인하는 방법",
  "우리 모둠 데이터 만들기",
  "역사 데이터 정제하기",
  "역사 데이터를 그림으로 보기",
  "그래프를 읽고 설명하기",
  "데이터로 과거 유추하기",
  "데이터 해석을 AR로 표현하기",
  "AR 데이터 박물관 열기",
];

function routeUrl(pathname) {
  return `${baseUrl}${usesHashRouter ? "/#" : ""}${pathname}`;
}

async function findBrowser() {
  for (const candidate of browserCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // 다음 설치 위치를 확인합니다.
    }
  }
  throw new Error("브라우저 실행 파일을 찾지 못했습니다. BROWSER_EXECUTABLE_PATH를 지정하세요.");
}

async function inspectPage(page, pathname, expectedHeading) {
  const consoleErrors = [];
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error) => consoleErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const response = await page.goto(routeUrl(pathname), { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    bodyTextLength: document.body.innerText.trim().length,
    fontLoaded: document.fonts.check('16px "S-Core Dream"'),
    hasOverlay: Boolean(document.querySelector(".vite-error-overlay, #webpack-dev-server-client-overlay")),
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  const heading = await page.locator("h1").first().innerText().catch(() => "");
  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  const checks = {
    pathname,
    status: response?.status() ?? 0,
    heading,
    headingMatches: heading.includes(expectedHeading),
    noHorizontalOverflow: result.scrollWidth <= result.viewportWidth + 1,
    noOverlay: !result.hasOverlay,
    hasContent: result.bodyTextLength > 100,
    fontLoaded: result.fontLoaded,
    consoleErrors,
  };

  if (
    checks.status >= 400 ||
    !checks.headingMatches ||
    !checks.noHorizontalOverflow ||
    !checks.noOverlay ||
    !checks.hasContent ||
    !checks.fontLoaded ||
    checks.consoleErrors.length > 0
  ) {
    throw new Error(`${pathname} 검증 실패: ${JSON.stringify({ ...checks, ...result })}`);
  }

  return checks;
}

async function unlockTeacher(page) {
  await page.getByLabel("교사용 PIN").fill("3035");
  await page.getByRole("button", { name: "설정 열기" }).click();
  await page.getByRole("heading", { name: /지도안과 인쇄 자료/ }).waitFor();
}

async function verifyFile(page, pathname, signature, contentTypePart) {
  const response = await page.request.get(`${baseUrl}${pathname}`);
  const body = await response.body();
  const contentType = response.headers()["content-type"] ?? "";
  if (!response.ok() || !contentType.includes(contentTypePart) || !body.subarray(0, signature.length).equals(signature)) {
    throw new Error(`${pathname} 파일 검증 실패: ${response.status()} ${contentType} ${body.length}`);
  }
  return { pathname, status: response.status(), contentType, size: body.length };
}

const browser = await chromium.launch({
  executablePath: await findBrowser(),
  headless: true,
});

try {
  await mkdir(outputDirectory, { recursive: true });
  const results = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  results.push(await inspectPage(desktop, "/", "AI의 역사 설명을"));
  await desktop.locator(".home-hero__visual img").waitFor();
  await desktop.screenshot({ path: path.join(outputDirectory, "home-desktop.png"), fullPage: true });

  results.push(await inspectPage(desktop, "/three-kingdoms/lesson/2?view=ppt", lessonTitles[1]));
  if (await desktop.locator(".lesson-slides-section").count() !== 1) throw new Error("2차시 수업 PPT가 학생 화면에서 열리지 않습니다.");
  if (await desktop.getByRole("link", { name: /수업 PPT/ }).count() !== 1) throw new Error("2차시 수업 PPT 탭이 보이지 않습니다.");

  results.push(await inspectPage(desktop, "/teacher", "교사 설정 잠금"));
  await desktop.getByLabel("교사용 PIN").fill("0000");
  await desktop.getByRole("button", { name: "설정 열기" }).click();
  await desktop.getByRole("alert").waitFor();
  await unlockTeacher(desktop);

  results.push(await inspectPage(desktop, "/teacher/three-kingdoms/tools", "삼국시대 외부 도구 설정"));
  const toolCards = await desktop.locator(".teacher-tool-card").count();
  if (toolCards !== 10) throw new Error(`교사용 외부 도구 설정이 10개가 아닙니다: ${toolCards}개`);
  const internalCards = await desktop.locator(".teacher-tool-internal-note").count();
  if (internalCards !== 6) throw new Error(`웹앱 내부 활동 설정이 6개가 아닙니다: ${internalCards}개`);
  await desktop.screenshot({ path: path.join(outputDirectory, "teacher-tools-desktop.png"), fullPage: true });

  let verifiedSlideCount = 0;
  for (const [index, title] of lessonTitles.entries()) {
    const lessonId = index + 1;
    results.push(await inspectPage(desktop, `/three-kingdoms/lesson/${lessonId}?view=ppt`, title));
    const slideButtons = desktop.locator(".lesson-slides__dots button");
    const slideCount = await slideButtons.count();
    if (slideCount < 15) throw new Error(`${lessonId}차시 슬라이드가 따라 하기·질문·답 포함 15장보다 적습니다: ${slideCount}장`);

    let previousWasPrompt = false;
    for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
      await desktop.getByRole("button", { name: `${slideIndex + 1}번 슬라이드`, exact: true }).click();
      await desktop.waitForFunction(() => {
        const images = [...document.querySelectorAll(".lesson-slides__stage img")];
        return images.length > 0 && images.every((image) => image.complete && image.naturalWidth > 0);
      });
      const slideCheck = await desktop.locator(".lesson-slides__stage").evaluate((stage) => {
        const slide = stage.querySelector(".class-slide");
        return {
          noOverflow: Boolean(slide) && slide.scrollWidth <= slide.clientWidth + 1 && slide.scrollHeight <= slide.clientHeight + 1,
          isPrompt: Boolean(stage.querySelector(".class-slide--prompt")),
          isAnswer: Boolean(stage.querySelector(".class-slide--lesson-compare, .class-slide--lesson-quiz")),
          isClosingAnswer: Boolean(stage.querySelector(".class-slide--closing .class-slide__closing-answer")),
        };
      });
      if (!slideCheck.noOverflow) throw new Error(`${lessonId}차시 ${slideIndex + 1}번 슬라이드가 화면을 넘칩니다.`);
      if (slideCheck.isAnswer && !previousWasPrompt) throw new Error(`${lessonId}차시 답 슬라이드 앞에 질문 슬라이드가 없습니다.`);
      if (slideIndex === slideCount - 1 && (!slideCheck.isClosingAnswer || !previousWasPrompt)) {
        throw new Error(`${lessonId}차시 마지막 Q&A 질문·답 구조가 없습니다.`);
      }
      if ([1, 6, 10].includes(lessonId) && slideIndex >= slideCount - 2) {
        const suffix = slideIndex === slideCount - 2 ? "qna-question" : "qna-answer";
        await desktop.locator(".lesson-slides__stage").screenshot({
          path: path.join(outputDirectory, `lesson-${String(lessonId).padStart(2, "0")}-${suffix}.png`),
        });
      }
      previousWasPrompt = slideCheck.isPrompt;
      verifiedSlideCount += 1;
    }

    results.push(await inspectPage(desktop, `/three-kingdoms/lesson/${lessonId}?view=activity`, title));
    if (lessonId === 4) {
      await desktop.locator(".worksheet-classroom").waitFor();
      if (await desktop.locator("[data-testid='lesson-4-research']").count() !== 1) throw new Error("4차시 공식 자료실이 보이지 않습니다.");
      if (await desktop.getByRole("link", { name: /모둠 공식 자료실/ }).count() !== 1) throw new Error("4차시 학생용 모둠 자료실 탭이 보이지 않습니다.");
      await desktop.goto(routeUrl("/three-kingdoms/lesson/4?view=activity&group=3"), { waitUntil: "networkidle" });
      if (await desktop.getByRole("heading", { name: "첨성대", exact: true }).count() !== 1) throw new Error("3모둠 공유 주소에서 첨성대 자료실이 열리지 않습니다.");
      if (await desktop.locator(".research-source-card").count() !== 3) throw new Error("3모둠 공식 자료가 3개가 아닙니다.");
      if (await desktop.getByRole("button", { name: "모둠 링크 공유·복사" }).count() !== 1) throw new Error("모둠 자료실 공유 버튼이 보이지 않습니다.");
    } else if ((lessonId >= 5 && lessonId <= 8) || lessonId === 10) {
      await desktop.locator(".external-activity").waitFor();
      if (lessonId === 5) {
        if (await desktop.getByRole("heading", { name: "Google Sheets · 역사 데이터 정제" }).count() !== 1) throw new Error("5차시 Google Sheets 정제 도구가 보이지 않습니다.");
        if (await desktop.getByRole("link", { name: /예비 데이터 받기/ }).count() !== 1) throw new Error("5차시 정제용 시작 CSV가 보이지 않습니다.");
      }
      if (lessonId === 6 && await desktop.getByRole("heading", { name: "CODAP · 역사 데이터 시각화" }).count() !== 1) throw new Error("6차시 CODAP 시각화 도구가 보이지 않습니다.");
      if (lessonId === 10 && await desktop.locator(".museum-flow").count() !== 1) throw new Error("10차시 AR 데이터 박물관 운영 순서가 보이지 않습니다.");
    } else {
      await desktop.locator(".web-activity-shell").waitFor();
      if (await desktop.locator(".web-tool").count() !== 1) throw new Error(`${lessonId}차시 웹 활동이 보이지 않습니다.`);
    }
    const exposedTeacherContent = await desktop.locator(".download-panel, .activity-timeline, .teacher-tool-card").count();
    if (exposedTeacherContent !== 0) throw new Error(`${lessonId}차시 학생 화면에 교사용 영역이 노출되었습니다.`);
  }

  await desktop.goto(routeUrl("/three-kingdoms/lesson/1?view=activity"), { waitUntil: "networkidle" });
  const heritageImages = desktop.locator(".artifact-explorer__grid img");
  if (await heritageImages.count() !== 6) throw new Error("1차시 유산 이미지가 6개가 아닙니다.");
  await desktop.waitForFunction(() => [...document.querySelectorAll(".external-heritage-grid img")].every((image) => image.complete && image.naturalWidth > 0));
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-01-activity-desktop.png") });

  await desktop.goto(routeUrl("/three-kingdoms/lesson/5?view=activity"), { waitUntil: "networkidle" });
  await desktop.locator(".external-activity").waitFor();
  if (await desktop.getByRole("link", { name: "새 탭에서 시작 ↗" }).count() !== 1) throw new Error("5차시 Google Sheets 실행 버튼이 보이지 않습니다.");
  if (await desktop.getByRole("link", { name: "예비 데이터 받기" }).count() !== 1) throw new Error("5차시 정제용 시작 CSV가 보이지 않습니다.");

  await desktop.goto(routeUrl("/three-kingdoms/lesson/6?view=activity"), { waitUntil: "networkidle" });
  await desktop.locator(".external-activity").waitFor();
  if (await desktop.getByRole("button", { name: "화면 안에서 시작" }).count() !== 1) throw new Error("6차시 CODAP 실행 버튼이 보이지 않습니다.");

  results.push(await inspectPage(desktop, "/joseon/lesson/1?view=ppt", "조선에는 무엇이 남아 있을까"));
  results.push(await inspectPage(desktop, "/teacher/three-kingdoms/lesson/1", lessonTitles[0]));
  const teacherSections = await desktop.locator(".download-panel, .activity-timeline, .output-grid, .prep-grid").count();
  if (teacherSections !== 4) throw new Error("교사 화면에 지도안 또는 인쇄 자료가 빠졌습니다.");

  const files = [
    await verifyFile(desktop, "/downloads/three-kingdoms/lesson-01-student.pdf", Buffer.from("%PDF"), "application/pdf"),
    await verifyFile(desktop, "/downloads/three-kingdoms/lesson-10-answer.pdf", Buffer.from("%PDF"), "application/pdf"),
    await verifyFile(desktop, "/downloads/three-kingdoms/three-kingdoms-all-materials.zip", Buffer.from("PK"), "zip"),
    await verifyFile(desktop, "/data/three-kingdoms/heritage-data-starter.csv", Buffer.from("모둠"), "text/csv"),
  ];

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  results.push(await inspectPage(mobile, "/three-kingdoms/lesson/1?view=activity", lessonTitles[0]));
  await mobile.screenshot({ path: path.join(outputDirectory, "lesson-01-activity-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/three-kingdoms/lesson/6?view=activity", lessonTitles[5]));
  await mobile.screenshot({ path: path.join(outputDirectory, "lesson-06-activity-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/teacher", "교사 설정 잠금"));
  await unlockTeacher(mobile);
  results.push(await inspectPage(mobile, "/teacher/three-kingdoms/tools", "삼국시대 외부 도구 설정"));
  if (await mobile.locator(".teacher-tool-card").count() !== 10) throw new Error("모바일 교사 설정에 10개 차시가 보이지 않습니다.");
  await mobile.screenshot({ path: path.join(outputDirectory, "teacher-tools-mobile.png"), fullPage: true });

  console.log(JSON.stringify({ ok: true, lessons: lessonTitles.length, verifiedSlideCount, toolCards, files, results }, null, 2));
} finally {
  await browser.close();
}
