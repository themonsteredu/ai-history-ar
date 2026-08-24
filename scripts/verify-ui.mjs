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
  const errors = [];
  const failedResponses = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text());
  };
  const onPageError = (error) => errors.push(error.message);
  const onResponse = (response) => {
    if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  const response = await page.goto(routeUrl(pathname), { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    bodyTextLength: document.body.innerText.trim().length,
    fontLoaded: document.fonts.check('16px "S-Core Dream"'),
    hasOverlay: Boolean(document.querySelector(".vite-error-overlay, #webpack-dev-server-client-overlay")),
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  const headingLocator = page.locator("h1").first();
  const heading = await headingLocator.count() > 0 ? await headingLocator.innerText() : "";
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("response", onResponse);

  const checks = {
    status: response?.status() ?? 0,
    heading,
    headingMatches: heading.includes(expectedHeading),
    noHorizontalOverflow: result.scrollWidth <= result.viewportWidth + 1,
    noOverlay: !result.hasOverlay,
    hasContent: result.bodyTextLength > 100,
    fontLoaded: result.fontLoaded,
    consoleErrors: errors,
    failedResponses,
  };

  if (
    checks.status >= 400 ||
    !checks.headingMatches ||
    !checks.noHorizontalOverflow ||
    !checks.noOverlay ||
    !checks.hasContent ||
    !checks.fontLoaded ||
    checks.consoleErrors.length > 0 ||
    checks.failedResponses.length > 0
  ) {
    throw new Error(`${pathname} 검증 실패: ${JSON.stringify({ ...checks, ...result })}`);
  }

  return { pathname, ...checks, viewportWidth: result.viewportWidth, scrollWidth: result.scrollWidth };
}

async function unlockTeacher(page) {
  await page.getByLabel("교사용 PIN").fill("3035");
  await page.getByRole("button", { name: "설정 열기" }).click();
  await page.getByRole("heading", { name: /지도안과 인쇄 자료/ }).waitFor();
}

async function verifyDownload(page, pathname, expectedSignature, expectedType) {
  const response = await page.request.get(`${baseUrl}${pathname}`);
  const contentType = response.headers()["content-type"] ?? "";
  const body = await response.body();
  const contentTypeMatches = expectedType === "application/zip"
    ? contentType.includes("zip")
    : contentType.includes(expectedType);

  if (!response.ok() || !contentTypeMatches || !body.subarray(0, expectedSignature.length).equals(expectedSignature)) {
    throw new Error(`${pathname} 다운로드 검증 실패: ${JSON.stringify({ status: response.status(), contentType, size: body.length })}`);
  }

  return { pathname, status: response.status(), contentType, size: body.length };
}

const executablePath = await findBrowser();
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const results = [await inspectPage(desktop, "/", "AI의 역사 설명을")];
  await desktop.locator(".home-hero__visual img").waitFor();
  const desktopCoverLoaded = await desktop.locator(".home-hero__visual img").evaluate((image) => image.complete && image.naturalWidth > 0);
  if (!desktopCoverLoaded) throw new Error("데스크톱 홈 표지 이미지가 로드되지 않았습니다.");
  await desktop.screenshot({ path: path.join(outputDirectory, "home-desktop.png"), fullPage: true });
  const homeUrlBeforeStart = desktop.url();
  await desktop.getByRole("button", { name: /역사 수업 시작하기/ }).click();
  await desktop.getByRole("heading", { name: "시대를 선택하세요" }).waitFor();
  if (desktop.url() !== homeUrlBeforeStart) {
    throw new Error(`수업 시작 버튼이 주소를 변경했습니다: ${homeUrlBeforeStart} → ${desktop.url()}`);
  }
  await desktop.getByRole("link", { name: "설정", exact: true }).first().click();
  await desktop.waitForURL(routeUrl("/teacher"));
  results.push(await inspectPage(desktop, "/teacher", "교사 설정 잠금"));
  await desktop.screenshot({ path: path.join(outputDirectory, "teacher-gate-desktop.png"), fullPage: true });
  await desktop.getByLabel("교사용 PIN").fill("0000");
  await desktop.getByRole("button", { name: "설정 열기" }).click();
  await desktop.getByRole("alert").waitFor();
  await unlockTeacher(desktop);
  await desktop.screenshot({ path: path.join(outputDirectory, "teacher-dashboard-desktop.png"), fullPage: true });
  const lessonHeadings = [
    "1500년 전에는 무엇이 있었을까",
    "AI에게 물어보았습니다",
    "진짜인지 확인하는 방법",
    "우리 모둠 유산 파헤치기",
    "AR로 만나는 문화유산",
    "헤리티지 검증 공방",
    "AR 카드 만들기",
    "30초 해설사",
    "카드에 생명 불어넣기",
    "삼국시대 유산 박물관 개관",
  ];
  let verifiedSlideCount = 0;
  let verifiedWebActivityCount = 0;
  for (const [lessonIndex, expectedHeading] of lessonHeadings.entries()) {
    const lessonId = lessonIndex + 1;
    results.push(await inspectPage(desktop, `/three-kingdoms/lesson/${lessonId}?view=ppt`, expectedHeading));
    const slideViewer = desktop.getByLabel(`삼국시대 ${lessonId}차시 수업 슬라이드`);
    await slideViewer.waitFor();
    const slideButtons = desktop.locator(".lesson-slides__dots button");
    const slideCount = await slideButtons.count();
    if (slideCount < 8) throw new Error(`${lessonId}차시 슬라이드가 8장보다 적습니다: ${slideCount}장`);

    let previousWasPrompt = false;
    for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
      await desktop.getByRole("button", { name: `${slideIndex + 1}번 슬라이드`, exact: true }).click();
      await desktop.waitForFunction(() => {
        const images = [...document.querySelectorAll(".lesson-slides__stage img")];
        return images.length > 0 && images.every((image) => image.complete && image.naturalWidth > 0);
      });
      const stageCheck = await desktop.locator(".lesson-slides__stage").evaluate((stage) => {
        const slide = stage.querySelector(".class-slide");
        const images = [...stage.querySelectorAll("img")];
        return {
          hasSlide: Boolean(slide),
          noOverflow: Boolean(slide) && slide.scrollWidth <= slide.clientWidth + 1 && slide.scrollHeight <= slide.clientHeight + 1,
          imageCount: images.length,
          loadedImageCount: images.filter((image) => image.complete && image.naturalWidth > 0).length,
          isPrompt: Boolean(stage.querySelector(".class-slide--prompt")),
          isAnswer: Boolean(stage.querySelector(".class-slide--lesson-compare, .class-slide--lesson-quiz")),
        };
      });
      if (!stageCheck.hasSlide || !stageCheck.noOverflow || stageCheck.imageCount < 1 || stageCheck.imageCount !== stageCheck.loadedImageCount) {
        throw new Error(`${lessonId}차시 ${slideIndex + 1}번 슬라이드 검증 실패: ${JSON.stringify(stageCheck)}`);
      }
      if (stageCheck.isAnswer && !previousWasPrompt) {
        throw new Error(`${lessonId}차시 ${slideIndex + 1}번 답 공개 슬라이드 앞에 질문 슬라이드가 없습니다.`);
      }
      previousWasPrompt = stageCheck.isPrompt;
      verifiedSlideCount += 1;
    }

    if (lessonId === 1 || lessonId === 6 || lessonId === 10) {
      await desktop.getByRole("button", { name: "2번 슬라이드", exact: true }).click();
      await slideViewer.screenshot({ path: path.join(outputDirectory, `lesson-${String(lessonId).padStart(2, "0")}-slides-desktop.png`) });
    }

    await desktop.goto(routeUrl(`/three-kingdoms/lesson/${lessonId}?view=activity`), { waitUntil: "networkidle" });
    await desktop.locator(".web-activity-shell").waitFor();
    const restrictedPublicSections = await desktop.locator(".download-panel, .question-card, .activity-timeline, .output-grid, .prep-grid").count();
    if (restrictedPublicSections !== 0) throw new Error(`${lessonId}차시 학생 화면에 교사용 영역이 노출되었습니다.`);
    verifiedWebActivityCount += 1;
  }

  await desktop.goto(routeUrl("/three-kingdoms/lesson/1?view=activity"), { waitUntil: "networkidle" });
  const heritageChoices = desktop.locator(".heritage-choice-card");
  if (await heritageChoices.count() !== 6) throw new Error("1차시 유물 관찰 카드가 6개가 아닙니다.");
  await desktop.waitForFunction(() => {
    const images = [...document.querySelectorAll(".heritage-choice-card img")];
    return images.length === 6 && images.every((image) => image.complete && image.naturalWidth > 0);
  });
  await desktop.getByRole("button", { name: "2모둠", exact: true }).click();
  await desktop.getByTestId("heritage-choice-3").click();
  await desktop.getByRole("button", { name: "2모둠 선택 확정" }).click();
  await desktop.getByRole("status").filter({ hasText: "첨성대" }).waitFor();
  await desktop.reload({ waitUntil: "networkidle" });
  await desktop.locator(".selection-board li").filter({ hasText: "2모둠" }).filter({ hasText: "첨성대" }).waitFor();
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-01-web-activity-desktop.png") });

  await desktop.goto(routeUrl("/three-kingdoms/lesson/2?view=activity"), { waitUntil: "networkidle" });
  if (await desktop.locator(".case-tabs button").count() !== 6) throw new Error("2차시 유산별 AI 질문이 6개가 아닙니다.");
  await desktop.getByTestId("ai-sentence-1").click();
  await desktop.getByRole("button", { name: "알고 있는 자료와 다름" }).click();
  await desktop.getByRole("button", { name: "우리 모둠 판단 제출" }).click();
  if (await desktop.getByTestId("ai-answer-summary").count() !== 0) throw new Error("2차시 답이 교사 공개 전에 노출되었습니다.");
  await desktop.getByTestId("reveal-ai-answer").click();
  await desktop.getByTestId("ai-answer-summary").waitFor();
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-02-web-activity-desktop.png") });

  await desktop.goto(routeUrl("/three-kingdoms/lesson/3?view=activity"), { waitUntil: "networkidle" });
  if (await desktop.locator(".evidence-source-grid article").count() !== 3) throw new Error("3차시 비교 자료가 3개가 아닙니다.");
  for (const sourceIndex of [0, 1]) {
    const sourceCard = desktop.getByTestId(`evidence-source-${sourceIndex}`);
    await sourceCard.getByRole("button", { name: "자료 내용 열기" }).click();
    await sourceCard.getByRole("button", { name: "근거로 담기" }).click();
  }
  await desktop.getByRole("button", { name: "틀림", exact: true }).click();
  await desktop.getByRole("button", { name: "우리 모둠 판단 제출" }).click();
  if (await desktop.getByTestId("verification-answer-summary").count() !== 0) throw new Error("3차시 답이 교사 공개 전에 노출되었습니다.");
  await desktop.getByTestId("reveal-verification-answer").click();
  await desktop.getByTestId("verification-answer-summary").waitFor();
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-03-web-activity-desktop.png") });

  await desktop.goto(routeUrl("/three-kingdoms/lesson/4?view=activity"), { waitUntil: "networkidle" });
  if (await desktop.locator(".project-case-tabs button").count() !== 6) throw new Error("4차시 유산별 공식 자료실이 6개가 아닙니다.");
  if (await desktop.locator(".research-source-card").count() !== 3) throw new Error("4차시 유산별 비교 자료가 3개가 아닙니다.");
  const firstSourceFacts = desktop.locator(".research-source-card").nth(0).locator(".research-fact-list button");
  await firstSourceFacts.nth(0).click();
  await firstSourceFacts.nth(1).click();
  await desktop.locator(".research-source-card__title").nth(2).click();
  await desktop.locator(".research-source-card").nth(2).locator(".research-fact-list button").click();
  await desktop.getByRole("button", { name: "조사 완료 저장" }).click();
  await desktop.getByText("근거 꾸러미를 이 기기에 저장했습니다").waitFor();
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-04-web-activity-desktop.png") });

  await desktop.goto(routeUrl("/three-kingdoms/lesson/5?view=activity"), { waitUntil: "networkidle" });
  await desktop.locator(".ar-target-picker").waitFor();
  if (await desktop.locator(".ar-target-picker button").count() !== 6) throw new Error("5차시 AR 표적 카드가 6개가 아닙니다.");
  await desktop.getByRole("button", { name: "카메라 없이 체험" }).click();
  await desktop.getByRole("heading", { name: "무령왕릉", exact: true }).waitFor();
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-05-web-activity-desktop.png") });
  await desktop.getByRole("button", { name: "카메라 AR 시작" }).click();
  await desktop.getByText(/카드 전체가 네모 안에|카메라를 시작하지 못했습니다|카메라 사용이 차단되었습니다/).waitFor({ timeout: 30000 });
  const arTargetResponse = await desktop.request.get(`${baseUrl}/ar/three-kingdoms-targets.mind`).catch(() => null);
  if (arTargetResponse && !arTargetResponse.ok()) throw new Error("5차시 AR 인식 파일을 불러오지 못했습니다.");
  await desktop.getByRole("button", { name: "카메라 끄기" }).click().catch(() => {});

  await desktop.goto(routeUrl("/three-kingdoms/lesson/6?view=activity"), { waitUntil: "networkidle" });
  if (await desktop.locator(".verification-case-tabs button").count() !== 6) throw new Error("6차시 유산별 검증 세트가 6개가 아닙니다.");
  if (!await desktop.getByText("전체 문제 은행 30문항").isVisible()) throw new Error("6차시 30문항 문제 은행 표시가 없습니다.");
  await desktop.getByRole("button", { name: "확인됨", exact: true }).click();
  await desktop.getByRole("button", { name: "공식 자료의 기록", exact: true }).click();
  await desktop.getByRole("button", { name: "우리 모둠 판정 제출" }).click();
  if (await desktop.locator(".verification-answer").count() !== 0) throw new Error("6차시 답이 교사 공개 전에 노출되었습니다.");
  await desktop.getByTestId("lesson-6-reveal").click();
  await desktop.locator(".verification-answer").waitFor();
  await desktop.locator(".web-activity-shell").screenshot({ path: path.join(outputDirectory, "lesson-06-web-activity-desktop.png") });

  await desktop.goto(routeUrl("/three-kingdoms/lesson/1?view=ppt"), { waitUntil: "networkidle" });
  await desktop.getByRole("button", { name: "4번 슬라이드", exact: true }).click();
  await desktop.waitForFunction(() => {
    const images = [...document.querySelectorAll(".artifact-choice-card img")];
    return images.length === 6 && images.every((image) => image.complete && image.naturalWidth > 0);
  });
  const artifactCardCount = await desktop.locator(".artifact-choice-card").count();
  const loadedArtifactImages = await desktop.locator(".artifact-choice-card img").evaluateAll((images) =>
    images.filter((image) => image.complete && image.naturalWidth > 0).length,
  );
  if (artifactCardCount !== 6 || loadedArtifactImages !== 6) {
    throw new Error(`1차시 유물 선택 카드 검증 실패: 카드 ${artifactCardCount}개, 사진 ${loadedArtifactImages}개`);
  }
  await desktop.getByLabel("삼국시대 1차시 수업 슬라이드").screenshot({ path: path.join(outputDirectory, "lesson-01-slides-desktop.png") });

  results.push(await inspectPage(desktop, "/joseon/lesson/1?view=ppt", "조선에는 무엇이 남아 있을까"));
  const joseonSlideButtons = desktop.locator(".lesson-slides__dots button");
  if (await joseonSlideButtons.count() !== 8) throw new Error("조선시대 1차시 수업 PPT가 8장이 아닙니다.");

  results.push(await inspectPage(desktop, "/teacher/three-kingdoms/lesson/1", "1500년 전에는 무엇이 있었을까"));
  const teacherMaterialVisible = await desktop.locator(".download-panel, .activity-timeline, .output-grid, .prep-grid").count();
  if (teacherMaterialVisible !== 4) throw new Error("교사 설정에 지도안 또는 인쇄 자료가 빠졌습니다.");

  results.push(await inspectPage(desktop, "/teacher/joseon/downloads", "활동지·활동카드·답안"));
  await desktop.screenshot({ path: path.join(outputDirectory, "download-center-desktop.png"), fullPage: true });

  const downloadLinkCount = await desktop.locator("a[download]").count();
  if (downloadLinkCount !== 41) {
    throw new Error(`다운로드 센터 파일 링크 수가 41개가 아닙니다: ${downloadLinkCount}개`);
  }

  const downloadedFiles = [
    await verifyDownload(desktop, "/downloads/joseon/lesson-01-student.pdf", Buffer.from("%PDF"), "application/pdf"),
    await verifyDownload(desktop, "/downloads/joseon/lesson-06-teacher.pdf", Buffer.from("%PDF"), "application/pdf"),
    await verifyDownload(desktop, "/downloads/joseon/lesson-06-answer.pdf", Buffer.from("%PDF"), "application/pdf"),
    await verifyDownload(desktop, "/downloads/joseon/lesson-10-all.zip", Buffer.from("PK"), "application/zip"),
    await verifyDownload(desktop, "/downloads/joseon/joseon-all-materials.zip", Buffer.from("PK"), "application/zip"),
  ];

  results.push(await inspectPage(desktop, "/three-kingdoms", "삼국시대 수업"));
  const classroomActionLinks = await desktop.locator(".lesson-card__classroom-actions a").count();
  if (classroomActionLinks !== 20) throw new Error(`학생 차시 목록의 PPT·웹앱 버튼이 20개가 아닙니다: ${classroomActionLinks}개`);
  const exposedTeacherMaterialLinks = await desktop.locator('a[href^="/teacher/"]').count();
  if (exposedTeacherMaterialLinks > 0) {
    throw new Error(`학생 화면에 교사용 자료 링크 ${exposedTeacherMaterialLinks}개가 노출되었습니다.`);
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  results.push(await inspectPage(mobile, "/", "AI의 역사 설명을"));
  const mobileCoverLoaded = await mobile.locator(".home-hero__visual img").evaluate((image) => image.complete && image.naturalWidth > 0);
  if (!mobileCoverLoaded) throw new Error("모바일 홈 표지 이미지가 로드되지 않았습니다.");
  await mobile.screenshot({ path: path.join(outputDirectory, "home-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/three-kingdoms/lesson/1?view=activity", "1500년 전에는 무엇이 있었을까"));
  await mobile.screenshot({ path: path.join(outputDirectory, "lesson-01-web-activity-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/three-kingdoms/lesson/4?view=activity", "우리 모둠 유산 파헤치기"));
  await mobile.locator(".research-source-card__title").first().click();
  await mobile.screenshot({ path: path.join(outputDirectory, "lesson-04-web-activity-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/three-kingdoms/lesson/5?view=activity", "AR로 만나는 문화유산"));
  await mobile.getByRole("button", { name: "카메라 없이 체험" }).click();
  await mobile.screenshot({ path: path.join(outputDirectory, "lesson-05-web-activity-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/three-kingdoms/lesson/6?view=activity", "헤리티지 검증 공방"));
  await mobile.screenshot({ path: path.join(outputDirectory, "lesson-06-web-activity-mobile.png"), fullPage: true });
  results.push(await inspectPage(mobile, "/teacher", "교사 설정 잠금"));
  await mobile.screenshot({ path: path.join(outputDirectory, "teacher-gate-mobile.png"), fullPage: true });
  await unlockTeacher(mobile);
  results.push(await inspectPage(mobile, "/teacher", "지도안과 인쇄 자료"));
  await mobile.screenshot({ path: path.join(outputDirectory, "teacher-mobile.png"), fullPage: true });

  await mobile.getByRole("button", { name: "잠그기" }).evaluate((button) => button.click());
  await mobile.getByRole("heading", { name: "교사 설정 잠금" }).waitFor();
  await mobile.goto(routeUrl("/teacher/joseon/downloads"), { waitUntil: "networkidle" });
  await mobile.getByRole("heading", { name: "교사 설정 잠금" }).waitFor();

  console.log(JSON.stringify({ ok: true, results, verifiedSlideCount, verifiedWebActivityCount, downloadLinkCount, downloadedFiles }, null, 2));
} finally {
  await browser.close();
}
