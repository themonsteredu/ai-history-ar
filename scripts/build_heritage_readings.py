"""Build the shared, curriculum-linked newspaper as one A4 page per artifact."""
import json
import re
import subprocess
from pathlib import Path
import fitz
from unify_worksheet_templates import ROOT, MM, fonts, text, write

DATA = json.loads((ROOT / 'src/features/open-class/heritage-reading.json').read_text())
JOSEON = {item['id']: item for item in json.loads((ROOT / 'src/lib/ar/joseon/photos.json').read_text())}
raw = (ROOT / 'src/features/goryeo/photos.ts').read_text()
GORYEO = {m.group(1): {'author': m.group(2), 'source': m.group(3), 'license': m.group(4), 'licenseUrl': m.group(5), 'path': f'images/goryeo-photos/{m.group(1)}.jpg'} for m in re.finditer(r"(\w+):\{credit:'([^']+)',source:'([^']+)',license:'([^']+)',licenseUrl:'([^']+)'", raw)}
FONT = {bold: fitz.Font(fontfile=str(ROOT / 'public/fonts' / file)) for bold, file in [(False, 'SCDream5.otf'), (True, 'SCDream7.otf')]}


def wrap(content, width, size, bold=False):
    """Wrap at spaces; never split ordinary Korean words between lines."""
    lines, current = [], ''
    for word in content.split():
        candidate = (current + ' ' + word).strip()
        if FONT[bold].text_length(candidate, fontsize=size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
            if FONT[bold].text_length(word, fontsize=size) > width:
                raise ValueError('Word too long: ' + word)
    if current:
        lines.append(current)
    return lines


def lines_at(page, x, y, lines, size, bold=False, leading=1.45):
    for line in lines:
        text(page, x, y, line, size, bold)
        y += size * leading / MM
    return y


def body_layout(item):
    width, height = 86 * MM, 141 * MM
    for size in (13, 12.75, 12.5, 12.25, 12, 11.75, 11.5):
        rows = []
        for i, paragraph in enumerate(item['paragraphs'][1:]):
            if rows:
                rows.append(('', 6, False, -1))
            for line in wrap(item['sectionTitles'][i], width, size, True):
                rows.append((line, size * 1.6, True, i))
            for line in wrap(paragraph, width, size):
                rows.append((line, size * 1.48, False, i))
        candidates = []
        for split in range(1, len(rows)):
            # Keep headings with at least two lines, and avoid paragraph widows.
            if not rows[split][0] or not rows[split-1][0] or rows[split-1][2]:
                continue
            if not rows[split][2] and rows[split][3] == rows[split-1][3]:
                pid = rows[split][3]
                before = sum(1 for r in rows[:split] if r[3] == pid and not r[2])
                after = sum(1 for r in rows[split:] if r[3] == pid and not r[2])
                if min(before, after) < 2:
                    continue
            heights = [sum(r[1] for r in part) for part in (rows[:split], rows[split:])]
            if max(heights) <= height:
                candidates.append((abs(heights[0]-heights[1]), split, heights))
        if candidates:
            _, split, heights = min(candidates)
            return size, [rows[:split], rows[split:]], heights
    raise ValueError('Body overflow: ' + item['name'])


outputs = []
for era, items in DATA.items():
    pack = fitz.open()
    for item in items:
        doc = fitz.open()
        page = doc.new_page(width=210*MM, height=297*MM)
        fonts(page)
        photo = JOSEON[item['id']] if era == 'joseon' else GORYEO[item['key']]
        photo_path = ROOT / 'public' / photo.get('texture', photo['path'])
        text(page, 15, 12, '유물로 읽는 사람들의 생활', 8)
        text(page, 155, 12, f"{'고려' if era == 'goryeo' else '조선'} 특집 · 제{item['id']}호", 8)
        page.draw_line((15*MM,15*MM),(195*MM,15*MM),width=.5)
        text(page, 15, 26, '역사 탐구 신문', 25, True)
        text(page, 153, 25, '사회 · 문화 · 과학', 9)
        for y, width in [(30,1.2),(31,.4)]:
            page.draw_line((15*MM,y*MM),(195*MM,y*MM),width=width)
        headline_size = min(21, 180*MM/FONT[True].text_length(item['headline'],fontsize=1))
        text(page,15,42,item['headline'],headline_size,True)
        text(page,15,49,item['deck'],10)
        text(page,15,56,'교과 연계  |  '+item['learningFocus'],8)
        page.draw_line((15*MM,59*MM),(195*MM,59*MM),color=(.6,.62,.57),width=.4)
        # The opening report and documented photograph occupy the upper third.
        lead_lines = wrap(item['paragraphs'][0], 94*MM, 12.25)
        end = lines_at(page,15,66,lead_lines,12.25,leading=1.55)
        if end > 114: raise ValueError('Lead overflow: '+item['name'])
        imgbox = fitz.Rect(118*MM,62*MM,195*MM,100*MM)
        photo_bytes = subprocess.run(['convert',str(photo_path),'-resize','960x960>','-quality','82','jpeg:-'],check=True,stdout=subprocess.PIPE).stdout
        page.insert_image(imgbox,stream=photo_bytes,keep_proportion=True)
        caption = wrap(item['photoCaption'],77*MM,7.7)
        end = lines_at(page,118,104,caption,7.7,leading=1.2)
        credit = wrap('사진: '+photo['author']+' · '+photo['license']+' · 크기 조정',77*MM,6.6)
        end = lines_at(page,118,end+.6,credit,6.6,leading=1.15)
        if end > 116: raise ValueError('Caption overflow: '+item['name'])
        page.insert_link({'kind':fitz.LINK_URI,'from':imgbox,'uri':photo['source']})
        page.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(118*MM,107*MM,195*MM,116*MM),'uri':photo['licenseUrl']})
        page.draw_line((15*MM,117*MM),(195*MM,117*MM),width=.7)
        size, columns, heights = body_layout(item)
        for x, rows in zip((15,109),columns):
            y = 123
            for line, height, bold, _ in rows:
                if line: text(page,x,y,line,size,bold)
                y += height/MM
            if y > 265: raise ValueError('Column overflow: '+item['name'])
        page.draw_line((105*MM,121*MM),(105*MM,260*MM),color=(.78,.79,.75),width=.4)
        page.draw_line((15*MM,265*MM),(195*MM,265*MM),width=.7)
        text(page,15,270,'자료 출처 · 확인한 내용',8.2,True)
        for n, source in enumerate(item['sources']):
            x, y = (15 if n%2==0 else 109), 274 + (n//2)*8
            name_lines = wrap(source['name'],86*MM,7)
            end = lines_at(page,x,y,name_lines,7,leading=1.1)
            support_lines = wrap(source['supports'],86*MM,6.6)
            end = lines_at(page,x,end,support_lines,6.6,leading=1.1)
            if end > y+8: raise ValueError('Source overflow: '+item['name'])
            page.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(x*MM,(y-2.5)*MM,(x+86)*MM,end*MM),'uri':source['url']})
        text(page,15,293,'공공기관 자료를 바탕으로 수업용으로 재구성한 신문입니다.',7)
        text(page,176,293,f"{item['id']} / 6",7)
        out = ROOT/'public/downloads'/era/'open-class/readings'/f"{item['id']}-{item['key']}.pdf"
        write(doc,out)
        outputs.append(out)
        with fitz.open(out) as reader: pack.insert_pdf(reader)
        doc.close()
        print(era,item['key'],'본문',size,'pt · 단 높이(mm)',*[round(h/MM,1) for h in heights])
    out = ROOT/'public/downloads'/era/'open-class/readings/all-readings.pdf'
    write(pack,out)
    pack.close()
    outputs.append(out)
print('created',len(outputs),'PDFs')
