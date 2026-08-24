import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";

const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:4173";
const outputDirectory = process.env.UI_CHECK_OUTPUT ?? path.resolve("work/ui-check");
const browserCandidates = [
  process.env.BROWSER_EXECUTABLE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

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
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text());
  };
  const onPageError = (error) => errors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    bodyTextLength: document.body.innerText.trim().length,
    fontLoaded: document.fonts.check('16px "S-Core Dream"'),
    hasOverlay: Boolean(document.querySelector(".vite-error-overlay, #webpack-dev-server-client-overlay")),
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  const heading = await page.locator("h1").first().innerText();
  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  const checks = {
    status: response?.status() ?? 0,
    heading,
    headingMatches: heading.includes(expectedHeading),
    noHorizontalOverflow: result.scrollWidth <= result.viewportWidth + 1,
    noOverlay: !result.hasOverlay,
    hasContent: result.bodyTextLength > 100,
    fontLoaded: result.fontLoaded,
    consoleErrors: errors,
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

  return { pathname, ...checks, viewportWidth: result.viewportWidth, scrollWidth: result.scrollWidth };
}

async function unlockTeacher(page) {
  await page.getByLabel("교사용 PIN").fill("3035");
  await page.getByRole("button", { name: "교사 화면 열기" }).click();
  await page.getByRole("heading", { name: /20차시 운영안/ }).waitFor();
}

const executablePath = await findBrowser();
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const results = [await inspectPage(desktop, "/", "믿기 전에")];
  await desktop.screenshot({ path: path.join(outputDirectory, "home-desktop.png"), fullPage: true });
  await desktop.getByRole("link", { name: "교사 입장" }).first().click();
  await desktop.waitForURL(`${baseUrl}/teacher`);
  results.push(await inspectPage(desktop, "/teacher", "교사 전용 화면"));
  await desktop.screenshot({ path: path.join(outputDirectory, "teacher-gate-desktop.png"), fullPage: true });
  await desktop.getByLabel("교사용 PIN").fill("0000");
  await desktop.getByRole("button", { name: "교사 화면 열기" }).click();
  await desktop.getByRole("alert").waitFor();
  await unlockTeacher(desktop);
  await desktop.screenshot({ path: path.join(outputDirectory, "teacher-dashboard-desktop.png"), fullPage: true });
  results.push(await inspectPage(desktop, "/teacher/three-kingdoms/lesson/6", "헤리티지 검증 공방"));
  results.push(await inspectPage(desktop, "/teacher/joseon/downloads", "10차시 활동지 구성"));

  results.push(await inspectPage(desktop, "/three-kingdoms", "삼국시대 문화유산"));
  const exposedTeacherMaterialLinks = await desktop.locator('a[href^="/teacher/"]').count();
  if (exposedTeacherMaterialLinks > 0) {
    throw new Error(`학생 화면에 교사용 자료 링크 ${exposedTeacherMaterialLinks}개가 노출되었습니다.`);
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  results.push(await inspectPage(mobile, "/teacher", "교사 전용 화면"));
  await mobile.screenshot({ path: path.join(outputDirectory, "teacher-gate-mobile.png"), fullPage: true });
  await unlockTeacher(mobile);
  results.push(await inspectPage(mobile, "/teacher", "20차시 운영안"));
  await mobile.screenshot({ path: path.join(outputDirectory, "teacher-mobile.png"), fullPage: true });

  await mobile.getByRole("button", { name: "잠그기" }).click();
  await mobile.getByRole("heading", { name: "교사 전용 화면" }).waitFor();
  await mobile.goto(`${baseUrl}/teacher/joseon/downloads`, { waitUntil: "networkidle" });
  await mobile.getByRole("heading", { name: "교사 전용 화면" }).waitFor();

  console.log(JSON.stringify({ ok: true, results }, null, 2));
} finally {
  await browser.close();
}
