"""Publish the reviewed three-session teaching pack into the existing app assets.

Does not overwrite legacy lesson files or student work. Run after rebuilding the
reviewed PPT/PDF pack and its 28 slide PNGs.
"""
import json
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'outputs/history-three-lessons'
DEST = ROOT / 'public/downloads/three-kingdoms/data-inquiry'
SLIDES = ROOT / 'public/images/three-kingdoms/data-inquiry'
DEST.mkdir(parents=True, exist_ok=True)
SLIDES.mkdir(parents=True, exist_ok=True)
names = {
    'AI_데이터탐구_3차시_이론수업.pptx': 'teaching.pptx',
    'AI_데이터탐구_3차시_학생활동지.pdf': 'student-all.pdf',
    'AI_데이터탐구_3차시_교사용안내.pdf': 'teacher-guide.pdf',
}
for source, target in names.items():
    shutil.copyfile(SOURCE / source, DEST / target)
reader = PdfReader(DEST / 'student-all.pdf')
assert len(reader.pages) == 3
for i, page in enumerate(reader.pages, 1):
    writer = PdfWriter()
    writer.add_page(page)
    writer.write(DEST / f'student-{i}.pdf')
    assert len(PdfReader(DEST / f'student-{i}.pdf').pages) == 1

ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
manifest = []
with zipfile.ZipFile(DEST / 'teaching.pptx') as ppt:
    for i in range(1, 29):
        shutil.copyfile(ROOT / f'tmp/history-three-lessons/rendered/slide-{i}.png', SLIDES / f'slide-{i}.png')
        xml = ET.fromstring(ppt.read(f'ppt/slides/slide{i}.xml'))
        texts = [''.join(p.itertext()) for p in xml.findall('.//a:t', ns)]
        manifest.append({'number': i, 'title': texts[1], 'text': '\n'.join(texts)})
with open(ROOT / 'src/content/three-kingdoms/data-inquiry-slides.json', 'w') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
with zipfile.ZipFile(DEST / 'data-inquiry-all.zip', 'w', zipfile.ZIP_DEFLATED) as bundle:
    for filename in [*names.values(), 'student-1.pdf', 'student-2.pdf', 'student-3.pdf']:
        bundle.write(DEST / filename, filename)
print(f'Published 28 slide images, PPT, 5 PDF files and bundle to {DEST}')
