"""Sync lessons 4–10 from the canonical JSON, retaining lessons 1 and 2."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def main():
    plans = json.loads((ROOT / 'src/content/three-kingdoms/continuity-guide.json').read_text())
    path = ROOT / 'src/content/three-kingdoms/lessons.ts'
    source = path.read_text()
    marker = '  defineLesson({\n  "id": 4,'
    prefix = source[:source.index(marker)]
    path.write_text(prefix + ''.join('  defineLesson(' + json.dumps(p, ensure_ascii=False, indent=2) + '),\n' for p in plans) + '] as const satisfies readonly Lesson[];\n')
if __name__ == '__main__': main()
