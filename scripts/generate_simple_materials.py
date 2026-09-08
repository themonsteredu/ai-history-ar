"""School worksheets with era-scoped generation and shared task order for paper and web PPT."""
import argparse
import json
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from generate_lesson2_onepage import DATA

ROOT = Path(__file__).resolve().parents[1]
ERA = 'three-kingdoms'
SHORT = '삼국시대'
OUT = ROOT / 'public/downloads/three-kingdoms'
PLANS = json.loads((ROOT / 'src/content/three-kingdoms/worksheet-guide.json').read_text())
CONTINUATION = json.loads((ROOT / 'src/content/three-kingdoms/continuity-guide.json').read_text())
for name, file in [('School', 'SCDream5.ttf'), ('SchoolBold', 'SCDream9.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT / 'public/fonts' / file)))


class Sheet:
    def __init__(self, path, plan, audience='학생 활동지', heritage=None):
        self.c = canvas.Canvas(str(path), pagesize=A4, invariant=1)
        self.c.setTitle(f"{SHORT} {plan['label']} {plan['title']} · {audience}")
        self.c.setAuthor('MOAKIT')
        self.plan = plan
        self.text(14, 12, 182, f"{SHORT} {plan['label']}  |  {audience}", 10)
        self.text(14, 21, 182, plan['title'], 20, bold=True)
        self.text(14, 35, 182, '____학년 ____반    ____모둠    이름 ____________________', 11)
        self.line(14, 44, 196, 44)
        self.y = 48
        if heritage:
            self.text(14, self.y, 182, f"우리 모둠 유산: {heritage}", 11, bold=True)
            self.y += 9

    def text(self, x, y, width, text, size=11, bold=False, max_height=None):
        style = ParagraphStyle('text', fontName='SchoolBold' if bold else 'School',
                               fontSize=size, leading=size * 1.5, wordWrap=None if ERA == 'joseon' else 'CJK')
        p = Paragraph(escape(text).replace('\n', '<br/>'), style)
        _, height = p.wrap(width * mm, 297 * mm)
        if max_height is not None and height > max_height * mm:
            raise ValueError(f'Text overflow: {text} ({height / mm:.1f} > {max_height} mm)')
        if y * mm + height > 279 * mm:
            raise ValueError(f'Page overflow: {text}')
        p.drawOn(self.c, x * mm, A4[1] - y * mm - height)
        return height / mm

    def line(self, x1, y1, x2, y2):
        self.c.setStrokeColor(colors.HexColor('#555555'))
        self.c.setLineWidth(.45)
        self.c.line(x1 * mm, A4[1] - y1 * mm, x2 * mm, A4[1] - y2 * mm)

    def task(self, index, instruction=True):
        task = self.plan['tasks'][index - 1]
        self.text(14, self.y, 182, f"{index}. {task['title']}", 12, bold=True)
        self.y += 8
        if instruction:
            self.y += self.text(14, self.y, 182, task['instruction'], 10) + 3

    def note(self, text, size=10):
        self.y += self.text(14, self.y, 182, text, size) + 3

    def box(self, text, height=24):
        self.c.setStrokeColor(colors.HexColor('#777777'))
        self.c.setLineWidth(.45)
        self.c.rect(14 * mm, A4[1] - (self.y + height) * mm, 182 * mm, height * mm)
        if text:
            self.text(18, self.y + 3, 174, text, 11, max_height=height - 6)
        self.y += height + 5

    def table(self, headers, rows, widths, height=23, size=11):
        for row_index, row in enumerate([headers] + rows):
            h = 15 if row_index == 0 else height
            x = 14
            if row_index == 0:
                self.c.setFillColor(colors.HexColor('#F0F0F0'))
                self.c.rect(x * mm, A4[1] - (self.y + h) * mm, 182 * mm, h * mm, stroke=0, fill=1)
            self.c.setFillColor(colors.black)
            for value, width in zip(row, widths):
                self.line(x, self.y, x, self.y + h)
                self.text(x + 2.5, self.y + 2, width - 5, value,
                          9.5 if row_index == 0 else size, bold=row_index == 0, max_height=h - 4)
                x += width
            self.line(x, self.y, x, self.y + h)
            self.line(14, self.y, 196, self.y)
            self.y += h
            self.line(14, self.y, 196, self.y)
        self.y += 5

    def finish(self):
        if self.y > 279:
            raise ValueError(f"Worksheet too long: {self.plan['id']} {self.y}")
        self.line(14, 282, 196, 282)
        # Footer is deliberately below the normal writing area.
        self.c.setFont('School', 8)
        self.c.drawString(14 * mm, 10 * mm, f'{SHORT} 탐구  ·  짧게 기록하고, 자료를 보며 이야기해요.')
        self.c.showPage()
        self.c.save()


def student(plan, path, group=None):
    i = plan['id']
    s = Sheet(path, plan, heritage=group['heritage'] if group else None)
    if i == 2 and ERA == 'joseon':
        s.task(1, instruction=False)
        s.note('○ 자료로 확인   × 자료와 다름   △ 근거 부족·과장됨   ? 아직 확인하지 못함', 9)
        s.table(['번호', 'AI가 한 말', '내 판단'],
                [[str(n), item[0], '○ × △ ?'] for n, item in enumerate(group['items'], 1)],
                [13, 137, 32], height=20.5, size=10.5)
        s.task(2, instruction=False)
        s.note('더 확인할 문장: ____번   /   궁금한 낱말: __________________', 10)
        s.task(3, instruction=False)
        s.note('□ 1 국가유산청  □ 2 국립박물관  □ 3 국사편찬위원회  □ 4 기타', 9)
        s.box('검색할 낱말: __________________________________________', 17)
        s.note('판단한 까닭을 친구에게 말해요. 3차시에서 자료를 읽고 다시 판단해요.', 9)
    elif i == 3:
        s.task(1)
        s.box('지난 활동지 ____번  /  우리 유산: ________________________\n\n자료를 만든 기관: ______________________________________\n\n자료 제목: ____________________________________________', 43)
        s.task(2)
        s.box('□ 출처  □ 시기  □ 다른 자료와 비교  □ 원문 찾아보기\n\n자료에서 찾은 핵심 낱말: ________________________________\n\n다시 판단: ○  ×  △  ?   (아직 확인하지 못했다면 ?)', 43)
        s.task(3)
        s.box('자료를 읽어 보니, ______________________________________\n\n______________________________________________________\n\n□ 고친 말과 출처를 친구에게 설명했어요.', 42)
        s.note('2·3차시 활동지를 보관하고 4차시에 다시 꺼내요.', 9)
    elif i == 2:
        s.task(1, instruction=False)
        s.note('○ 자료로 확인   × 자료와 다름   △ 의견 나뉨·근거 부족   ? 더 찾아봐야 함', 9)
        s.table(['번호', 'AI가 한 말', '내 판단 (○×△?)', '확인한 출처'],
                [[str(n), item[0], '○  ×  △  ?', '번호: ____'] for n, item in enumerate(group['items'], 1)],
                [14, 99, 40, 29], height=20.5, size=10.5)
        s.task(2, instruction=False)
        s.note('자료를 읽은 뒤 출처 번호를 적어요. 판단이 달라지면 고쳐도 돼요.', 9.5)
        s.note('1 국가유산청   2 국립박물관   3 유네스코   4 그 밖의 자료: __________', 9)
        s.task(3, instruction=False)
        s.box('AI의 말은 ______________________________ 때문에 확인해야 해요.', 17)
    elif i == 1:
        s.task(1)
        s.box('우리 유산: ______________________________\n\n눈에 보이는 특징: __________________ / __________________', 36)
        s.task(2)
        s.box('□ 언제   □ 어디   □ 재료   □ 모양   □ 쓰임\n\n내가 고른 것은 __________________입니다.', 28)
        s.task(3)
        s.box('우리 유산은 __________________________________________?\n\n친구와 이야기한 뒤 고쳐 써도 좋아요.', 37)
        s.note('오늘 역할: □ 자료 찾기  □ 기록하기  □ 기기 다루기  □ 발표하기')
    elif i == 4:
        s.task(1)
        s.box('우리 주제: __________________________________________', 16)
        s.note('단서 문장은 선생님 자료나 웹앱에서 읽어요.', 9)
        s.task(2)
        s.note('종류: 언제·어디 / 재료·만드는 방법 / 생김새 / 쓰임·생활', 9)
        s.note('예: “무덤은 벽돌을 쌓아 만들었다.” → 재료·만드는 방법 | 벽돌', 9)
        s.table(['번호', '내가 정리한 내용', '어떤 이야기?'],
                [[str(n), '', ''] for n in range(1, 5)], [16, 104, 62], height=20)
        s.task(3, instruction=False)
        s.note('Excel에 직접 입력 → 삽입 > 표 → 저장 → 웹앱에 가져오기', 9)
        s.note('5차시: 표 다듬기 / 6차시: 이 표로 그래프 만들기', 9)
    elif i == 5:
        s.task(1)
        s.box('우리 표 이름: ________________________________________', 20)
        s.task(2)
        s.table(['이야기 종류', '우리 표에 적은 내용 수'],
                [[name, '________개'] for name in ['언제·어디', '재료·만드는 방법', '생김새', '쓰임·생활']], [100, 82], height=20)
        s.task(3)
        s.note('웹앱에서 표 이름을 쓰고 ‘이 표로 6차시 시작’을 눌러요.')
        s.note('같은 내용은 한 줄만 남겨요. 뜻이 다른 내용은 그대로 두어요.')
    elif i == 6:
        s.task(1)
        s.table(['이야기 종류', '내용 수'],
                [[name, '________개'] for name in ['언제·어디', '재료·만드는 방법', '생김새', '쓰임·생활']], [100, 82], height=18)
        s.task(2)
        s.box('그래프 제목: ________________________________________', 20)
        s.task(3)
        s.note('가장 많은 종류: __________________  /  ______개')
        s.note('표를 고쳤다면 그래프도 다시 만들어요.')
    elif i == 7:
        s.task(1)
        s.box('우리 문장 ______개 중\n\n‘____________________________’은 ______개예요.', 33)
        s.task(2)
        s.box(f'□ {SHORT} 사람들의 생활 전체\n□ 어느 유산이 더 중요한지\n□ 어느 나라가 더 힘이 셌는지', 33)
        s.task(3)
        s.box('친구가 확인해 주세요.\n\n□ 그래프에서 개수를 가리키며 말했어요.\n□ 알 수 없는 것도 말했어요.    친구 이름: ______________', 38)
        s.note('□ 화면에서 설명 두 문장 선택    □ 오늘 작업 저장')
    elif i == 8:
        s.task(1)
        s.table(['고른 문장 번호', '핵심 낱말'], [['____번', ''], ['____번', '']], [40, 142], 20)
        s.task(2)
        s.box('이 두 문장을 보니, 옛날 사람들은\n\n____________________________________________________\n\n_____________________________________했을 것 같아요.', 43)
        s.task(3)
        s.box('하지만 ______________________________________________\n\n____________________________은/는 아직 알 수 없어요.', 29)
        s.note('□ 자료에서 확인한 말과 우리 생각을 나눴어요.  □ 오늘 작업 저장', 9.5)
    elif i == 9:
        s.task(1)
        s.table(['설명점', '설명할 곳 · 핵심 낱말', '녹음 확인'],
                [['1번', '', '□ 녹음\n□ 다시 듣기'], ['2번', '', '□ 녹음\n□ 다시 듣기']], [20, 123, 39], 23)
        s.task(2)
        s.box('친구에게 낼 문제: ______________________________________\n\n정답인 설명점:  □ 1번  □ 2번', 30)
        s.task(3)
        s.box('□ 설명점 두 곳이 보여요.\n□ 눌렀을 때 우리 목소리가 들려요.\n□ 친구가 문제를 풀어 봤어요.\n□ 녹음을 끝내고 오늘 작업을 저장했어요.', 38)
        s.note('다른 기기는 작업 파일을 먼저 열어요. 카드 전체를 카메라에 비춰요.', 9.5)
    else:
        s.task(1)
        s.box('나는 □ A팀  □ B팀\n\nA팀 설명·B팀 관람 (12분) → 역할 바꾸기 → B팀 설명·A팀 관람 (12분)', 28)
        s.task(2)
        s.table(['방문한 모둠', '기억할 낱말 하나'], [['____모둠', ''] for _ in range(3)], [38, 144], 20)
        s.task(3)
        s.box('처음에는 몰랐지만, 이제는\n\n____________________________________________________\n\n_____________________________________을/를 알게 되었어요.', 41)
    s.finish()

ASSESSMENT = {
    3: ['확인할 문장과 실제로 읽은 자료가 연결되는가?', '출처와 설명 시기, 원문을 살피고 판단을 다시 표시했는가?', '자료에서 확인한 범위만 고쳐 쓰고 근거를 가리키는가?'],
    1: ['사진에서 실제로 보이는 특징을 두 가지 찾았는가?', '고른 궁금증이 우리 유산과 관련되는가?', '자료로 알아볼 수 있는 질문을 한 문장으로 말하는가?'],
    4: ['단서에서 핵심 내용을 찾았는가?', '내용과 종류를 알맞게 직접 표에 썼는가?', '자신이 쓴 표를 웹앱에 입력하고 저장했는가?'],
    5: ['자신이 쓴 표를 다시 읽었는가?', '같은 종류끼리 모으고 종류별 개수를 세었는가?', '표 이름을 붙이고 다음 차시로 이어 갔는가?'],
    6: ['표의 종류별 내용 수를 세었는가?', '우리 모둠 표로 그래프를 만들고 제목을 붙였는가?', '실제 개수가 일치하고 그래프가 작업 파일에 담겼는가?'],
    7: ['기록한 종류와 개수가 실제 그래프와 맞는가?', '그래프만으로 알 수 없는 것을 구분하는가?', '그래프를 가리키며 개수와 한계를 함께 말하는가?'],
    8: ['서로 다른 확인된 문장 두 개를 골랐는가?', '고른 두 문장으로 자신의 생각을 설명할 수 있는가?', '확인된 사실과 생각, 아직 모르는 점을 구분하는가?'],
    9: ['두 설명점의 내용이 확인한 자료와 연결되는가?', '녹음이 들리고 관람 문제의 정답이 설명과 맞는가?', '친구 화면에서 점검하고 녹음까지 저장했는가?'],
    10: ['모둠 안에서 설명과 관람 역할을 모두 맡았는가?', '세 전시에서 기억할 내용을 하나씩 기록했는가?', '처음 생각과 달라진 점을 자료를 들어 말하는가?'],
}


def teacher(plan, path, answers=False):
    s = Sheet(path, plan, '교사용 확인 기준' if answers else '교사용 진행 안내')
    continuation = next((p for p in CONTINUATION if p['id'] == plan['id']), None)
    if answers and plan['id'] == 2:
        # Verified claim verdicts stay identical to the existing 6-group materials.
        s.note(('3차시 자료 확인과 모둠 발표 뒤에만 공개하세요.' if ERA == 'joseon' else '모둠 발표 뒤에만 공개하세요.') + ' △와 ?는 뜻이 다릅니다.')
        s.table(['모둠 · 유산', '1번', '2번', '3번', '4번', '5번', '6번'],
                [[f"{g['id']} · {g['heritage']}"] + [x[1][0] for x in g['items']] for g in DATA[ERA]['groups']],
                [68] + [19]*6, 18, 10)
        s.note('○ 자료로 확인 / × 자료와 다름 / △ 근거 부족·과장됨 / ? 미확인' if ERA == 'joseon' else '○ 자료와 같음 / × 자료와 다름 / △ 의견 나뉨·근거 부족 / ? 미확인')
        s.note('‘출처 번호’만 보고 맞았다고 판단하지 않습니다. 해당 자료에서 어느 문장을 읽었는지 짚게 합니다.')
    else:
        for n, task in enumerate(plan['tasks'], 1):
            s.task(n)
            s.note(('확인: ' + ASSESSMENT[plan['id']][n - 1]) if answers else ('진행: ' + task['tip']))
            s.y += 4
    if continuation:
        prep = {1: '유산별 사진과 모둠별 A4 활동지를 준비합니다.', 2: '모둠별 유산에 맞는 2차시 활동지를 준비합니다. 정답은 3차시 발표 뒤에 공개합니다.', 3: '완성한 2차시 활동지와 공식 자료, 오늘 활동지를 준비합니다.'}
        s.note('수업 전: ' + (prep[plan['id']] if ERA == 'joseon' and plan['id'] <= 3 else ('교사가 정한 주제·단서 문장과 빈 표 활동지를 준비합니다.' if plan['id'] == 4 else '지난 작업 파일과 모둠별 A4 활동지 한 장을 준비합니다.')), 10)
        if not answers and plan['id'] == 9 and ERA == 'three-kingdoms':
            s.note('AR 준비: 유물 카드를 A4로 출력하고 마이크·카메라를 확인합니다. 첨성대 공식 3D 원본은 약 36MB이므로 수업 전에 열어 둡니다. 다른 유산은 준비한 모형 또는 사진으로 진행합니다.', 9.5)
        if not answers and plan['id'] == 9 and ERA == 'joseon':
            s.note('AR 준비: 조선 유산 카드 6종을 A4로 출력합니다. 사진 AR로 시작하며 입체 모형은 준비한 교사 파일을 사용합니다. 카메라·마이크를 미리 확인합니다.', 9.5)
        for warning in continuation['cautions']:
            s.note('유의: ' + warning, 9.5)
        s.note('다음 연결: ' + continuation['nextLessonPrep'], 9.5)
    elif plan['id'] == 1:
        s.note('사진에서 실제로 보이는 특징과 추측을 구분하게 합니다. 질문은 자료로 알아볼 수 있으면 됩니다.')
    elif not answers:
        s.note('5분 도입 → 8분 판단 → 12분 자료 확인 → 7분 발표 → 8분 정리')
        s.note('출처 번호: 1 국가유산청 / 2 국립박물관 / 3 유네스코 / 4 기타')
        s.note('기존 2·3차시 통합 수업을 마친 학급은 재수업 없이 완성한 활동지를 4차시로 가져갑니다.')
    s.note('기록 부담: 긴 설명은 화면에 보관합니다. 종이는 체크·숫자·핵심 낱말 중심으로 쓰고, 말로 설명한 내용도 관찰합니다.', 9.5)
    s.finish()


def merge(paths, output):
    writer = PdfWriter()
    for path in paths:
        writer.append(path)
    writer.write(output)


def rebuild_bundles():
    manifest_path = ROOT / 'public/downloads/manifest.json'
    manifest = json.loads(manifest_path.read_text())
    era = manifest['eras'][ERA]
    for plan in PLANS:
        entry = next(e for e in era['lessons'] if e['lessonId'] == plan['id'])
        entry['title'] = plan['title']
        prefix = f"lesson-{plan['id']:02d}-"
        files = sorted(f for f in OUT.glob(prefix + '*') if f.suffix in ('.pdf', '.pptx', '.xlsx'))
        archive = OUT / (prefix + 'all.zip')
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
            for file in files:
                z.write(file, file.name)
        values = [item for value in entry['files'].values() for item in (value if isinstance(value, list) else [value])]
        for value in values:
            path = ROOT / 'public' / value['path'].lstrip('/')
            if path.exists():
                value['size'] = path.stat().st_size
    ids = {p['id'] for p in PLANS}
    archive = OUT / f'{ERA}-all-materials.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for file in sorted(OUT.iterdir()):
            match = re.match(r'lesson-(\d+)-', file.name)
            if file.suffix in ('.pdf', '.pptx', '.xlsx') and (not match or int(match[1]) in ids):
                z.write(file, SHORT + '/' + file.name)
        if ERA == 'joseon':
            # The six-page pack already contains every card. Avoid duplicating
            # the original photos in the era ZIP and exceeding static asset limits.
            file = OUT / 'ar/ar-cards-all.pdf'
            if file.exists(): z.write(file, SHORT + '/ar/' + file.name)
    era['bundle']['size'] = archive.stat().st_size
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    # The legacy combined lesson-2 pack must also contain the revised files.
    combined = ROOT / 'public/downloads/lesson-02-samguk-joseon-complete.zip'
    if combined.exists():
        with zipfile.ZipFile(combined) as z:
            old = [(info, z.read(info)) for info in z.infolist()]
        with zipfile.ZipFile(combined, 'w', zipfile.ZIP_DEFLATED) as z:
            for info, data in old:
                name = Path(info.filename).name
                replacement = OUT / name
                if (SHORT in info.filename or ERA in info.filename) and replacement.exists():
                    data = replacement.read_bytes()
                z.writestr(info, data)
    details_path = ROOT / 'public/downloads/lesson-02-materials.json'
    if details_path.exists():
        details = json.loads(details_path.read_text())
        def sizes(value):
            if isinstance(value, dict):
                if 'path' in value and isinstance(value['path'], str):
                    path = ROOT / 'public' / value['path'].lstrip('/')
                    if path.exists() and 'size' in value:
                        value['size'] = path.stat().st_size
                for item in value.values(): sizes(item)
            elif isinstance(value, list):
                for item in value: sizes(item)
        sizes(details)
        details_path.write_text(json.dumps(details, ensure_ascii=False, indent=2) + '\n')


def main():
    global ERA, SHORT, OUT, PLANS, CONTINUATION
    parser = argparse.ArgumentParser()
    parser.add_argument('--era', choices=['three-kingdoms', 'joseon'], default='three-kingdoms')
    parser.add_argument('--bundles-only', action='store_true')
    args = parser.parse_args()
    ERA = args.era
    SHORT = '조선시대' if ERA == 'joseon' else '삼국시대'
    OUT = ROOT / 'public/downloads' / ERA
    PLANS = json.loads((ROOT / 'src/content' / ERA / 'worksheet-guide.json').read_text())
    CONTINUATION = json.loads((ROOT / 'src/content' / ERA / 'continuity-guide.json').read_text())
    if not args.bundles_only:
        student_files = []
        for plan in PLANS:
            prefix = f"lesson-{plan['id']:02d}-"
            path = OUT / (prefix + 'student.pdf')
            if plan['id'] == 2:
                groups = []
                for group in DATA[ERA]['groups']:
                    group_path = OUT / (prefix + f"group-{group['id']:02d}-{group['slug']}.pdf")
                    student(plan, group_path, group)
                    groups.append(group_path)
                merge(groups, path)
                student_files.extend(groups)
            else:
                student(plan, path)
                student_files.append(path)
            for kind in ('teacher', 'answer'):
                teacher(plan, OUT / (prefix + kind + '.pdf'), answers=kind == 'answer')
        merge(student_files, OUT / 'student-worksheets-all.pdf')
        for path in student_files:
            if len(PdfReader(path).pages) != 1:
                raise AssertionError(f'Not one A4 page: {path}')
        print(f'Generated {len(student_files)} individual one-page worksheets and teacher guides.')
    rebuild_bundles()


if __name__ == '__main__':
    main()
