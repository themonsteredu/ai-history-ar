"""Print the exact six tracking images on A4, one heritage per page."""
from pathlib import Path
import re

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/downloads/three-kingdoms/ar'
IMAGES = ROOT / 'public/images/heritage/three-kingdoms'
FONT = 'S-Core Dream'
INK = HexColor('#183d31')
MUTED = HexColor('#536158')


def content():
    groups = (ROOT / 'src/content/three-kingdoms/groups.ts').read_text()
    names = re.findall(r'heritage: "([^"]+)"', groups)
    source = (ROOT / 'src/content/three-kingdoms/webActivities.ts').read_text()
    block = re.search(r'export const heritageImages = \[(.*?)\] as const;', source, re.S)
    if not block:
        raise ValueError('Tracking image list not found')
    images = re.findall(r'"([^"]+)"', block[1])
    if len(names) != 6 or len(images) != 6:
        raise ValueError('Expected exactly six matching heritage images')
    return list(zip(names, images))


def page(pdf, name, image):
    pdf.setFillColor(INK)
    pdf.setFont(FONT, 9)
    pdf.drawString(15 * mm, 281 * mm, 'MOA 역사 AR  |  9·10차시 전시용 인식 카드')
    pdf.setFont(FONT, 22)
    pdf.drawString(15 * mm, 265 * mm, name)
    pdf.setFont(FONT, 10)
    pdf.setFillColor(MUTED)
    pdf.drawString(15 * mm, 255 * mm, '우리 모둠: __________     아래 사진 전체를 카메라에 비춰요.')

    # Embed the original JPEG without cropping, decoration or pixel changes.
    with Image.open(image) as original:
        width, height = original.size
    scale = min(180 * mm / width, 158 * mm / height)
    draw_width, draw_height = width * scale, height * scale
    pdf.drawImage(str(image), (A4[0] - draw_width) / 2, 91 * mm + (158 * mm - draw_height) / 2,
                  width=draw_width, height=draw_height)

    pdf.setStrokeColor(HexColor('#cbd3cd'))
    pdf.line(15 * mm, 84 * mm, 195 * mm, 84 * mm)
    pdf.setFillColor(INK)
    pdf.setFont(FONT, 13)
    pdf.drawString(15 * mm, 74 * mm, '친구의 목소리로 유물을 만나 보세요')
    pdf.setFont(FONT, 10)
    steps = [
        '1. 관람 기기에서 해당 모둠의 9차시 작업 파일을 열어요.',
        '2. 전시 화면의 ‘카메라 AR 켜기’를 누르고 사진 전체를 비춰요.',
        '3. 1·2번 설명점을 눌러 듣고, 친구가 낸 관람 문제를 풀어요.',
    ]
    for y, text in zip([62, 51, 40], steps):
        pdf.drawString(15 * mm, y * mm, text)
    pdf.setFillColor(MUTED)
    pdf.setFont(FONT, 8)
    pdf.drawString(15 * mm, 25 * mm, '인쇄: A4 세로 · 한 장에 한 페이지 · 사진을 자르거나 늘리지 않기')
    pdf.drawString(15 * mm, 19 * mm, '녹음은 모둠 작업 파일에 들어 있어요. 카드를 출력하는 것만으로 목소리가 전송되지는 않아요.')
    pdf.showPage()


def create_pdf(path, entries):
    pdf = canvas.Canvas(str(path), pagesize=A4, invariant=1, pageCompression=1)
    pdf.setTitle('삼국시대 AR 인식 카드' + (' - ' + entries[0][0] if len(entries) == 1 else ' - 유물 6종'))
    pdf.setAuthor('MOAKIT')
    for name, image in entries:
        page(pdf, name, IMAGES / image)
    pdf.save()


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont(FONT, str(ROOT / 'public/fonts/SCDream5.ttf')))
    entries = content()
    for index, entry in enumerate(entries, 1):
        create_pdf(OUT / f'ar-card-{index:02}.pdf', [entry])
    create_pdf(OUT / 'ar-cards-all.pdf', entries)
    print('Created 6 one-page A4 cards and a combined 6-page PDF.')
