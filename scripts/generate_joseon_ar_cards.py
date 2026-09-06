"""A4 Joseon cards with uncropped source photos at a practical print resolution."""
import json
from io import BytesIO
from pathlib import Path
from reportlab import rl_config
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/downloads/joseon/ar'
IMAGES=ROOT/'public/images/heritage/joseon'
rl_config.useA85 = False

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    pdfmetrics.registerFont(TTFont('SchoolAR',str(ROOT/'public/fonts/SCDream5.ttf')))
    sources=json.loads((ROOT/'src/content/joseon/images.json').read_text())
    research=json.loads((ROOT/'src/content/joseon/research.json').read_text())
    def page(c,item):
        name=research[item['id']-1]['heritage'];image=IMAGES/item['file']
        c.setFillColor(HexColor('#173f33'));c.setFont('SchoolAR',10)
        c.drawString(15*mm,281*mm,'조선시대 | 9·10차시 전시용 인식 카드')
        c.setFont('SchoolAR',22);c.drawString(15*mm,265*mm,name)
        c.setFont('SchoolAR',10);c.drawString(15*mm,252*mm,'우리 모둠: __________    사진 전체를 카메라에 비춰요.')
        with Image.open(image) as im:
            # Keep original photos in public/images. The PDF needs at most
            # 2000 px (~280 dpi at 180 mm), with no crop, distortion or retouching.
            photo=im.convert('RGB');photo.thumbnail((2000,2000),Image.Resampling.LANCZOS)
            encoded=BytesIO();photo.save(encoded,format='JPEG',quality=92,optimize=True)
            encoded.seek(0);w,h=photo.size
        scale=min(180*mm/w,155*mm/h);w*=scale;h*=scale
        c.drawImage(ImageReader(encoded),(A4[0]-w)/2,92*mm+(155*mm-h)/2,width=w,height=h)
        c.setFont('SchoolAR',9);c.drawString(15*mm,83*mm,item['alt'])
        c.setFont('SchoolAR',10)
        for y,t in zip([69,58,47],['1. 관람 기기에서 우리 모둠의 9차시 작업 파일을 열어요.','2. 카메라 AR 켜기를 누르고 카드 전체를 비춰요.','3. 설명점을 눌러 우리 목소리를 듣고 관람 문제를 풀어요.']):c.drawString(15*mm,y*mm,t)
        c.setFont('SchoolAR',8);c.setFillColor(HexColor('#555555'))
        c.drawString(15*mm,34*mm,'사진: '+item['credit']+' · 인쇄용 크기 조정, 내용 변경 없음')
        c.drawString(15*mm,27*mm,'원본 사진과 이용 조건 보기 (눌러서 열기)')
        c.linkURL(item['source'],(15*mm,25*mm,118*mm,32*mm),relative=0)
        c.drawString(126*mm,27*mm,'사진 이용 조건')
        c.linkURL(item['licenseUrl'],(125*mm,25*mm,193*mm,32*mm),relative=0)
        c.drawString(15*mm,18*mm,'A4 세로 · 사진 자르지 않기 · 녹음은 별도의 모둠 작업 파일에 들어 있어요.')
        c.showPage()
    for item in sources:
        c=canvas.Canvas(str(OUT/f"ar-card-{item['id']:02d}.pdf"),pagesize=A4,invariant=1)
        c.setTitle('조선시대 AR 인식 카드 · '+research[item['id']-1]['heritage']);c.setAuthor('MOAKIT');page(c,item);c.save()
    c=canvas.Canvas(str(OUT/'ar-cards-all.pdf'),pagesize=A4,invariant=1)
    c.setTitle('조선시대 AR 인식 카드 6종');c.setAuthor('MOAKIT')
    for item in sources:page(c,item)
    c.save();print('Joseon AR cards: six individual A4 pages and six-page pack.')
if __name__=='__main__':main()
