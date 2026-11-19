/**
 * Builds the '조선 유물 OX 예비 퀴즈' slides for the teacher's presentation buttons (JoseonClassSlides).
 *
 * The questions live in src/features/open-class/oxBackupQuiz.json and are checked against the history
 * newspaper by oxBackupQuiz.test.ts. Each question slide draws the student quiz presentation (Presentation.tsx):
 * the dark header, the question card, then the AI answer and the check result, which appear one at a time
 * as reveal layers. The slide images go to public/presentations/joseon/ox-backup/ and the slide list into
 * joseonSlides.json under "ox-backup".
 *
 *   node scripts/build_joseon_ox_backup_slides.mjs
 *   CHROMIUM_PATH=/path/to/chrome node scripts/build_joseon_ox_backup_slides.mjs
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...parts) => path.join(root, ...parts);
const readJson = async file => JSON.parse(await readFile(at(file), 'utf8'));

const DECK = 'ox-backup';
const OUT = at('public/presentations/joseon', DECK);
const SLIDES_JSON = 'src/features/open-class/joseonSlides.json';
const WIDTH = 1920, HEIGHT = 1080, QUALITY = 0.9;

const quiz = await readJson('src/features/open-class/oxBackupQuiz.json');
const readings = (await readJson('src/features/open-class/heritage-reading.json')).joseon;
const photos = await readJson('src/lib/ar/joseon/photos.json');
const hanja = Object.fromEntries((await readFile(at('src/features/open-class/artifacts.ts'), 'utf8'))
  .split('\n').map(line => /id: (\d), key: '[^']+', name: '[^']+', hanja: '([^']+)'/.exec(line)).filter(Boolean).map(match => [Number(match[1]), match[2]]));

const escape = value => String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
// Inlined so the page needs no file access: a page opened with setContent may not load file:// fonts.
const mime = { otf: 'font/otf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const inline = async relative => `data:${mime[relative.split('.').pop().toLowerCase()]};base64,${(await readFile(at('public', relative))).toString('base64')}`;
/** '첫 문단' for the lead paragraph, otherwise the newspaper's section title. */
const placeOf = (reading, paragraph) => paragraph === 0 ? '첫 문단' : `‘${reading.sectionTitles[paragraph - 1]}’`;
const sourceOf = (reading, question) => `${reading.name} 역사신문 · ${[...new Set(question.evidence.map(item => placeOf(reading, item.paragraph)))].join(', ')}`;
const photoCredit = photo => `사진: ${[photo.author, photo.license !== '출처 확인 중' && photo.license].filter(Boolean).join(' · ')}`;

const fonts = (await Promise.all([4, 5, 6, 7, 8].map(async weight => `@font-face{font-family:"S-Core Dream";src:url("${await inline(`fonts/SCDream${weight}.otf`)}") format("opentype");font-weight:${weight}00}`))).join('');

