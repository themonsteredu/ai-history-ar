import { session, record, stopMotion, BASE } from './rec.mjs';
const w = ms => new Promise(r => setTimeout(r, ms));
const which = process.argv[2];
async function smooth(p, y, ms = 900) { await p.evaluate(([y, ms]) => new Promise(res => { const s = scrollY, t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2; scrollTo(0, s + (y - s) * e); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); }), [y, ms]); }
async function to(p, loc, off = 100, ms = 900) { const y = await loc.evaluate(el => el.getBoundingClientRect().top + scrollY); await smooth(p, y - off, ms); }
async function drag(p, box, dx, steps = 40) { const x = box.x + box.width/2, y = box.y + box.height/2; await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(x + dx*i/steps, y + Math.sin(i/steps*Math.PI)*8); await w(25); } await p.mouse.up(); }
await session(async p => {
  if (which === 'judge') {
    await p.goto(BASE + '/joseon/lesson/2?view=ppt'); await w(2500);
    await to(p, p.getByRole('button', { name: '다음 슬라이드' }), 700, 10); await w(800);
    await record(p, 'ppt', async () => { await w(1500); for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: '다음 슬라이드' }).click(); await w(1700); } });
    await p.goto(BASE + '/joseon/lesson/2?view=activity'); await w(2000);
    await record(p, 'judge', async () => {
      await w(800);
      await p.getByRole('button', { name: /1모둠.*훈민정음/ }).click(); await w(1500);
      await to(p, p.getByText('세종은 1443년에 새 글자를 만들었습니다.'), 160, 1100); await w(600);
      const picks = ['○', '○', '○', '×', '○', '?'];
      for (let i = 0; i < picks.length; i++) {
        const btn = p.getByRole('button', { name: `${i + 1}번 ${picks[i]} ` });
        if (i === 2 || i === 4) { await to(p, btn, 380, 700); await w(250); }
        await btn.click(); await w(650);
      }
      await w(1500);
    });
  }
  if (which === 'table') {
    await p.goto(BASE + '/joseon/lesson/5?view=activity'); await w(2500);
    await record(p, 'table', async () => {
      await w(1000);
      const b = p.getByRole('button', { name: '예시 표로 시작하기' });
      await to(p, b, 300, 900); await w(500); await b.click(); await w(1500);
      await to(p, p.locator('table').first(), 140, 1100); await w(1500);
      const g = p.getByRole('button', { name: '같은 종류끼리 모으기' }); if (await g.count()) { await g.click(); await w(1800); }
      await w(800);
    });
  }
  if (which === 'graph') {
    await p.goto(BASE + '/joseon/lesson/5?view=activity'); await w(2500);
    await p.getByRole('button', { name: '예시 표로 시작하기' }).click(); await w(800);
    await p.getByRole('button', { name: '같은 종류끼리 모으기' }).click(); await w(500);
    await p.getByRole('button', { name: /이 표로 6차시 시작/ }).click(); await w(3000);
    console.log(p.url());
    await record(p, 'graph', async () => {
      await w(600);
      const b = p.getByRole('button', { name: '이 표로 그래프 만들기' });
      await to(p, b, 420, 1000); await w(700); await b.click(); await w(900);
      await to(p, p.locator('figure.project-graph'), 90, 1200); await w(3000);
    });
  }
  const sdrag = async (p, snap, box, dx, steps, hold = 1) => { const x = box.x + box.width/2, y = box.y + box.height/2; await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(x + dx*i/steps, y + Math.sin(i/steps*Math.PI)*6); await w(40); await snap(hold); } await p.mouse.up(); };
  const stype = async (p, snap, loc, text, hold = 3) => { await loc.click(); for (const ch of text) { await p.keyboard.type(ch); await w(30); await snap(hold); } };
  if (which === 'maker') {
    await p.goto(BASE + '/three-kingdoms/ar-maker'); await w(2500);
    await p.getByLabel('유물 선택').selectOption({ label: '백제 금동대향로' }); await w(8000);
    await to(p, p.locator('.maker-photo-layout'), 150, 10); await w(2500);
    await stopMotion(p, 'maker', async snap => {
      await snap(15);
      const box = await p.locator('.maker-photo-layout canvas').first().boundingBox();
      await sdrag(p, snap, box, 240, 36, 2); await w(1500); await snap(10);
      await sdrag(p, snap, box, -240, 36, 2); await w(1500); await snap(12);
      await stype(p, snap, p.getByPlaceholder('예: 가운데 창'), '뚜껑 위 봉황', 4); await snap(8);
      await stype(p, snap, p.getByPlaceholder('이 부분은 어떤 특징이 있나요?'), '향로 꼭대기에 날개를 편 봉황이 있어요.', 3); await snap(30);
      await p.getByRole('button', { name: '내 작품 체험' }).click(); await w(9000);
      await snap(75);
    });
  }
  if (which === 'sample') {
    await p.goto(BASE + '/three-kingdoms/ar-sample'); await w(1500);
    await p.getByRole('button', { name: '입체 유물 둘러보기' }).click(); await w(25000);
    await to(p, p.locator('canvas').first(), 110, 10); await w(2500);
    await stopMotion(p, 'sample', async snap => {
      await snap(15);
      const box = await p.locator('canvas').first().boundingBox();
      await sdrag(p, snap, box, 300, 32, 2); await w(2000); await snap(15);
      for (const n of ['2번 해설', '3번 해설']) { await p.getByRole('button', { name: n }).click(); await w(2500); await snap(45); }
    });
  }
  if (which === 'teacher') {
    await record(p, 'teacher', async () => {
      await p.goto(BASE + '/teacher'); await w(1200);
      await p.locator('input').first().pressSequentially('3035', { delay: 220 }); await w(400);
      await p.getByRole('button', { name: '설정 열기' }).click(); await w(2200);
      await p.goto(BASE + '/teacher/joseon/downloads'); await w(1500);
      await smooth(p, 520, 1600); await w(2200);
    });
  }
});
