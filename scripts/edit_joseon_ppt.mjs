/** Preserve inspected source slides and edit inherited shapes through artifact-tool. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'runtime.cjs'));
const { FileBlob, PresentationFile } = await import(require.resolve('@oai/artifact-tool'));
const [starterPptx, output, workspace, copyPath] = process.argv.slice(2);
if (!starterPptx || !output || !workspace || !copyPath) throw new Error('Usage: edit-joseon <mapped-starter.pptx> <output.pptx> <qa-dir> <edit-map.json>');
const copy = JSON.parse(await fs.readFile(copyPath, 'utf8'));
const deck = await PresentationFile.importPptx(await FileBlob.load(starterPptx));
if (deck.slides.items.length !== copy.outputSlides.length) throw new Error('Starter does not match reviewed slide map.');
await fs.mkdir(path.join(workspace, 'final-layout'), { recursive: true });
await fs.mkdir(path.join(workspace, 'final-preview'), { recursive: true });
const sourceLinks = [
 'https://www.unesco.org/en/memory-world/hunminjeongum-manuscript',
 'https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_30&levelId=eh_r0250_0010',
 'https://whc.unesco.org/en/list/817/',
 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_30&levelId=kc_r300785',
 'https://www.gogung.go.kr/gogung/main/contents.do?menuNo=800049',
 'https://whc.unesco.org/en/list/738/',
 'https://www.unesco.org/en/memory-world/nanjung-ilgi-war-diary-admiral-yi-sun-sin'
];
for (const entry of copy.outputSlides) {
 const slide = deck.slides.items[entry.outputSlide - 1];
 const layout = JSON.parse(await (await slide.export({ format: 'layout' })).text());
 for (const edit of entry.editTargets) {
  const target = edit.action === 'delete' ? layout.elements.find(e => e.name === edit.name) : layout.elements.find(e => e.text === edit.oldText);
  if (!target) throw new Error(`Missing inherited slot on slide ${entry.outputSlide}: ${edit.name || edit.oldText}`);
  const shape = deck.resolve(target.aid);
  if (edit.action === 'delete') shape.delete();
  else shape.text.replace(edit.oldText, edit.newText);
 }
 slide.speakerNotes.text = [entry.notes, '활동지의 1·2·3번 순서로 진행합니다. 2차시는 첫 판단과 검색 계획, 3차시는 자료 확인과 고쳐 말하기입니다. 정답은 3차시 모둠 발표 뒤 공개합니다.', '[Sources]\n기존 확인 문장과 근거: scripts/generate_lesson2_onepage.py DATA[joseon]\n교실용 내용: src/content/joseon/worksheet-guide.json\n'+sourceLinks.join('\n')+'\n[/Sources]'].filter(Boolean).join('\n\n');
}
const placeholderNames = new Set(copy.placeholderEditPlan.map(item => item.name));
let removed = 0;
for (const layout of [...deck.layouts.items, ...deck.masters.items]) for (const shape of [...layout.shapes.items]) if (placeholderNames.has(shape.name)) { shape.delete(); removed++; }
for (const [i, slide] of deck.slides.items.entries()) {
 const stem = `slide-${String(i + 1).padStart(2, '0')}`;
 const png = await slide.export({ format: 'png', scale: 1 });
 await fs.writeFile(path.join(workspace, 'final-preview', stem + '.png'), new Uint8Array(await png.arrayBuffer()));
 const layout = await slide.export({ format: 'layout' });
 await fs.writeFile(path.join(workspace, 'final-layout', stem + '.layout.json'), await layout.text());
}
const pptx = await PresentationFile.exportPptx(deck);
const staged = path.join(workspace, 'final.pptx');
await pptx.save(staged);
await fs.copyFile(staged, output);
console.log(`Saved ${deck.slides.items.length} editable slides; removed ${removed} inventoried empty placeholders.`);