// Colours and boxes follow the student quiz presentation in open-class.css, sized up for a projector.
const css = `${fonts}
*{box-sizing:border-box;margin:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{font-family:"S-Core Dream",sans-serif;font-weight:400;color:#1b302a;background:#f7f4ec;word-break:keep-all;overflow-wrap:anywhere;-webkit-font-smoothing:antialiased}
.slide{position:relative;width:${WIDTH}px;height:${HEIGHT}px;padding:52px 76px;display:flex;flex-direction:column;gap:26px}
.band{position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:space-between;gap:40px;padding:30px 48px 32px;border-radius:20px;background:#173e34;color:#fffdf7}
.band::after,.ring::after{content:'';position:absolute;width:270px;height:270px;right:-86px;top:-130px;border:1px solid rgba(238,218,166,.27);border-radius:50%}
.band p{margin:0 0 10px;color:#e4ca8c;font-size:28px;font-weight:700;letter-spacing:.02em}
.band h2{font-size:56px;font-weight:700;line-height:1.25}
.band span{color:#e0ece6;font-size:26px;line-height:1.4;text-align:right}
.band span b{display:block;margin-bottom:6px;color:#e4ca8c;font-size:28px;font-weight:800}
.card{flex:1;min-height:0;display:flex;flex-direction:column;padding:34px 48px 40px;border:1px solid #dedbd1;border-top:5px solid #b49a60;border-radius:16px;background:#fffefa;box-shadow:0 10px 32px rgba(24,46,38,.07)}
.number{color:#356858;font-size:30px;font-weight:800;letter-spacing:.02em;margin-bottom:10px}
.statement{color:#172a23;font-size:58px;font-weight:700;line-height:1.38;margin-bottom:32px}
.columns{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1.25fr;gap:28px}
.column{min-height:0;overflow:hidden}
.wait{height:calc(100% - 16px);margin:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;border:2px dashed #bfcbc4;border-radius:12px;color:#5d655f;font-size:29px;text-align:center;padding:24px}
.button{display:inline-flex;align-items:center;justify-content:center;min-height:88px;padding:20px 46px;border-radius:10px;font-size:34px;line-height:1.2}
.button.primary{background:#1e5949;border:1px solid #1e5949;color:#fff;font-weight:800}
.button.secondary{background:#fffef9;border:1px solid #93a197;color:#173f38;font-weight:500}
.ai{padding:30px 36px;border-left:5px solid #71988a;border-radius:0 10px 10px 0;background:#edf3ef}
.ai strong{display:block;color:#245748;font-size:46px;font-weight:800}
.ai p{margin-top:12px;color:#31443c;font-size:34px;line-height:1.55}
.result{padding:26px 36px 28px;border:1px solid #e8ddc4;border-radius:12px;background:#faf5e9;color:#26372d}
.result>b{display:block;margin-bottom:4px;color:#75581e;font-size:30px;font-weight:700}
.result p{font-size:31px;line-height:1.5;margin-top:8px}
.result p strong{color:#173e34;font-size:46px;font-weight:800}
.result .fix span{font-weight:700;color:#173e34;margin-right:10px}
.result small{display:block;margin-top:14px;color:#5b655c;font-size:25px;line-height:1.45}
.cover{justify-content:center;gap:40px;padding:76px 120px}
.cover .band{display:block;padding:64px 72px 70px;border-radius:26px}
.cover .band::after{width:420px;height:420px;right:-120px;top:-200px}
.cover .band p{font-size:36px;margin-bottom:18px}
.cover .band h1{font-size:104px;font-weight:800;line-height:1.2;margin-bottom:24px}
.cover .band span{display:block;font-size:36px;text-align:left}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.steps li{list-style:none;display:flex;align-items:center;gap:20px;padding:28px 30px;border-radius:14px;background:#e5efe9;color:#1f4a3d;font-size:32px;font-weight:700;line-height:1.35}
.steps li b{flex:none;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#1e5949;color:#fff;font-size:30px}
.divider{flex-direction:row;align-items:stretch;gap:72px;padding:80px 96px;background:#173e34;color:#fffdf7;overflow:hidden}
.ring::after{width:560px;height:560px;right:-180px;top:-260px}
.photo{flex:none;width:720px;display:flex;flex-direction:column;gap:16px}
.photo div{position:relative;flex:1;min-height:0;border-radius:22px;background:#f7f4ec}
.photo img{position:absolute;inset:28px;width:calc(100% - 56px);height:calc(100% - 56px);object-fit:contain}
.photo small{color:#c6d6ce;font-size:20px;line-height:1.4}
.about{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.about .tag{align-self:flex-start;padding:10px 22px;border-radius:999px;background:#e4ca8c;color:#173e34;font-size:28px;font-weight:800}
.about h2{margin-top:30px;font-size:120px;font-weight:800;line-height:1.1}
.about .hanja{margin-top:14px;color:#e4ca8c;font-size:44px;font-weight:500;letter-spacing:.12em}
.about hr{margin:44px 0 36px;border:0;border-top:2px solid rgba(238,218,166,.4)}
.about .paper{color:#e4ca8c;font-size:26px;font-weight:700}
.about h3{margin-top:12px;font-size:46px;font-weight:700;line-height:1.35}
.about .deck{margin-top:16px;color:#e0ece6;font-size:29px;line-height:1.5}
.about .count{margin-top:44px;color:#fffdf7;font-size:30px;font-weight:600}
`;

