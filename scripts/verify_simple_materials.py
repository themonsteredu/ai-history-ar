"""Check printable content, page sizes, and the exact files in download bundles."""
import json
import re
import zipfile
from pathlib import Path
from pypdf import PdfReader
from generate_lesson2_onepage import DATA

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/downloads/three-kingdoms'
plans = json.loads((ROOT / 'src/content/three-kingdoms/worksheet-guide.json').read_text())
normalize = lambda text: re.sub(r'\s+', '', text)
count = 0
for plan in plans:
    paths = [OUT / f"lesson-{plan['id']:02d}-{kind}.pdf" for kind in ['student', 'teacher', 'answer']]
    if plan['id'] == 2:
        paths += sorted(OUT.glob('lesson-02-group-*.pdf'))
    for path in paths:
        reader = PdfReader(path)
        expected = 6 if path.name == 'lesson-02-student.pdf' else 1
        assert len(reader.pages) == expected, path
        for page in reader.pages:
            assert (round(float(page.mediabox.width)), round(float(page.mediabox.height))) == (595, 842), path
            text = normalize(page.extract_text())
            assert normalize(plan['title']) in text, path
            if 'student' in path.name or 'group-' in path.name:
                for task in plan['tasks']:
                    assert normalize(task['title']) in text, (path, task['title'])
        count += 1
    with zipfile.ZipFile(OUT / f"lesson-{plan['id']:02d}-all.zip") as archive:
        for name in archive.namelist():
            assert archive.read(name) == (OUT / name).read_bytes(), name

for group in DATA['three-kingdoms']['groups']:
    path = OUT / f"lesson-02-group-{group['id']:02d}-{group['slug']}.pdf"
    text = normalize(PdfReader(path).pages[0].extract_text())
    for statement in group['items']:
        assert normalize(statement[0]) in text, (path, statement[0])

assert len(PdfReader(OUT / 'student-worksheets-all.pdf').pages) == 14
with zipfile.ZipFile(OUT / 'three-kingdoms-all-materials.zip') as archive:
    for name in archive.namelist():
        assert 'lesson-03-' not in name, name
        assert archive.read(name) == (OUT / Path(name).name).read_bytes(), name

manifest = json.loads((ROOT / 'public/downloads/manifest.json').read_text())['eras']['three-kingdoms']
def check_files(value):
    if isinstance(value, dict):
        if isinstance(value.get('path'), str) and 'size' in value:
            path = ROOT / 'public' / value['path'].lstrip('/')
            assert path.stat().st_size == value['size'], path
        for child in value.values(): check_files(child)
    elif isinstance(value, list):
        for child in value: check_files(child)
check_files(manifest)
with zipfile.ZipFile(OUT / 'lesson-02-teaching.pptx') as archive:
    slides = [name for name in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', name)]
    notes = [name for name in archive.namelist() if re.fullmatch(r'ppt/notesSlides/notesSlide\d+\.xml', name)]
    assert len(slides) == len(notes) == 20
    assert all(b'[Sources]' in archive.read(name) for name in notes)
print(f'Checked {count + 1} PDFs, 14 one-page worksheets, 36 original statements, 20 PPT slides and download bundles.')
