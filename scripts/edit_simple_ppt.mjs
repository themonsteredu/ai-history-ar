/** Edit the inspected/cloned starter through artifact-tool. No OOXML mutations. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'runtime.cjs'));
const { FileBlob, PresentationFile } = await import(require.resolve('@oai/artifact-tool'));
const [starterPptx, output, workspace = 'tmp/simple-ppt'] = process.argv.slice(2);
if (!starterPptx || !output) throw new Error('Usage: node scripts/edit_simple_ppt.mjs <mapped-starter.pptx> <output.pptx> [qa-dir]');
const copy = JSON.parse(await fs.readFile(new URL('./simple_ppt_copy.json', import.meta.url), 'utf8'));
const deck = await PresentationFile.importPptx(await FileBlob.load(starterPptx));
if (deck.slides.items.length !== copy.outputSlides.length) throw new Error('Starter does not match the reviewed slide map.');
await fs.mkdir(path.join(workspace, 'final-layout'), { recursive: true });
await fs.mkdir(path.join(workspace, 'final-preview'), { recursive: true });
const worksheetSources = JSON.parse(await fs.readFile(new URL('../src/content/three-kingdoms/worksheet-guide.json', import.meta.url), 'utf8'));
for (const entry of copy.outputSlides) {
  const slide = deck.slides.items[entry.outputSlide - 1];
  const layout = JSON.parse(await (await slide.export({ format: 'layout' })).text());
  for (const edit of entry.editTargets) {
    const target = layout.elements.find(element => element.text === edit.oldText);
    if (!target) throw new Error(`Missing inherited text slot on slide ${entry.outputSlide}: ${edit.oldText}`);
    deck.resolve(target.aid).text.replace(edit.oldText, edit.newText);
  }
  const notes = [entry.notes, '학교용 간단 활동지의 1·2·3번과 같은 순서로 진행합니다.',
    JSON.stringify(worksheetSources.find(p => p.id === 2)),
    '[Sources]\n기존 검증 문장과 교사용 근거: scripts/generate_lesson2_onepage.py DATA[three-kingdoms]\n수업 자료의 원문 링크: src/content/three-kingdoms/webActivities.ts\nhttps://www.heritage.go.kr/\nhttps://www.museum.go.kr/\nhttps://whc.unesco.org/\n[/Sources]'].filter(Boolean).join('\n\n');
  slide.speakerNotes.text = notes;
}
// Explicitly inventoried unused Office placeholders belong to the master/layout.
// Removing these keeps the hierarchy and all slide-local content intact.
for (const layout of [...deck.layouts.items, ...deck.masters.items]) {
  for (const shape of [...layout.shapes.items]) {
    if (/^(Date Placeholder|Footer Placeholder|Slide Number Placeholder|Title Placeholder|Text Placeholder)/.test(shape.name ?? '')) shape.delete();
  }
}
for (const [i, slide] of deck.slides.items.entries()) {
  const stem = `slide-${String(i + 1).padStart(2, '0')}`;
  const png = await slide.export({ format: 'png', scale: 1 });
  await fs.writeFile(path.join(workspace, 'final-preview', stem + '.png'), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: 'layout' });
  await fs.writeFile(path.join(workspace, 'final-layout', stem + '.layout.json'), await layout.text());
}
const pptx = await PresentationFile.exportPptx(deck);
const stagedPptx = path.join(workspace, 'final.pptx');
await pptx.save(stagedPptx);
await fs.copyFile(stagedPptx, output);
console.log(`Saved ${deck.slides.items.length} editable slides to ${output}`);