const page = body => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;

function coverHtml() {
  return page(`<main class="slide cover">
    <header class="band"><p>조선 과학 유물 · OX 퀴즈</p><h1>AI의 답, 맞을까요?</h1><span>역사신문을 바탕으로 AI가 유물마다 OX 문제 2개를 만들었어요.</span></header>
    <ol class="steps"><li><b>1</b>문제를 읽고 O·X 생각하기</li><li><b>2</b>AI 정답 보기</li><li><b>3</b>역사신문으로 검증하기</li></ol>
  </main>`);
}

async function dividerHtml(reading, photo) {
  const image = await inline(photo.texture || photo.path);
  return page(`<main class="slide divider ring">
    <figure class="photo"><div><img src="${image}" alt=""></div><small>${escape(photoCredit(photo))} · 크기 조정</small></figure>
    <section class="about">
      <span class="tag">유물 ${reading.id}</span>
      <h2>${escape(reading.name)}</h2><p class="hanja">${escape(hanja[reading.id] || '')}</p>
      <hr><p class="paper">역사신문</p><h3>${escape(reading.headline)}</h3><p class="deck">${escape(reading.deck)}</p>
      <p class="count">AI가 만든 OX 문제 2개 · 자료로 확인해요</p>
    </section>
  </main>`);
}

