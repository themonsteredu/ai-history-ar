import json,re
import fitz
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'src/features/open-class/heritage-reading.json').read_text())
normalize=lambda s:re.sub(r'\s+','',s)
for era,items in data.items():
 assert len(items)==6
 for item in items:
  path=root/'public/downloads'/era/'open-class/readings'/f"{item['id']}-{item['key']}.pdf"
  doc=fitz.open(path);assert len(doc)==1, path
  page=doc[0];assert abs(page.rect.width-595.276)<1 and abs(page.rect.height-841.89)<1
  assert page.get_images(full=True),path
  actual=normalize(page.get_text())
  for heading in [item['headline'],item['deck'],item['learningFocus'],item['photoCaption'],*item['sectionTitles']]:assert normalize(heading) in actual,(path,heading)
  for para in item['paragraphs']:assert normalize(para) in actual,(path,para)
  links={link.get('uri','') for link in page.get_links()}
  for source in item['sources']:
   assert source['url'] in links,(path,source)
   assert normalize(source['supports']) in actual,(path,source)
  for block in page.get_text('dict')['blocks']:
   if 'lines' not in block:continue
   for line in block['lines']:
    for span in line['spans']:
     assert page.rect.contains(fitz.Rect(span['bbox'])),(path,span['text'])
  doc.close()
 pack=fitz.open(root/'public/downloads'/era/'open-class/readings/all-readings.pdf')
 assert len(pack)==6
 assert all(page.get_images(full=True) for page in pack)
 pack.close()
print('12 one-page A4 newspapers, 12 images and source links, 2 six-page bundles: OK')
