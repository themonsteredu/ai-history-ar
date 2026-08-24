import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";

const projectRoot = process.cwd();
const imageDirectory = path.join(projectRoot, "public", "images", "heritage", "three-kingdoms");
const outputPath = path.join(projectRoot, "public", "ar", "three-kingdoms-targets.mind");
const imageNames = [
  "muryeong-tomb.jpg",
  "baekje-incense-burner.jpg",
  "cheomseongdae.jpg",
  "silla-crown.jpg",
  "goguryeo-mural.jpg",
  "gaya-tombs.jpg",
];
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
  throw new Error("AR 표적을 만들 브라우저를 찾지 못했습니다.");
}

function contentType(filePath) {
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".jpg")) return "image/jpeg";
  return "application/octet-stream";
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    if (requestUrl.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(`<!doctype html><html><body><script type="module">
        import { Compiler } from "/node_modules/mind-ar/dist/mindar-image.prod.js";
        window.MindARCompiler = Compiler;
      </script></body></html>`);
      return;
    }

    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
    const filePath = path.resolve(projectRoot, relativePath);
    if (!filePath.startsWith(projectRoot)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentType(filePath) });
    response.end(data);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("임시 서버를 열지 못했습니다.");
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ executablePath: await findBrowser(), headless: true });

try {
  const page = await browser.newPage();
  page.on("console", (message) => process.stdout.write(`[browser] ${message.text()}\n`));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.MindARCompiler === "function");
  process.stdout.write(`여섯 유물 사진을 AR 표적으로 변환합니다.\n`);

  const bytes = await page.evaluate(async ({ names }) => {
    const images = await Promise.all(names.map((name) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `/public/images/heritage/three-kingdoms/${name}`;
    })));
    const Compiler = window.MindARCompiler;
    const compiler = new Compiler();
    let lastProgress = -10;
    await compiler.compileImageTargets(images, (progress) => {
      const rounded = Math.floor(progress / 10) * 10;
      if (rounded > lastProgress) {
        lastProgress = rounded;
        console.log(`AR 표적 변환 ${Math.min(rounded, 100)}%`);
      }
    });
    return Array.from(compiler.exportData());
  }, { names: imageNames });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Uint8Array.from(bytes));
  process.stdout.write(`완료: ${path.relative(projectRoot, outputPath)} (${bytes.length} bytes)\n`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