function questionHtml(reading, question, index, revealed) {
  const wrong = question.aiAnswer !== question.answer;
  const fix = !wrong ? '' : question.revised
    ? `<p class="fix"><span>고친 문장</span>“${escape(question.revised)}”&nbsp;(답&nbsp;O)</p>`
    : `<p class="fix"><span>고친 답</span>AI의 답 ${question.aiAnswer} → ${question.answer}</p>`;
  const ai = revealed ? `<div class="ai" data-fit><strong>AI의 답 ${question.aiAnswer}</strong><p>${escape(question.aiExplanation)}</p></div>`
    : `<div class="wait"><span class="button primary">AI 정답 보기</span>먼저 O인지 X인지 생각해 보세요.</div>`;
  const result = revealed ? `<div class="result" data-fit><b>${wrong ? 'AI 내용 수정 필요' : 'AI 내용 확인 완료'}</b><p><strong>확인한 답 ${question.answer}</strong></p>${fix}<p>${escape(question.explanation)}</p><small>확인 자료: ${escape(sourceOf(reading, question))}</small></div>`
    : `<div class="wait"><span class="button secondary">검증 결과 보기</span>역사신문에서 근거를 찾은 뒤 확인해요.</div>`;
  return page(`<main class="slide">
    <header class="band"><div><p>${escape(reading.name)} · AI가 만든 OX 문제</p><h2>AI의 답, 맞을까요?</h2></div><span><b>문제 ${index + 1} / 2</b>문제를 읽고 생각한 뒤 AI의 답을 확인해요.</span></header>
    <article class="card"><div class="number">${index + 1}번 문제</div><h3 class="statement" data-lines="2">${escape(question.statement)}</h3>
      <div class="columns"><div class="column" id="ai">${ai}</div><div class="column" id="result">${result}</div></div>
    </article>
  </main>`);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
const encoder = await browser.newPage();

async function show(html) {
  await tab.setContent(html, { waitUntil: 'load' });
  await tab.evaluate(async () => {
    await Promise.all([...document.fonts].map(face => face.load()));
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  // Every box must hold its text: the slide is a picture, so text that does not fit would simply be cut off.
  const problems = await tab.evaluate(() => {
    const found = [];
    for (const element of document.querySelectorAll('[data-fit], .column, .about, .card, .statement, .photo, .band > *, .steps li')) {
      if (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1) found.push(element.className || element.id);
    }
    for (const element of document.querySelectorAll('[data-fit]')) {
      const box = element.getBoundingClientRect(), column = element.parentElement.getBoundingClientRect();
      if (box.bottom > column.bottom + 1) found.push(`${element.className} taller than its column`);
    }
    for (const element of document.querySelectorAll('[data-lines]')) {
      const lines = Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight));
      if (lines > Number(element.dataset.lines)) found.push(`${element.className} has ${lines} lines`);
    }
    if (document.fonts.check('700 50px "S-Core Dream"') === false) found.push('font not loaded');
    return found;
  });
  if (problems.length) throw new Error(`Slide text does not fit: ${problems.join(', ')}\n${html.replace(/<style>[\s\S]*<\/style>/, '').slice(0, 400)}`);
}

async function save(file, clip) {
  const png = await tab.screenshot({ type: 'png', ...(clip ? { clip } : {}) });
  const webp = await encoder.evaluate(async ({ data, quality }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', quality).split(',')[1];
  }, { data: png.toString('base64'), quality: QUALITY });
  await writeFile(path.join(OUT, file), Buffer.from(webp, 'base64'));
}

/** The column's box in whole pixels, as a clip and as percentages of the slide for the reveal layer. */
async function columnBox(id) {
  const box = await tab.locator(`#${id}`).boundingBox();
  const x = Math.floor(box.x), y = Math.floor(box.y);
  const width = Math.ceil(box.x + box.width) - x, height = Math.ceil(box.y + box.height) - y;
  const percent = value => Number(value.toFixed(6));
  return { clip: { x, y, width, height }, place: { left: percent(x / WIDTH * 100), top: percent(y / HEIGHT * 100), width: percent(width / WIDTH * 100), height: percent(height / HEIGHT * 100) } };
}

// Clear the old pictures but keep the folder, so a running dev server keeps serving it.
await mkdir(OUT, { recursive: true });
await Promise.all((await readdir(OUT)).map(file => rm(path.join(OUT, file))));
const slides = [];
const next = () => slides.length + 1;

await show(coverHtml());
await save(`${next()}.webp`);
slides.push({ image: `${next()}.webp`, alt: 'AI의 답, 맞을까요? 조선 과학 유물 OX 퀴즈. 역사신문을 바탕으로 AI가 유물마다 OX 문제 2개를 만들었어요. 1 문제를 읽고 O·X 생각하기, 2 AI 정답 보기, 3 역사신문으로 검증하기' });

for (const artifact of quiz.artifacts) {
  const reading = readings.find(item => item.id === artifact.id);
  const photo = photos.find(item => item.id === artifact.id);
  await show(await dividerHtml(reading, photo));
  await save(`${next()}.webp`);
  slides.push({ image: `${next()}.webp`, chapter: reading.name, alt: `유물 ${reading.id} ${reading.name}. 역사신문: ${reading.headline}. AI가 만든 OX 문제 2개` });

  for (const [index, question] of artifact.questions.entries()) {
    const number = next(), wrong = question.aiAnswer !== question.answer;
    await show(questionHtml(reading, question, index, false));
    await save(`${number}.webp`);
    await show(questionHtml(reading, question, index, true));
    const ai = await columnBox('ai'), result = await columnBox('result');
    await save(`${number}-reveal-1.webp`, ai.clip);
    await save(`${number}-reveal-2.webp`, result.clip);
    const fix = !wrong ? '' : question.revised ? ` 고친 문장: ${question.revised} (답 O).` : ` 고친 답: AI의 답 ${question.aiAnswer}에서 ${question.answer}로.`;
    slides.push({
      image: `${number}.webp`,
      alt: `${reading.name} ${index + 1}번 문제. ${question.statement}`,
      reveals: [
        { image: `${number}-reveal-1.webp`, alt: `AI의 답 ${question.aiAnswer}. ${question.aiExplanation}`, ...ai.place, durationMs: 300, nextLabel: 'AI 정답 보기' },
        { image: `${number}-reveal-2.webp`, alt: `${wrong ? 'AI 내용 수정 필요' : 'AI 내용 확인 완료'}. 확인한 답 ${question.answer}.${fix} ${question.explanation} 확인 자료: ${sourceOf(reading, question)}`, ...result.place, durationMs: 300, nextLabel: '검증 결과 보기' },
      ],
    });
  }
}

await browser.close();
const all = await readJson(SLIDES_JSON);
all[DECK] = slides;
await writeFile(at(SLIDES_JSON), `${JSON.stringify(all, null, 2)}\n`);
console.log(`${slides.length} slides written to ${path.relative(root, OUT)}`);
