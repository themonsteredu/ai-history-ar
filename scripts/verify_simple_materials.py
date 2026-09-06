"""Check printable content, page sizes, and the exact files in download bundles."""
import argparse
import json
import re
import zipfile
from pathlib import Path
from pypdf import PdfReader
from generate_lesson2_onepage import DATA

ROOT = Path(__file__).resolve().parents[1]
def verify(era):
    OUT = ROOT / 'public/downloads' / era
    plans = json.loads((ROOT / 'src/content' / era / 'worksheet-guide.json').read_text())
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

    for group in DATA[era]['groups']:
        path = OUT / f"lesson-02-group-{group['id']:02d}-{group['slug']}.pdf"
        text = normalize(PdfReader(path).pages[0].extract_text())
        for statement in group['items']:
            assert normalize(statement[0]) in text, (path, statement[0])

    assert len(PdfReader(OUT / 'student-worksheets-all.pdf').pages) == (15 if era == 'joseon' else 14)
    with zipfile.ZipFile(OUT / f'{era}-all-materials.zip') as archive:
        for name in archive.namelist():
            if era == 'three-kingdoms': assert 'lesson-03-' not in name, name
            assert archive.read(name) == (OUT / Path(*Path(name).parts[1:])).read_bytes(), name

    manifest = json.loads((ROOT / 'public/downloads/manifest.json').read_text())['eras'][era]
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
        assert len(slides) == len(notes) == (24 if era == 'joseon' else 20)
        assert all(b'[Sources]' in archive.read(name) for name in notes)
    if era == 'joseon':
        from hashlib import sha256
        images = json.loads((ROOT / 'src/content/joseon/images.json').read_text())
        assert len(images) == 6
        assert len(PdfReader(OUT / 'ar/ar-cards-all.pdf').pages) == 6
        for item in images:
            assert sha256((ROOT / 'public/images/heritage/joseon' / item['file']).read_bytes()).hexdigest() == item['sha256']
            reader = PdfReader(OUT / f"ar/ar-card-{item['id']:02d}.pdf")
            assert len(reader.pages) == 1
            assert normalize(item['alt']) in normalize(reader.pages[0].extract_text())
        claims = json.loads((ROOT / 'src/content/joseon/lesson-two.json').read_text())
        assert claims['groups'] == json.loads(json.dumps(DATA['joseon']['groups'])), 'Original 36 claims or verdicts changed'
    print(f'{era}: checked {count + 1} PDFs, original 36 statements, PPT notes, and exact download-bundle contents.')

parser = argparse.ArgumentParser()
parser.add_argument('--era', choices=['three-kingdoms', 'joseon', 'all'], default='three-kingdoms')
args = parser.parse_args()
for era in (['three-kingdoms', 'joseon'] if args.era == 'all' else [args.era]):
    verify(era)
