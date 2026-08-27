from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, A5, A6, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "tmp" / "pdfs" / "curriculum.json"
OUTPUT_ROOT = ROOT / "output" / "pdf"
PUBLIC_ROOT = ROOT / "public" / "downloads"
FONT_ROOT = ROOT / "public" / "fonts"

INK = HexColor("#111111")
SOFT = HexColor("#444444")
PAPER = colors.white
LINE = HexColor("#B8B8B8")
GREEN = HexColor("#222222")
GREEN_SOFT = HexColor("#F0F0F0")
RED = HexColor("#111111")
GOLD = HexColor("#555555")


SOURCES = {
    "무령왕릉": ("국립중앙박물관 무령왕릉 해설", "https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=16892&schM=view"),
    "백제 금동대향로": ("국립부여박물관 대표 소장품", "https://buyeo.museum.go.kr/rprsPsn/view.do?key=2302150017&rprsPsnCmdtyMngSn=2001010001"),
    "첨성대": ("국가유산청 경주 첨성대 안내", "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0"),
    "신라 금관": ("국립중앙박물관 신라 금관 해설", "https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?pageSize=10&relicRecommendId=519954&schM=view"),
    "고구려 고분벽화": ("UNESCO Complex of Koguryo Tombs", "https://whc.unesco.org/en/list/1091"),
    "가야 고분군": ("국가유산청 가야고분군", "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1333803410000&ccgbGbtype=UNI&ccgbGbtypeNo=2&pageNo=1_1_5_0"),
    "훈민정음 해례본": ("국가유산청 훈민정음 해례본", "https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=1_1_2_1&pg=%2Funesco%2FMemHeritage%2FMemHeritage_01.jsp"),
    "조선왕조실록": ("국가유산청 조선왕조실록", "https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=2_1_1_1&pg=%2Funesco%2FMemHeritage%2FMemHeritage_02.jsp"),
    "수원 화성": ("국가유산청 수원 화성", "https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=1_2_2_1&pg=%2Funesco%2FHeritage%2FHeritage_05.jsp"),
    "자격루·앙부일구": ("국립중앙박물관 자격루·앙부일구", "https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=519953&schM=view"),
    "종묘와 종묘제례악": ("국가유산청 종묘", "https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=2_1_1_0&pg=%2Funesco%2FHeritage%2FHeritage_03.jsp"),
    "난중일기": ("국가유산청 난중일기", "https://heritage.go.kr/heri/html/HtmlPage.do?amppageNo=1_1_4_0&pg=%2Funesco%2FMemHeritage%2FMemHeritage_10.jsp"),
}


LESSON_FOUR_NOTES = {
    "무령왕릉": (
        "1971년 송산리 고분 배수로 공사 중 발견되었고 지석으로 무덤 주인을 확인했다.",
        "유물이 놓인 까닭과 장례의 모든 순간은 지석만으로 확정할 수 없다.",
        "발견 상황 → 지석의 역할 → 발굴 기록의 한계",
    ),
    "백제 금동대향로": (
        "1993년 부여 능산리 절터에서 출토된 금동 유물로, 봉황·산·연꽃·용 등이 표현되어 있다.",
        "향로의 모든 인물과 동물 무늬가 각각 뜻하는 바를 하나로 단정할 수 없다.",
        "출토 장소·재료 → 사진 속 형상 → 무늬 해석의 한계",
    ),
    "첨성대": (
        "신라 선덕여왕 때 세운 것으로 보는 석조 건축물이며 천문 관측과 관련된 시설로 설명된다.",
        "누가 어떤 자세와 도구로 관측했는지는 하나로 확정되지 않았다.",
        "제작 시기·재료 → 천문 관측 관련 설명 → 구체적 사용법의 한계",
    ),
    "신라 금관": (
        "왕릉급 무덤의 부장품으로 발견되었고 얇은 금판·세움 장식·굽은옥 등이 보인다.",
        "살아 있을 때 직접 썼는지 장례를 위해 만들었는지는 한 가지 결론으로 확정하기 어렵다.",
        "출토 위치 → 실제로 보이는 장식 → 착용 여부의 한계",
    ),
    "고구려 고분벽화": (
        "왕족과 귀족의 무덤에 남은 벽화로 생활·사냥·행렬과 믿음을 살펴볼 수 있다.",
        "왕족·귀족 무덤의 장면을 모든 고구려 사람의 일상으로 일반화해서는 안 된다.",
        "무덤의 주인 → 벽화 장면 → 자료를 일반화할 때의 한계",
    ),
    "가야 고분군": (
        "여러 지역의 일곱 고분군으로 이루어져 가야 정치체의 공통점과 지역 차이를 보여 준다.",
        "가야를 처음부터 한 왕이 다스린 하나의 나라로 단정해서는 안 된다.",
        "고분군의 분포 → 공통점·지역 차이 → 단일 국가라는 오해",
    ),
}


QUIZ_BANK = {
    "무령왕릉": [
        ("무령왕릉은 1971년 배수로 공사 중 우연히 발견되었다.", "참", "1971년 7월 송산리 6호분 배수로 공사 중 발견되었다."),
        ("무덤 안 지석 덕분에 무령왕과 왕비의 무덤임을 확인했다.", "참", "지석에 무덤 주인과 장례 관련 정보가 남아 있었다."),
        ("무령왕릉은 신라 왕의 무덤이다.", "거짓", "무령왕릉은 백제 제25대 무령왕과 왕비의 무덤이다."),
        ("무령왕릉에서는 금동신발과 청동거울 같은 유물이 나왔다.", "참", "장신구, 금동신발, 청동거울, 중국제 도자기 등 많은 유물이 출토되었다."),
        ("무령왕릉은 나무만으로 만든 무덤이다.", "거짓", "무령왕릉은 벽돌로 만든 벽돌무덤이다."),
    ],
    "백제 금동대향로": [
        ("백제 금동대향로는 1993년 부여 능산리 절터에서 발견되었다.", "참", "부여 능산리 사지 발굴 중 출토되었다."),
        ("향로 꼭대기에는 봉황이 표현되어 있다.", "참", "꼭대기의 봉황과 받침의 용이 특징이다."),
        ("백제 금동대향로는 순금만으로 만들었다.", "거짓", "청동으로 만들고 표면에 금을 입힌 금동 유물이다."),
        ("향로에는 산, 연꽃, 악사와 여러 동물이 표현되어 있다.", "참", "백제인의 사상과 예술을 보여 주는 다양한 형상이 새겨져 있다."),
        ("이 향로는 신라 황룡사에서 발견되었다.", "거짓", "부여 능산리의 백제 절터에서 발견되었다."),
    ],
    "첨성대": [
        ("첨성대는 신라 선덕여왕 때 세운 것으로 추정된다.", "참", "국가유산 안내는 선덕여왕 재위 때 축조된 것으로 본다."),
        ("첨성대는 다듬은 돌을 층층이 쌓은 건축물이다.", "참", "원통형 몸체를 돌로 쌓아 올린 구조이다."),
        ("첨성대는 나무로만 지은 건물이다.", "거짓", "첨성대는 석조 건축물이다."),
        ("첨성대는 천체 관측과 관련된 시설로 설명된다.", "참", "국가유산 안내에서는 신라의 천문 관측대로 설명한다."),
        ("첨성대에서 매일 어떤 방식으로 관측했는지 모두 밝혀졌다.", "보류", "구체적인 사용 방식에는 여러 해석이 있어 하나로 단정하기 어렵다."),
    ],
    "신라 금관": [
        ("신라 금관은 왕릉급 무덤의 부장품으로 발견되었다.", "참", "금관은 무덤에 묻힌 인물의 권위를 드러내는 위세품이었다."),
        ("금관에는 나뭇가지 모양 세움 장식과 굽은옥이 보인다.", "참", "세움 장식과 곡옥은 신라 금관의 대표 특징이다."),
        ("발견된 금관은 모두 머리에 쓴 상태였다.", "거짓", "얼굴을 덮는 위치 등 다양한 상태로 발견된 사례가 있다."),
        ("신라 사람들이 금관을 평소 노동할 때 매일 썼다.", "거짓", "무덤 부장품이라는 성격이 강하며 일상 착용으로 단정할 수 없다."),
        ("신라 금관의 정확한 사용 방식은 한 가지 결론만 있다.", "보류", "실제 착용과 장례용 제작 등 해석이 있어 근거를 비교해야 한다."),
    ],
    "고구려 고분벽화": [
        ("고구려 고분벽화에는 당시 사람들의 생활 모습이 담겨 있다.", "참", "인물, 행렬, 사냥, 생활 장면은 고구려 문화를 이해하는 자료이다."),
        ("발견된 모든 고구려 무덤에 벽화가 있다.", "거짓", "발견된 1만 기가 넘는 무덤 중 벽화가 있는 무덤은 일부이다."),
        ("벽화무덤은 왕과 왕족, 귀족의 장례와 관련된 것으로 본다.", "참", "세계유산 설명은 왕족과 귀족의 무덤으로 추정한다."),
        ("고분벽화는 고구려인의 사후 세계관을 보여 준다.", "참", "생활과 수호신 그림을 통해 삶과 죽음에 대한 믿음을 살필 수 있다."),
        ("고구려 고분벽화는 조선 후기에 처음 그려졌다.", "거짓", "고구려 시대 무덤 내부에 그린 벽화이다."),
    ],
    "가야 고분군": [
        ("가야고분군 세계유산은 일곱 고분군으로 이루어져 있다.", "참", "김해, 함안, 합천, 고령 등 일곱 고분군이 연속유산을 이룬다."),
        ("가야고분군은 1세기부터 6세기 무렵의 가야를 보여 준다.", "참", "가야 정치체와 매장 문화를 보여 주는 지배층 무덤들이다."),
        ("가야는 처음부터 하나의 중앙집권 국가로만 운영되었다.", "거짓", "여러 정치체가 자율성과 수평적 관계를 유지한 연맹의 특징을 보인다."),
        ("무덤의 부장품은 가야 각국의 교류를 보여 준다.", "참", "토기와 교역품에서 지역성과 교류 관계를 확인할 수 있다."),
        ("가야고분군에는 무덤이 한 기만 남아 있다.", "거짓", "여러 지역에 군집을 이룬 다수의 고분으로 구성된다."),
    ],
    "훈민정음 해례본": [
        ("훈민정음 해례본은 1446년에 간행되었다.", "참", "세종 28년인 1446년에 간행된 목판본이다."),
        ("해례본에는 새 문자의 소리와 사용 원리가 설명되어 있다.", "참", "창제 목적, 음가, 운용법, 해설과 용례를 담았다."),
        ("해례본의 모든 부분을 세종 혼자 썼다.", "거짓", "세종의 예의와 집현전 학자들이 만든 해례 등으로 구성된다."),
        ("훈민정음은 1443년에 창제되고 해례본은 1446년에 나왔다.", "참", "문자 창제와 책의 간행 시기는 구분해야 한다."),
        ("처음 만든 훈민정음 글자는 모두 28자였다.", "참", "당시에는 자음과 모음을 합해 28자를 만들었다."),
    ],
    "조선왕조실록": [
        ("조선왕조실록은 태조부터 철종까지 472년을 기록했다.", "참", "25대 472년의 역사를 날짜 순서로 기록했다."),
        ("실록은 사건을 연월일 순서로 적은 편년체 역사서이다.", "참", "시간 순서에 따라 정치, 사회, 자연현상 등을 기록했다."),
        ("사관의 기록은 임금도 마음대로 미리 볼 수 없었다.", "참", "열람 제한과 비밀 보장은 기록의 신빙성을 지키는 장치였다."),
        ("조선은 실록을 한 부만 만들어 궁궐에 보관했다.", "거짓", "사고 여러 곳에 나누어 보관하여 전쟁과 화재에 대비했다."),
        ("임진왜란 때 전주사고본을 제외한 기존 사고본이 소실되었다.", "참", "전주사고본을 바탕으로 실록을 다시 인쇄했다."),
    ],
    "수원 화성": [
        ("수원 화성은 1794년에 시작해 1796년에 완공되었다.", "참", "정조 때 약 2년 8개월에 걸쳐 축성되었다."),
        ("정조는 아버지 사도세자의 능을 옮긴 뒤 수원에 새 도시를 계획했다.", "참", "능 이전과 읍치 이전이 화성 건설의 배경이다."),
        ("화성성역의궤는 훗날 성곽 복원에 중요한 근거가 되었다.", "참", "공사 기록과 도설이 남아 복원에 활용되었다."),
        ("자격루를 이용해 화성의 돌을 들어 올렸다.", "거짓", "자격루는 물시계이며, 공사에는 거중기 등 장비가 활용되었다."),
        ("수원 화성은 고려 시대에 완공되었다.", "거짓", "조선 정조 때인 18세기 말에 축성되었다."),
    ],
    "자격루·앙부일구": [
        ("자격루는 정해진 시각에 종과 징, 북이 울리게 한 물시계이다.", "참", "물의 흐름과 기계 장치로 시간을 자동으로 알렸다."),
        ("앙부일구는 오목한 반구 모양의 해시계이다.", "참", "해 그림자가 오목한 시반면에 나타나는 구조이다."),
        ("앙부일구는 1434년 혜정교와 종묘 앞에 설치되었다.", "참", "백성이 많이 오가는 공공장소에 설치되었다."),
        ("자격루와 앙부일구는 작동 원리가 완전히 같은 기계이다.", "거짓", "자격루는 물, 앙부일구는 해 그림자를 이용한다."),
        ("장영실이 관직에서 물러난 뒤의 삶과 죽음은 모두 기록되어 있다.", "거짓", "가마 사고 이후 장영실에 대한 기록은 확인하기 어렵다."),
    ],
    "종묘와 종묘제례악": [
        ("종묘는 조선 왕과 왕비의 신주를 모신 왕실 사당이다.", "참", "조선 왕실의 조상을 모시고 제례를 지내는 공간이다."),
        ("종묘는 1995년 유네스코 세계유산에 등재되었다.", "참", "독특한 건축과 제례 전통의 가치를 인정받았다."),
        ("종묘 정전은 긴 수평선이 강조된 건물이다.", "참", "태실이 길게 이어진 독특한 건축 형식이다."),
        ("종묘제례악에는 음악만 있고 노래와 춤은 없다.", "거짓", "기악, 노래, 문무와 무무가 함께한다."),
        ("종묘는 왕이 일상생활을 하던 침실 건물이다.", "거짓", "왕실 조상을 위한 제례 공간이다."),
    ],
    "난중일기": [
        ("난중일기는 이순신이 전쟁 중 직접 쓴 일기이다.", "참", "임진왜란 시기 군중 생활을 기록한 친필 일기이다."),
        ("난중일기는 1592년부터 1598년까지의 기록을 담고 있다.", "참", "전쟁 시작 무렵부터 노량해전 직전까지의 기록이다."),
        ("난중일기에는 전투뿐 아니라 날씨와 개인의 생각도 나온다.", "참", "전황, 감정, 날씨, 지형과 백성의 삶을 함께 기록했다."),
        ("난중일기는 왕이 명령해 신하들이 함께 편찬한 공식 역사책이다.", "거짓", "이순신 개인이 현장에서 직접 기록한 일기이다."),
        ("난중일기는 2013년 유네스코 세계기록유산에 등재되었다.", "참", "전쟁 지휘관의 현장 기록으로서 가치를 인정받았다."),
    ],
}


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("SCore", str(FONT_ROOT / "SCDream5.ttf")))
    pdfmetrics.registerFont(TTFont("SCoreMedium", str(FONT_ROOT / "SCDream5.ttf")))
    pdfmetrics.registerFont(TTFont("SCoreBold", str(FONT_ROOT / "SCDream9.ttf")))
    pdfmetrics.registerFont(TTFont("SCoreHeavy", str(FONT_ROOT / "SCDream9.ttf")))


def styles_for(page_size):
    compact = page_size == A6
    medium = page_size == A5
    sample = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", parent=sample["Title"], fontName="SCoreHeavy", fontSize=22 if compact else 23 if medium else 29, leading=27 if compact else 29 if medium else 36, textColor=INK, spaceAfter=12, wordWrap="CJK"),
        "h1": ParagraphStyle("h1", parent=sample["Heading1"], fontName="SCoreBold", fontSize=15 if compact else 17 if medium else 19, leading=20 if compact else 22 if medium else 25, textColor=INK, spaceAfter=8, wordWrap="CJK"),
        "h2": ParagraphStyle("h2", parent=sample["Heading2"], fontName="SCoreBold", fontSize=11 if compact else 14, leading=15 if compact else 19, textColor=GREEN, spaceBefore=6, spaceAfter=6, wordWrap="CJK"),
        "body": ParagraphStyle("body", parent=sample["BodyText"], fontName="SCore", fontSize=8 if compact else 10, leading=12 if compact else 15, textColor=INK, wordWrap="CJK"),
        "small": ParagraphStyle("small", parent=sample["BodyText"], fontName="SCore", fontSize=6.4 if compact else 8, leading=9 if compact else 11, textColor=SOFT, wordWrap="CJK"),
        "label": ParagraphStyle("label", parent=sample["BodyText"], fontName="SCoreBold", fontSize=7 if compact else 9, leading=10 if compact else 12, textColor=RED, wordWrap="CJK"),
        "sheetTitle": ParagraphStyle("sheetTitle", parent=sample["Title"], fontName="SCoreHeavy", fontSize=24, leading=28, textColor=GREEN, spaceAfter=0, wordWrap="CJK"),
        "sheetTopic": ParagraphStyle("sheetTopic", parent=sample["BodyText"], fontName="SCoreBold", fontSize=12, leading=16, textColor=INK, wordWrap="CJK"),
        "identity": ParagraphStyle("identity", parent=sample["BodyText"], fontName="SCoreMedium", fontSize=9, leading=12, textColor=INK, alignment=2, wordWrap="CJK"),
        "tableHeader": ParagraphStyle("tableHeader", parent=sample["BodyText"], fontName="SCoreBold", fontSize=6.4 if compact else 8, leading=9 if compact else 11, textColor=colors.white, wordWrap="CJK"),
        "center": ParagraphStyle("center", parent=sample["BodyText"], fontName="SCoreBold", fontSize=10 if compact else 13, leading=14 if compact else 18, textColor=INK, alignment=TA_CENTER, wordWrap="CJK"),
        "source": ParagraphStyle("source", parent=sample["BodyText"], fontName="SCore", fontSize=5.5 if compact else 6.5, leading=8, textColor=SOFT, wordWrap="CJK"),
    }


def para(text, style):
    escaped = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
    return Paragraph(escaped, style)


def ruled_box(title, prompt, width, height, st):
    content = [para(title, st["label"]), Spacer(1, 2 * mm), para(prompt, st["small"])]
    table = Table([[content]], colWidths=[width], rowHeights=[height])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def data_table(rows, widths, st, header=True, font_size=8, row_heights=None):
    converted = []
    for row_index, row in enumerate(rows):
        style = st["tableHeader"] if header and row_index == 0 else st["small"]
        converted.append([cell if isinstance(cell, Paragraph) else para(cell, style) for cell in row])
    table = Table(converted, colWidths=widths, rowHeights=row_heights, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), GREEN), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white)]
    table.setStyle(TableStyle(commands))
    return table


def document_header(canvas, doc, era, lesson, audience):
    canvas.saveState()
    width, height = doc.pagesize
    if audience == "학생용":
        canvas.setFont("SCore", 6.5)
        canvas.setFillColor(SOFT)
        canvas.drawString(doc.leftMargin, 6.5 * mm, "인공지능과 역사")
        canvas.drawRightString(width - doc.rightMargin, 6.5 * mm, "S-Core Dream")
        canvas.restoreState()
        return
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, height - 13 * mm, width - doc.rightMargin, height - 13 * mm)
    canvas.setFont("SCoreBold", 7.5)
    canvas.setFillColor(GREEN)
    canvas.drawString(doc.leftMargin, height - 9.5 * mm, f"인공지능과 역사  |  {era['shortName']} {lesson['id']}차시  |  {audience}")
    canvas.setFont("SCore", 7)
    canvas.setFillColor(SOFT)
    canvas.drawRightString(width - doc.rightMargin, 8 * mm, f"{canvas.getPageNumber()} / S-Core Dream")
    canvas.restoreState()


def cover_story(era, lesson, audience, st, width):
    audience_label = "학생용 활동지 묶음" if audience == "학생용" else "교사용 지도안·운영 자료"
    return [
        Spacer(1, 22 * mm),
        para(f"{era['shortName']} · {lesson['id']}차시", st["label"]),
        para(lesson["title"], st["title"]),
        para(audience_label, st["h1"]),
        Spacer(1, 7 * mm),
        ruled_box("핵심 질문", lesson["keyQuestion"], width, 30 * mm, st),
        Spacer(1, 5 * mm),
        ruled_box("학습 목표", lesson["objective"], width, 27 * mm, st),
        Spacer(1, 7 * mm),
        para(f"이 자료에는 {', '.join(lesson['downloads']['student' if audience == '학생용' else 'teacher'])}이(가) 포함되어 있습니다.", st["small"]),
        Spacer(1, 5 * mm),
        para("학교 ________  학년·반 ________  이름 ____________________", st["body"]),
        PageBreak(),
    ]


def student_sheet_header(era, lesson, width, st):
    identity = Table(
        [[para(f"{era['shortName']} {lesson['id']}차시", st["sheetTitle"]), para("5학년 ______반   이름 ____________________", st["identity"])]],
        colWidths=[width * .44, width * .56],
    )
    identity.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 1.1, GREEN),
    ]))
    topic = Table(
        [
            [para("학습 주제", st["label"]), para(lesson["title"], st["sheetTopic"])],
            [para("학습 목표", st["label"]), para(lesson["objective"], st["small"])],
        ],
        colWidths=[24 * mm, width - 24 * mm],
    )
    topic.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_SOFT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return [identity, Spacer(1, 4 * mm), topic, Spacer(1, 5 * mm)]


def sheet_columns(left, right, width, st, left_ratio=.5, divider=False):
    gap = 5 * mm
    left_width = (width - gap) * left_ratio
    right_width = width - gap - left_width
    table = Table([[left, "", right]], colWidths=[left_width, gap, right_width], hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]
    if divider:
        commands.append(("LINEBEFORE", (1, 0), (1, 0), 0.8, LINE, None, (2, 2)))
    table.setStyle(TableStyle(commands))
    return table


def three_kingdoms_data_sheet(era, lesson, width, st):
    flow = student_sheet_header(era, lesson, width, st)
    lesson_id = lesson["id"]

    if lesson_id == 1:
        questions = [["관찰할 유산", "눈에 보이는 특징", "모으고 싶은 데이터"]] + [[group["heritage"], "", ""] for group in era["groups"]]
        flow += [data_table(questions, [width * .28, width * .36, width * .36], st, row_heights=[10 * mm] + [32 * mm] * 6)]
    elif lesson_id == 2:
        flow += [ruled_box("AI 답변에서 의심되는 문장", "교사가 보여 준 답변에서 틀렸거나 더 확인해야 할 문장을 옮겨 쓰고, 단정 표현에 밑줄을 그으세요.", width, 130 * mm, st), Spacer(1, 4 * mm)]
        flow += [sheet_columns(
            [ruled_box("왜 의심했나요?", "출처가 없나요? 너무 구체적인가요? 여러 의견 중 하나를 사실처럼 말했나요?", width * .47, 100 * mm, st)],
            [ruled_box("어떻게 확인할까요?", "찾아볼 공식 자료와 다음 시간에 확인할 질문을 적으세요.", width * .47, 100 * mm, st)],
            width, st,
        )]
    elif lesson_id == 3:
        compare_rows = [
            ["자료", "찾은 설명", "근거·원본", "판단"],
            ["국가기관 자료", "", "", "확인 / 추가 확인 / 보류"],
            ["여행 블로그", "", "", "확인 / 추가 확인 / 보류"],
            ["AI 요약문", "", "", "확인 / 추가 확인 / 보류"],
        ]
        questions = {
            "출처": "누가 왜 만들었나요?",
            "시기": "유산의 시대와 작성 시기는 언제인가요?",
            "교차": "다른 자료도 같은 말인가요?",
            "원본": "최초 기록·유물 정보까지 확인했나요?",
            "보류": "근거가 부족한 내용을 '아직 모름'으로 남겼나요?",
        }
        verify_rows = [["단계", "확인 질문", "기록"]] + [[step, questions[step], "□"] for step in era["verificationSteps"]]
        flow += [
            data_table(compare_rows, [width * .16, width * .32, width * .29, width * .23], st, row_heights=[10 * mm] + [22 * mm] * 3),
            Spacer(1, 5 * mm),
            data_table(verify_rows, [width * .13, width * .70, width * .17], st, row_heights=[9 * mm] + [13 * mm] * 5),
            Spacer(1, 5 * mm),
            ruled_box("최종 판단", "가장 믿을 만한 자료와 그 까닭을 적으세요. 아직 확인할 수 없는 내용은 '아직 모름'으로 남기세요.", width, 50 * mm, st),
        ]
    elif lesson_id == 4:
        investigation_rows = [
            ["조사 항목", "공식 자료에서 확인한 내용을 자기 말로 적기"],
            ["제작 시기", ""],
            ["만든 사람·집단과 목적", ""],
            ["유산의 가치", ""],
            ["현재 상태", ""],
        ]
        left_width = (width - 5 * mm) * .56
        right_width = width - 5 * mm - left_width
        flow += [sheet_columns(
            [data_table(investigation_rows, [left_width * .27, left_width * .73], st, row_heights=[10 * mm] + [25 * mm] * 4)],
            [
                ruled_box("AI 오류 바로잡기", "AI가 한 말: __________________________________\n근거로 고친 문장: _____________________________", right_width, 52 * mm, st),
                Spacer(1, 4 * mm),
                ruled_box("아직 모름", "자료를 찾아도 확인하지 못했거나 의견이 나뉘는 점을 억지로 채우지 말고 남기세요.", right_width, 54 * mm, st),
            ],
            width, st, left_ratio=.56,
        ), Spacer(1, 5 * mm)]
        source_rows = [["번호", "기관·자료 제목", "원문 주소 또는 자료집 쪽", "확인한 날짜"]] + [[str(index), "", "", ""] for index in range(1, 4)]
        flow += [data_table(source_rows, [width * .09, width * .32, width * .43, width * .16], st, row_heights=[10 * mm] + [18 * mm] * 3)]
    elif lesson_id == 5:
        cleaning_rows = [
            ["정제 항목", "찾은 문제", "처리 방법", "수정 이유"],
            ["중복 행", "", "", ""],
            ["빈칸", "", "", ""],
            ["표기 차이", "", "", ""],
            ["시기·연도", "", "", ""],
            ["출처", "", "", ""],
        ]
        flow += [data_table(cleaning_rows, [width * .16, width * .27, width * .27, width * .30], st, row_heights=[10 * mm] + [20 * mm] * 5), Spacer(1, 5 * mm)]
        left_width = (width - 5 * mm) * .47
        right_width = width - 5 * mm - left_width
        flow += [sheet_columns(
            [ruled_box("정제 전후 확인", "정제 전 행 수: ______개\n정제 후 행 수: ______개\n내보낸 파일명: ____________________", left_width, 55 * mm, st)],
            [ruled_box("마지막 점검", "□ 유산명·나라·지역 표기를 통일했다.\n□ 빈칸을 추측해 채우지 않았다.\n□ 출처와 확인 날짜를 남겼다.", right_width, 55 * mm, st)],
            width, st, left_ratio=.47,
        ), Spacer(1, 4 * mm)]
        flow += [ruled_box("우리 모둠 정제 규칙", "같은 문제를 다시 만났을 때 적용할 규칙을 한 문장으로 적으세요.", width, 36 * mm, st)]
    elif lesson_id == 6:
        rows = [["그래프 요소", "우리 모둠 선택", "확인"], ["탐구 질문", "", "□"], ["가로축", "", "□"], ["세로축", "", "□"], ["제목", "", "□"], ["단위", "", "□"]]
        flow += [data_table(rows, [width * .2, width * .65, width * .15], st, row_heights=[10 * mm] + [21 * mm] * 5), Spacer(1, 5 * mm)]
        flow += [ruled_box("그래프에서 가장 먼저 보이는 점", "가장 큰 값·작은 값·반복되는 모습을 한 문장으로 적으세요.", width, 60 * mm, st), Spacer(1, 4 * mm)]
        flow += [ruled_box("저장 확인", "□ 축 이름   □ 제목   □ 단위   □ PNG 저장   파일명: ______________________________", width, 42 * mm, st)]
    elif lesson_id == 7:
        flow += [sheet_columns([ruled_box("그래프에서 보이는 점", "값과 항목을 가리키며 관찰한 내용을 2가지 적으세요.", width * .47, 82 * mm, st)], [ruled_box("그래프만으로 모르는 점", "자료 수·지역·시기·사람의 범위를 살펴 2가지 적으세요.", width * .47, 82 * mm, st)], width, st), Spacer(1, 4 * mm)]
        flow += [ruled_box("1분 발표 문장", "이 그래프는 __________________을 비교했습니다. __________________ 경향이 보이지만, __________________까지는 알 수 없습니다.", width, 56 * mm, st)]
    elif lesson_id == 8:
        rows = [["구분", "자료에서 찾은 내용", "출처·그래프 위치"], ["근거 1", "", ""], ["근거 2", "", ""], ["두 근거의 관계", "", ""]]
        flow += [data_table(rows, [width * .2, width * .52, width * .28], st, row_heights=[10 * mm] + [25 * mm] * 3), Spacer(1, 4 * mm)]
        flow += [ruled_box("과거 유추", "위 근거를 함께 보면, 옛사람들은 ____________________________________________했을 가능성이 있습니다.", width, 55 * mm, st), Spacer(1, 3 * mm)]
        flow += [ruled_box("유추의 한계", "확인된 사실처럼 단정하지 않기 위해 더 필요한 자료를 적으세요.", width, 36 * mm, st)]
    elif lesson_id == 9:
        evidence_rows = [
            ["해설 근거", "우리 모둠이 사용할 내용", "출처·그래프 위치"],
            ["CODAP 그래프 경향", "", ""],
            ["확인한 역사 사실", "", ""],
            ["아직 모르는 점", "", ""],
        ]
        flow += [data_table(evidence_rows, [width * .22, width * .52, width * .26], st, row_heights=[10 * mm] + [27 * mm] * 3), Spacer(1, 4 * mm)]
        design_rows = [
            ["AR 해설 요소", "우리 모둠의 결정"],
            ["등장 요소", ""],
            ["움직임", ""],
            ["한 문장 해설", ""],
            ["관람객 행동", ""],
        ]
        flow += [data_table(design_rows, [width * .24, width * .76], st, row_heights=[10 * mm] + [18 * mm] * 4), Spacer(1, 4 * mm)]
        flow += [ruled_box("30초 도슨트 대본", "그래프에서 보이는 점 → 역사 자료로 확인한 사실 → 아직 모르는 점 순서로 말하세요.", width, 50 * mm, st)]
    else:
        stamp_rows = [["부스", "문화유산", "그래프", "AR", "질문"]] + [[f"{group['id']}모둠", group["heritage"], "□", "□", "□"] for group in era["groups"]]
        flow += [data_table(stamp_rows, [width * .14, width * .42, width * .14, width * .14, width * .16], st, row_heights=[8 * mm] + [10 * mm] * 6), Spacer(1, 3 * mm)]
        flow += [sheet_columns([ruled_box("1차시의 나", "처음에는 역사 데이터와 AI를 어떻게 생각했나요?", width * .47, 36 * mm, st)], [ruled_box("지금의 나", "지금은 자료를 어떤 순서로 확인하나요?", width * .47, 36 * mm, st)], width, st), Spacer(1, 3 * mm)]
        flow += [ruled_box("나의 AI·데이터 활용 다짐", "나는 먼저 __________________을 확인하고, 그래프의 __________________까지 함께 말하겠습니다.", width, 28 * mm, st)]

    return flow


def student_lesson_sheet(era, lesson, width, st):
    if era["id"] == "three-kingdoms":
        return three_kingdoms_data_sheet(era, lesson, width, st)

    flow = student_sheet_header(era, lesson, width, st)
    lesson_id = lesson["id"]

    if lesson_id == 1:
        role_rows = [["역할", "이름", "오늘 할 일"], ["자료", "", "자료 찾기"], ["기록", "", "근거 남기기"], ["기기", "", "기기·파일 관리"], ["발표", "", "의견 전달"]]
        left = [ruled_box("나의 첫 생각", f"{era['shortName']} 또는 우리 모둠 유산을 생각하면 무엇이 떠오르나요?", width * .47, 110 * mm, st)]
        right = [data_table(role_rows, [width * .11, width * .12, width * .24], st, row_heights=[10 * mm] + [25 * mm] * 4)]
        flow += [sheet_columns(left, right, width, st), Spacer(1, 5 * mm)]
        flow += [ruled_box("AI를 얼마나 믿나요?", "0(거의 믿지 않음)  1  2  3  4  5(매우 믿음)   선택한 까닭: ______________________________________________", width, 50 * mm, st), Spacer(1, 4 * mm)]
        flow += [ruled_box("수업 뒤 다시 볼 나의 문장", "AI가 역사 질문에 답하면 나는 ______________________________________________________________", width, 60 * mm, st)]
    elif lesson_id == 2:
        flow += [ruled_box("AI 답변에서 의심되는 문장", "답변을 붙이거나 옮겨 쓰고, 이상한 부분에 밑줄을 그으세요.", width, 130 * mm, st), Spacer(1, 4 * mm)]
        flow += [sheet_columns(
            [ruled_box("왜 이상하다고 생각했나요?", "시기·인물·나라·출처·단정 표현을 살펴보세요.", width * .47, 100 * mm, st)],
            [ruled_box("어떻게 확인할까요?", "찾아볼 자료와 확인할 질문을 적으세요.", width * .47, 100 * mm, st)],
            width, st,
        )]
    elif lesson_id == 3:
        compare_rows = [["자료", "무엇을 알게 되었나요?", "믿을까?"], ["국가기관", "", "○ △ ×"], ["블로그·영상", "", "○ △ ×"], ["AI 답변", "", "○ △ ×"]]
        questions = {"출처": "누가 만들었나요?", "시기": "언제 만든 자료인가요?", "교차": "다른 자료도 같은 말인가요?", "원본": "원래 자료를 보았나요?", "보류": "모르면 '아직 모름'으로 남겼나요?"}
        verify_rows = [["확인할 것", "해 보았나요?"]] + [[questions[step], "□ 네"] for step in era["verificationSteps"]]
        left_width = (width - 5 * mm) * .55
        right_width = width - 5 * mm - left_width
        flow += [sheet_columns(
            [data_table(compare_rows, [left_width * .22, left_width * .58, left_width * .2], st, row_heights=[10 * mm] + [30 * mm] * 3)],
            [data_table(verify_rows, [right_width * .76, right_width * .24], st, row_heights=[10 * mm] + [18 * mm] * len(era["verificationSteps"]))],
            width, st, left_ratio=.55,
        ), Spacer(1, 5 * mm), ruled_box("내 결론", "□ 믿을 수 있어요   □ 더 확인해야 해요   □ 아직 모르겠어요\n그렇게 생각한 까닭을 한 문장으로 적어 보세요.", width, 120 * mm, st)]
    elif lesson_id == 4:
        investigation_rows = [["궁금한 것", "찾은 내용"], ["언제 만들었나요?", ""], ["누가, 왜 만들었나요?", ""], ["왜 중요한 유산인가요?", ""], ["AI가 틀리게 말한 것은?", ""]]
        flow += [data_table(investigation_rows, [width * .27, width * .73], st, row_heights=[10 * mm] + [30 * mm] * 4), Spacer(1, 5 * mm)]
        source_rows = [["어디서 찾았나요?", "왜 믿을 수 있나요?"], ["", ""], ["", ""]]
        final_label = "아직 모름으로 남길 점" if era["id"] == "three-kingdoms" else "드라마·통념과 다른 사실"
        flow += [sheet_columns(
            [data_table(source_rows, [width * .25, width * .25], st, row_heights=[10 * mm] + [42.5 * mm] * 2)],
            [ruled_box(final_label, "확실하지 않은 내용은 억지로 답하지 않아도 괜찮아요.", width * .45, 95 * mm, st)],
            width, st, left_ratio=.53,
        )]
    elif lesson_id == 5:
        eval_rows = [["살펴볼 것", "좋았던 점", "고치고 싶은 점"], ["카드가 잘 보이나요?", "", ""], ["움직임이 재미있나요?", "", ""], ["설명이 잘 들리나요?", "", ""]]
        plan_rows = [["우리 AR에 넣을 것", "우리 모둠 생각"], ["무엇이 나오나요?", ""], ["관람객은 무엇을 하나요?", ""], ["어떤 한 문장을 말하나요?", ""]]
        flow += [sheet_columns(
            [data_table(eval_rows, [width * .18, width * .16, width * .16], st, row_heights=[10 * mm] + [22 * mm] * 3)],
            [data_table(plan_rows, [width * .22, width * .23], st, row_heights=[10 * mm] + [22 * mm] * 3)],
            width, st, left_ratio=.53,
        ), Spacer(1, 5 * mm), ruled_box("AR 카드 스케치", "굵은 선과 뚜렷한 무늬로 카드 모습을 크게 그려 보세요.", width, 145 * mm, st)]
    elif lesson_id == 6:
        evidence_rows = [["번호", "내 생각", "그렇게 생각한 까닭·본 자료"]] + [[str(i), "참 / 거짓 / 아직 모름", ""] for i in range(1, 7)]
        flow += [para("문장을 읽고 내 생각을 고른 뒤, 왜 그렇게 생각했는지 적어 보세요.", st["small"]), Spacer(1, 3 * mm)]
        flow += [data_table(evidence_rows, [width * .1, width * .26, width * .64], st, row_heights=[10 * mm] + [22 * mm] * 6), Spacer(1, 5 * mm)]
        flow += [ruled_box("오늘 새롭게 알게 된 것", "처음 생각과 달라진 점을 한 문장으로 적어 보세요.", width, 55 * mm, st)]
    elif lesson_id == 7:
        front = [ruled_box("A6 카드 앞면 원화", "굵은 선·뚜렷한 명암·비대칭 구성을 적용해 그리세요. 테두리 5mm는 비워 둡니다.", width * .47, 128 * mm, st)]
        back = [ruled_box("A6 카드 뒷면", "유산 이름:\n한 문장 해설:\n확인한 출처:\nQR 자리:\n모둠·역할:", width * .47, 128 * mm, st)]
        flow += [para("앞면과 뒷면을 완성한 뒤 점선을 따라 잘라 카드로 사용하세요.", st["small"]), Spacer(1, 3 * mm), sheet_columns(front, back, width, st, divider=True)]
    elif lesson_id == 8:
        script_rows = [["말할 순서", "내가 할 말"], ["1. 유산 이름", ""], ["2. 중요한 사실", ""], ["3. AI가 틀린 점과 확인 방법", ""], ["4. 관람객에게 할 질문", ""]]
        check_rows = [["연습한 뒤 확인해요", "체크"], ["30초 안에 말했나요?", "□"], ["쉬운 말로 설명했나요?", "□"], ["확인한 근거가 있나요?", "□"], ["또렷하게 말했나요?", "□"], ["촬영 전 동의를 받았나요?", "□"]]
        flow += [sheet_columns(
            [data_table(script_rows, [width * .2, width * .35], st, row_heights=[10 * mm] + [24 * mm] * 4)],
            [data_table(check_rows, [width * .35, width * .1], st, row_heights=[10 * mm] + [19.2 * mm] * 5)],
            width, st, left_ratio=.58,
        ), Spacer(1, 5 * mm), ruled_box("내 30초 해설", "친구에게 이야기하듯 쉬운 말로 이어서 적어 보세요.", width, 125 * mm, st)]
    elif lesson_id == 9:
        test_rows = [["어디서 해 보았나요?", "잘 되었나요?", "무엇을 고칠까요?"], ["밝은 곳", "○ △ ×", ""], ["어두운 곳", "○ △ ×", ""], ["가까이·멀리", "○ △ ×", ""], ["QR로 보기", "○ △ ×", ""]]
        question_rows = [["관람객이 물을 것", "우리의 쉬운 답"], ["1.", ""], ["2.", ""]]
        role_rows = [["부스에서 할 일", "이름"], ["해설하기", ""], ["AR 도와주기", ""], ["질문받기", ""]]
        flow += [data_table(test_rows, [width * .25, width * .18, width * .57], st, row_heights=[10 * mm] + [24 * mm] * 4), Spacer(1, 5 * mm)]
        flow += [sheet_columns(
            [data_table(question_rows, [width * .18, width * .37], st, row_heights=[10 * mm] + [52 * mm] * 2)],
            [data_table(role_rows, [width * .28, width * .17], st, row_heights=[10 * mm] + [34.7 * mm] * 3)],
            width, st, left_ratio=.58,
        )]
    elif lesson_id == 10:
        stamp_rows = [["부스", "문화유산", "스탬프"]] + [[f"{g['id']}모둠", g["heritage"], "□"] for g in era["groups"]]
        left = [data_table(stamp_rows, [width * .1, width * .27, width * .1], st, row_heights=[9 * mm] + [13 * mm] * 6), Spacer(1, 4 * mm), ruled_box("가장 인상 깊었던 부스", "까닭과 학생 해설사에게 전할 말을 적으세요.", width * .47, 43 * mm, st)]
        right = [ruled_box("1차시의 나", "처음에는 AI와 역사 정보를 어떻게 생각했나요?", width * .47, 38 * mm, st), Spacer(1, 3 * mm), ruled_box("지금의 나", "지금은 무엇을 먼저 확인하나요?", width * .47, 38 * mm, st), Spacer(1, 3 * mm), ruled_box("나의 AI 활용 다짐", "나는 먼저 __________________ 을/를 확인하고, __________________ 하겠습니다.\n서명 __________________", width * .47, 48 * mm, st)]
        flow += [para("가운데 점선을 따라 접으면 A5 관람 스탬프북이 됩니다.", st["small"]), Spacer(1, 3 * mm), sheet_columns(left, right, width, st, divider=True)]

    return flow


def activity_answer_examples(era, lesson):
    is_three = era["id"] == "three-kingdoms"
    first_heritage = era["groups"][0]["heritage"]
    if is_three:
        data_examples = {
            1: [
                ("무령왕릉", "특징: 벽돌로 쌓은 아치 모양 입구, 연꽃무늬 벽돌 · 모으고 싶은 데이터: 만든 연도, 유물 개수, 크기"),
                ("백제 금동대향로", "특징: 꼭대기의 봉황, 연꽃무늬, 용 모양 받침 · 모으고 싶은 데이터: 동물 마리 수, 높이, 용도, 발견 위치"),
                ("첨성대", "특징: 돌을 층층이 쌓은 몸통, 가운데 네모난 창 · 모으고 싶은 데이터: 돌 개수, 높이, 만든 연도"),
                ("신라 금관", "특징: 나뭇가지 모양 장식, 굽은옥과 달개 · 모으고 싶은 데이터: 무게, 굽은옥 수, 만든 시기"),
                ("고구려 고분벽화", "특징: 벽에 그린 사냥 그림, 말을 탄 사람 · 모으고 싶은 데이터: 그림 종류, 사람 수, 색깔"),
                ("가야 고분군", "특징: 능선을 따라 늘어선 크고 작은 무덤 · 모으고 싶은 데이터: 무덤 수, 크기, 위치"),
            ],
            2: [("의심되는 문장", "예: 신라 금관은 왕이 살아 있을 때 매일 머리에 쓰던 관이다."), ("왜 의심하는가", "출토 상황과 구조만으로 실제 착용 여부를 확정하기 어렵고, 확인할 출처가 제시되지 않았습니다."), ("확인 방법", "국가유산청·국립박물관 자료에서 출토 위치와 연구 설명을 비교하고, 결론이 나지 않으면 판단을 보류합니다.")],
            3: [
                ("자료 3종 비교", "국가기관 자료·여행 블로그·AI 요약문이 무엇을 근거로 설명하는지 같은 표에서 비교합니다."),
                ("출처·시기", "누가 왜 만든 자료인지 확인하고, 유산의 시대와 설명문이 작성된 시기를 구분합니다."),
                ("교차·원본", "다른 기관 자료와 같은 내용인지 비교하고, 요약문에서 최초 기록·유물 정보까지 거슬러 올라갑니다."),
                ("보류", "첨성대의 정확한 관측 방법처럼 근거가 부족하거나 의견이 나뉘는 내용은 '아직 모름'으로 남깁니다."),
                ("최종 판단", "예: 국가기관 자료를 출발점으로 사용하되 확인된 범위만 기록하고, 정확한 관측 방법은 보류한다."),
            ],
            4: [
                ("조사 예시", "백제 금동대향로는 1993년 부여 능산리 절터에서 발견되었으며, 청동으로 만든 뒤 표면에 금을 입힌 유물입니다."),
                ("AI 오류 바로잡기", "‘향로의 모든 동물은 정확한 뜻이 밝혀졌다’는 설명은 과장입니다. 사진에서 모양은 확인할 수 있지만 모든 상징의 뜻을 하나로 단정할 수 없습니다."),
                ("아직 모름", "향로의 모든 인물·동물 무늬가 각각 무엇을 뜻하는지는 확인된 범위와 해석을 구분해 남깁니다."),
                ("출처", "국립부여박물관 백제금동대향로 소장품 설명처럼 기관명·자료 제목·원문 주소·확인 날짜를 함께 기록합니다."),
                ("평가 기준", "시기·목적·가치·현재 상태를 자기 말로 쓰고, AI 오류와 아직 모르는 점을 출처 근거에 맞게 구분하면 됩니다."),
            ],
            5: [
                ("중복 행", "같은 유산·같은 출처가 반복된 행은 원자료를 확인한 뒤 하나만 남기고, 삭제 이유를 기록합니다."),
                ("빈칸", "모르는 값을 추측해 채우지 않고 ‘확인 필요’로 표시하거나 분석에서 제외한 까닭을 남깁니다."),
                ("표기 차이", "‘고구려’, ‘高句麗’, ‘고구려 시대’처럼 같은 뜻의 값은 학급 표준표에 따라 하나의 표현으로 통일합니다."),
                ("시기·연도", "정확한 연도가 확인되지 않으면 임의의 숫자를 만들지 않고 확인된 시대 범위를 기록합니다."),
                ("정제 기록", "무엇을 어떻게 바꾸었는지와 출처를 함께 남기고, 정제된 표를 CSV로 내려받습니다."),
            ],
            6: [("그래프 선택", "탐구 질문이 지역 비교라면 지역과 자료 종류처럼 질문에 직접 연결되는 축을 고릅니다."), ("필수 요소", "가로축·세로축 이름, 제목, 단위를 확인합니다."), ("정확한 연도", "발견·발굴·지정 연도처럼 실제 연도가 있는 자료만 연도축에 사용합니다.")],
            7: [("보이는 점", "예: 이 자료에서는 경주 지역의 건축·장신구 자료가 다른 종류보다 많이 보입니다."), ("모르는 점", "자료 수가 적거나 왕족·귀족 자료가 중심이면 전체 사람의 생활로 일반화할 수 없습니다."), ("발표", "그래프의 값 → 경향 → 자료의 한계 순서로 말합니다.")],
            8: [("근거 1·2", "예: 여러 지역에 고분군이 있고 지역별 껴묻거리 차이가 함께 나타납니다."), ("과거 유추", "가야의 여러 정치체가 서로 교류하면서도 지역 특징을 유지했을 가능성이 있습니다."), ("표현", "확인된 사실처럼 단정하지 않고 ‘가능성이 있다’고 씁니다.")],
            9: [("그래프 경향", "CODAP 그래프에서 실제로 보이는 값이나 차이를 한 문장으로 말합니다."), ("역사 사실", "4차시 공식 자료에서 확인한 사실을 그래프와 연결하고 출처를 밝힙니다."), ("AR 표현", "확인한 특징만 장면으로 만들고, 아직 모르는 부분은 해설에서 분명히 밝힙니다."), ("30초 대본", "그래프에서 보이는 점 → 확인한 역사 사실 → 아직 모르는 점 순서로 설명합니다.")],
            10: [("전시 해설", "그래프의 경향 → 과거 유추 → AR로 표현한 확인 사실 → 자료의 한계 순서로 설명합니다."), ("AR 실패", "그래프 PNG와 QR 대체 자료로 설명을 계속합니다."), ("성장 비교", "1차시 첫 생각과 지금의 자료 확인 방법이 어떻게 달라졌는지 근거를 들어 씁니다.")],
        }
        return data_examples[lesson["id"]]

    examples = {
        1: [
            ("나의 첫 생각", "정해진 답은 없습니다. " + ("예: 금관, 고분, 벽화, 여러 나라" if is_three else "예: 한글, 궁궐, 기록, 과학 기구")),
            ("AI를 믿는 정도", "점수보다 까닭을 확인합니다. 예: 3점 - 빠르게 알려 주지만 틀릴 수도 있어서 다시 확인해야 한다."),
            ("모둠 역할", "모든 학생에게 역할이 있고, 이름과 할 일이 서로 맞으면 됩니다."),
        ],
        2: [
            ("의심되는 문장", "예: " + ("첨성대에서 어떤 방식으로 관측했는지 모두 밝혀졌다." if is_three else "장영실이 관직에서 물러난 뒤의 삶이 모두 기록되어 있다.")),
            ("왜 이상한가", "'모두', '반드시'처럼 지나치게 확실하게 말하며, 확인할 출처가 적혀 있지 않다."),
            ("확인 방법", "국가유산청·국립박물관 자료에서 같은 내용을 찾고, 만든 기관과 날짜를 확인한다."),
        ],
        3: [
            ("자료 비교", "국가기관 자료는 만든 곳과 근거가 분명한지 확인한다. 블로그와 AI 답변은 원래 자료를 다시 찾아본다."),
            ("확인 순서", "누가 만들었나 → 언제 만들었나 → 다른 자료도 같은가 → 원래 자료가 있는가" + (" → 모르면 아직 모름" if is_three else "")),
            ("내 결론", "예: 국가유산청과 국립박물관 자료에서 같은 내용을 확인했으므로 믿을 수 있다."),
        ],
        4: [
            ("조사 예시", ("무령왕릉은 백제 무령왕과 왕비의 벽돌무덤이며 지석으로 주인을 확인했다." if is_three else "훈민정음 해례본은 1446년에 간행되었고 새 문자의 원리와 쓰는 법을 설명한다.")),
            ("자료 출처", ("국립중앙박물관 무령왕릉 해설" if is_three else "국가유산청 훈민정음 해례본 안내")),
            ("모르는 점", ("첨성대의 구체적인 관측 방법처럼 자료만으로 확정하기 어려운 내용은 '아직 모름'으로 남긴다." if is_three else "드라마 장면은 기록과 같지 않을 수 있으므로 확인된 사실과 나누어 쓴다.")),
        ],
        5: [
            ("체험 평가", "예: 카드는 잘 보이지만 설명이 길다. 한 문장 설명으로 줄이면 좋겠다."),
            ("AR 계획", f"예: {first_heritage}의 중요한 특징이 나타나고, 관람객이 한 곳을 눌러 설명을 듣는다."),
            ("스케치 확인", "유산의 특징이 크게 보이고, 선과 무늬가 뚜렷하며, 글이 너무 많지 않으면 됩니다."),
        ],
        6: [
            ("판단 방법", "문장을 먼저 읽고 참·거짓·아직 모름 중 하나를 고른 뒤, 본 자료를 적습니다."),
            ("근거 예시", ("'첨성대는 나무로 지었다'는 거짓이다. 국가유산청 자료에서 돌로 쌓은 건축물임을 확인했다." if is_three else "'자격루와 앙부일구는 같은 원리다'는 거짓이다. 하나는 물, 하나는 해 그림자를 이용한다.")),
            ("수업 뒤 정리", "정답만 맞힌 경우보다 판단을 바꾼 까닭과 확인한 자료를 설명한 경우를 높게 봅니다."),
        ],
        7: [
            ("앞면", "유산의 대표 모양이 크게 보이고, 카메라가 알아보기 쉬운 굵은 선과 뚜렷한 무늬가 있어야 합니다."),
            ("뒷면", "유산 이름, 확인한 한 문장, 출처, QR 자리, 모둠 이름이 빠짐없이 들어가야 합니다."),
            ("역사 내용", "예쁜 그림보다 유산이 당시 사람들의 생각이나 생활을 어떻게 보여 주는지가 드러나야 합니다."),
        ],
        8: [
            ("30초 해설 예시", ("무령왕릉은 지석 덕분에 주인을 알 수 있는 백제 무덤입니다. 벽돌과 여러 출토품을 보면 백제의 장례와 교류 모습을 짐작할 수 있습니다." if is_three else "훈민정음 해례본은 새 글자의 원리와 쓰는 법을 담은 책입니다. 이 책을 통해 백성이 쉽게 글을 익히게 하려는 생각을 살펴볼 수 있습니다.")),
            ("확인할 점", "유산 이름 → 중요한 사실 → 확인한 자료 → 관람객 질문 순서가 있으면 됩니다."),
            ("말하기", "문장을 외우는 것보다 쉬운 말로 정확하게 설명하는지를 확인합니다."),
        ],
        9: [
            ("AR 시험", "○만 고르는 것이 목표가 아닙니다. 잘 안 된 조건과 고칠 방법을 구체적으로 적으면 됩니다."),
            ("예상 질문", f"예: {first_heritage}에서 가장 중요한 단서는 무엇인가요?"),
            ("쉬운 답", "자료에서 확인한 사실 한 가지와 그 사실로 짐작한 생활 모습을 이어서 말합니다."),
        ],
        10: [
            ("1차시의 나", "예: 처음에는 AI가 알려 주면 대부분 맞는다고 생각했다."),
            ("지금의 나", "예: 이제는 누가 만든 자료인지 보고 다른 자료와 같은지 확인한다."),
            ("AI 활용 다짐", "예: 나는 먼저 출처를 확인하고, 모르는 내용은 다시 찾아보겠습니다."),
        ],
    }
    return examples[lesson["id"]]


def answer_guide_sheet(era, lesson, width, st):
    title = Table(
        [[para(f"{era['shortName']} {lesson['id']}차시 활동지 답안", st["sheetTitle"]), para("초등학교 5학년 · 교사용", st["identity"])]],
        colWidths=[width * .67, width * .33],
    )
    title.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, INK),
    ]))
    standards = " / ".join(f"[{item['code']}] {item['description']}" for item in era["curriculumStandards"])
    overview = Table(
        [
            [para("학습 주제", st["label"]), para(lesson["title"], st["sheetTopic"])],
            [para("성취기준", st["label"]), para(standards, st["small"])],
        ],
        colWidths=[25 * mm, width - 25 * mm],
    )
    overview.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_SOFT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    rows = [["활동", "예시 답안·확인 기준"]] + [[label, answer] for label, answer in activity_answer_examples(era, lesson)]
    flow = [
        title,
        Spacer(1, 4 * mm),
        overview,
        Spacer(1, 4 * mm),
        ruled_box("답안 사용 안내", "아래 내용은 예시입니다. 학생이 다른 답을 써도 역사 자료에 맞는 근거를 말하면 정답으로 인정합니다.", width, 24 * mm, st),
        Spacer(1, 4 * mm),
        data_table(rows, [width * .22, width * .78], st, row_heights=[10 * mm] + [27 * mm] * (len(rows) - 1)),
        Spacer(1, 5 * mm),
    ]
    if lesson["id"] == 4 and era["id"] == "three-kingdoms":
        flow += [PageBreak(), para("모둠별 확인 내용과 판단 보류", st["h1"]), Spacer(1, 3 * mm)]
        references = [["모둠·문화유산", "공식 자료로 확인할 핵심", "아직 모름에 남길 점"]]
        for group in era["groups"]:
            confirmed, unknown, _ = LESSON_FOUR_NOTES[group["heritage"]]
            references.append([f"{group['id']}모둠\n{group['heritage']}", confirmed, unknown])
        flow += [
            data_table(references, [width * .19, width * .42, width * .39], st, row_heights=[10 * mm] + [22 * mm] * 6),
            Spacer(1, 5 * mm),
            ruled_box("교사 확인 질문", "어느 자료에서 확인했나요? / 자료가 말한 범위를 넘어서 단정하지 않았나요? / 아직 모르는 점을 질문으로 남겼나요?", width, 34 * mm, st),
        ]
    elif lesson["id"] in (5, 7, 8, 10):
        references = [["모둠", "문화유산", "교사가 확인할 핵심 사실"]]
        for group in era["groups"]:
            fact, verdict, reason = QUIZ_BANK[group["heritage"]][0]
            references.append([f"{group['id']}모둠", group["heritage"], reason])
        flow += [para("모둠별 핵심 내용", st["h2"]), data_table(references, [width * .12, width * .24, width * .64], st, row_heights=[9 * mm] + [12 * mm] * 6)]
    else:
        flow += [ruled_box("교사 확인", f"평가 기준: {lesson['assessment']['criterion']}\n학생 답에서 근거로 사용한 자료와 생각이 바뀐 까닭을 함께 확인하세요.", width, 58 * mm, st)]
    return flow


def build_answer_pdf(era, lesson, destination):
    doc = SimpleDocTemplate(
        str(destination),
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=15 * mm,
        bottomMargin=10 * mm,
        title=f"{era['shortName']} {lesson['id']}차시 활동지 답안",
        author="인공지능과 역사",
    )
    st = styles_for(A4)
    st["small"] = ParagraphStyle("answerSmall", parent=st["small"], fontSize=8.7, leading=12)
    st["label"] = ParagraphStyle("answerLabel", parent=st["label"], fontSize=9.2, leading=12)
    st["tableHeader"] = ParagraphStyle("answerTableHeader", parent=st["tableHeader"], fontSize=8.2, leading=11)
    width = A4[0] - doc.leftMargin - doc.rightMargin
    story = answer_guide_sheet(era, lesson, width, st)
    if lesson["id"] == 6 and era["id"] != "three-kingdoms":
        story += [PageBreak(), para("검증 공방 30문항 정답·해설", st["h1"]), Spacer(1, 3 * mm)]
        story += quiz_operation_pages(era, width, st, include_answers=True)
    doc.build(
        story,
        onFirstPage=lambda c, d: document_header(c, d, era, lesson, "교사용 답안"),
        onLaterPages=lambda c, d: document_header(c, d, era, lesson, "교사용 답안"),
    )


def resource_heading(name, lesson, st):
    return [para(f"{lesson['id']}차시 활동 자료", st["label"]), para(name, st["h1"]), para(f"목표: {lesson['objective']}", st["small"]), Spacer(1, 4 * mm)]


def student_resource(era, lesson, name, width, st):
    flow = resource_heading(name, lesson, st)
    verification = era["verificationSteps"]
    if "첫 생각" in name:
        flow += [
            ruled_box("1. 지금 떠오르는 것", f"{era['shortName']} 또는 우리 모둠 유산을 생각하면 무엇이 떠오르나요?", width, 35 * mm, st), Spacer(1, 4 * mm),
            ruled_box("2. AI를 얼마나 믿나요?", "0(거의 믿지 않음)  1  2  3  4  5(매우 믿음)  - 선택한 까닭도 적어 보세요.", width, 32 * mm, st), Spacer(1, 4 * mm),
            ruled_box("3. 수업 뒤 다시 볼 나의 문장", "AI가 역사 질문에 답하면 나는 ____________________________________________", width, 35 * mm, st),
        ]
    elif "역할" in name:
        rows = [["역할", "이름", "오늘 할 일", "확인"], ["자료", "", "믿을 만한 자료 찾기", "□"], ["기록", "", "출처와 근거 남기기", "□"], ["기기", "", "태블릿·파일 관리", "□"], ["발표", "", "모둠 의견 전달", "□"]]
        flow += [data_table(rows, [width * .16, width * .2, width * .5, width * .14], st), Spacer(1, 5 * mm), ruled_box("우리 모둠의 약속", "말할 때 근거를 붙이고, 모르는 내용은 아는 척하지 않습니다.", width, 40 * mm, st)]
    elif "오류 발견" in name:
        flow += [ruled_box("AI 답변 붙이기·옮겨 쓰기", "의심되는 문장에 밑줄을 그으세요.", width, 55 * mm, st), Spacer(1, 4 * mm), ruled_box("왜 이상하다고 생각했나요?", "시기, 인물, 나라, 출처, 단정적인 표현을 살펴보세요.", width, 38 * mm, st), Spacer(1, 4 * mm), ruled_box("어떻게 확인할까요?", "찾아볼 자료와 확인할 질문을 적으세요.", width, 35 * mm, st)]
    elif "자료 3종" in name:
        rows = [["자료", "누가 만들었나", "만든 시기", "근거·원본", "신뢰도"], ["국가기관 자료", "", "", "", "○ △ ×"], ["블로그·영상", "", "", "", "○ △ ×"], ["AI 답변", "", "", "", "○ △ ×"]]
        flow += [data_table(rows, [width * .18, width * .2, width * .16, width * .3, width * .16], st), Spacer(1, 5 * mm), ruled_box("최종 판단", "가장 믿을 자료와 그 까닭을 근거로 설명하세요.", width, 45 * mm, st)]
    elif "체크리스트" in name and "촬영" not in name:
        rows = [["단계", "확인 질문", "나의 확인"]]
        questions = {"출처": "누가 만든 자료인가?", "시기": "언제 만든 자료인가?", "교차": "다른 자료도 같은 말을 하는가?", "원본": "원래 자료를 직접 확인했는가?", "보류": "확인되지 않으면 아직 모름으로 남겼는가?"}
        rows += [[step, questions[step], "□ 확인  □ 더 확인"] for step in verification]
        flow += [data_table(rows, [width * .16, width * .58, width * .26], st), Spacer(1, 5 * mm), ruled_box("이 정보에 대한 나의 결론", "□ 믿을 수 있음  □ 믿기 어려움  □ 아직 판단할 수 없음", width, 45 * mm, st)]
    elif "조사 카드" in name:
        rows = [["조사 항목", "확인한 내용", "출처"], ["언제 만들어졌나", "", ""], ["누가·왜 만들었나", "", ""], ["왜 중요한 유산인가", "", ""], ["지금 어떤 상태인가", "", ""], ["AI가 틀린 부분", "", ""]]
        flow += [data_table(rows, [width * .22, width * .53, width * .25], st), Spacer(1, 4 * mm), ruled_box("확인하지 못한 점", "삼국시대는 모르는 내용을 '아직 모름'으로 남기고, 조선시대는 드라마·통념과 확인된 사실을 구분하세요.", width, 34 * mm, st)]
    elif "출처 기록" in name:
        rows = [["번호", "기관·책·사이트", "자료 제목", "확인 날짜", "이 자료를 믿은 까닭"]] + [[str(i), "", "", "", ""] for i in range(1, 5)]
        flow += [data_table(rows, [width * .08, width * .2, width * .25, width * .16, width * .31], st)]
    elif "아직 모름" in name:
        flow += [ruled_box("아직 모르는 질문", "확실한 답을 찾지 못한 질문을 적으세요.", width, 35 * mm, st), Spacer(1, 4 * mm), ruled_box("서로 다른 설명", "자료마다 어떻게 다르게 말하는지 적으세요.", width, 42 * mm, st), Spacer(1, 4 * mm), ruled_box("더 필요한 증거", "무엇을 확인하면 판단할 수 있을까요?", width, 35 * mm, st)]
    elif "AR 체험" in name:
        rows = [["관찰 항목", "좋았던 점", "아쉬운 점"], ["카드 인식", "", ""], ["등장 장면", "", ""], ["움직임·미션", "", ""], ["해설·소리", "", ""]]
        flow += [data_table(rows, [width * .2, width * .4, width * .4], st), Spacer(1, 5 * mm), ruled_box("우리 AR에 가져올 한 가지", "그 까닭과 함께 적으세요.", width, 38 * mm, st)]
    elif "AR 기획서" in name:
        rows = [["설계 질문", "우리 모둠의 결정"], ["카드를 비추면 무엇이 나오나요?", ""], ["어떻게 움직이나요?", ""], ["관람객이 무엇을 하나요?", ""], ["어떤 한 문장을 말하나요?", ""], ["실패하면 QR에서 무엇을 보여 주나요?", ""]]
        flow += [data_table(rows, [width * .38, width * .62], st), Spacer(1, 4 * mm), ruled_box("핵심 경험 한 문장", "관람객은 ____________________ 하면서 ____________________ 을/를 이해한다.", width, 35 * mm, st)]
    elif "카드 스케치" in name or "앞면 원화" in name:
        flow += [ruled_box("A6 카드 앞면", "굵은 선, 촘촘한 무늬, 강한 명암, 비대칭 구성을 적용해 그리세요. 가장자리 5mm는 비워 둡니다.", width, 110 * mm if width > 100 * mm else 85 * mm, st)]
    elif "뒷면" in name:
        flow += [ruled_box("검증한 사실 3줄", "1.\n2.\n3.", width, 56 * mm, st), Spacer(1, 3 * mm), ruled_box("AI는 이렇게 틀렸어요", "AI의 문장과 바로잡은 내용을 짧게 씁니다.", width, 38 * mm, st), Spacer(1, 3 * mm), ruled_box("QR 영역", "교사가 제공한 QR을 이곳에 붙입니다.", width, 30 * mm, st)]
    elif "판별 근거" in name:
        rows = [["문항", "나의 판단", "사용한 검증 단계", "근거·출처"]] + [[str(i), "참 / 거짓 / 보류", " / ".join(verification), ""] for i in range(1, 6)]
        flow += [data_table(rows, [width * .09, width * .23, width * .27, width * .41], st), Spacer(1, 4 * mm), ruled_box("가장 헷갈렸던 문항", "처음 생각과 근거를 확인한 뒤의 생각을 비교하세요.", width, 42 * mm, st)]
    elif "30초 해설" in name:
        rows = [["시간", "대본 구성", "내 대본"], ["0-5초", "인사와 유산 이름", ""], ["5-15초", "가장 놀라운 사실", ""], ["15-25초", "AI는 이렇게 말했지만, 사실은...", ""], ["25-30초", "마무리와 질문", ""]]
        flow += [data_table(rows, [width * .13, width * .3, width * .57], st), Spacer(1, 5 * mm), ruled_box("출처 확인", "대본 속 사실마다 조사 카드의 출처 번호를 적으세요.", width, 32 * mm, st)]
    elif "녹음·촬영" in name:
        checks = ["□ 초상권 동의를 확인했다.", "□ 흰 배경과 정면광을 확인했다.", "□ 이름·학교 등 개인정보가 보이지 않는다.", "□ 목소리가 또렷하고 주변 소음이 작다.", "□ 30초 안에 끝난다.", "□ 'AI는 이렇게 말했지만, 사실은...' 문장이 있다.", "□ 파일명을 모둠 규칙에 맞게 저장했다."]
        flow += [para("<br/>".join(checks), st["body"]), Spacer(1, 6 * mm), ruled_box("다시 찍을 부분", "시간, 소리, 화면, 내용 중 고칠 부분을 적으세요.", width, 55 * mm, st)]
    elif "실전 테스트" in name:
        rows = [["조건", "결과", "문제", "고친 방법"], ["밝은 곳 / 30cm", "○ △ ×", "", ""], ["어두운 곳 / 30cm", "○ △ ×", "", ""], ["비스듬한 각도", "○ △ ×", "", ""], ["다른 카드 뒤 재인식", "○ △ ×", "", ""], ["음성·영상 재생", "○ △ ×", "", ""], ["QR 대체 접속", "○ △ ×", "", ""]]
        flow += [data_table(rows, [width * .25, width * .15, width * .3, width * .3], st)]
    elif "예상 질문" in name:
        for i in range(1, 4):
            flow += [ruled_box(f"예상 질문 {i}", "질문:\n답변:\n근거 출처:", width, 42 * mm, st), Spacer(1, 3 * mm)]
    elif "부스 역할" in name:
        rows = [["시간", "해설", "AR 안내", "스탬프·동선", "관람·휴식"], ["1회", "", "", "", ""], ["2회", "", "", "", ""], ["3회", "", "", "", ""], ["4회", "", "", "", ""]]
        flow += [data_table(rows, [width * .12, width * .22, width * .22, width * .24, width * .2], st), Spacer(1, 5 * mm), ruled_box("문제가 생기면", "AR 실패, 관람객 몰림, 질문을 모를 때의 대응을 정하세요.", width, 45 * mm, st)]
    elif "스탬프북" in name:
        rows = [[f"{g['id']}모둠", g["heritage"], "스탬프 □"] for g in era["groups"]]
        flow += [data_table([["부스", "문화유산", "확인"]] + rows, [width * .18, width * .57, width * .25], st), Spacer(1, 4 * mm), ruled_box("가장 인상 깊었던 부스", "까닭과 함께 적어 주세요.", width, 34 * mm, st), Spacer(1, 3 * mm), ruled_box("학생 해설사에게 한마디", "좋았던 점이나 궁금한 점을 적어 주세요.", width, 34 * mm, st)]
    elif "전후 비교" in name:
        flow += [ruled_box("1차시의 나", "처음에는 AI와 역사 정보를 어떻게 생각했나요?", width, 42 * mm, st), Spacer(1, 4 * mm), ruled_box("지금의 나", "지금은 무엇을 먼저 확인하나요?", width, 42 * mm, st), Spacer(1, 4 * mm), ruled_box("나를 바꾼 증거", "가장 기억에 남는 오류 발견·출처 확인 경험을 적으세요.", width, 42 * mm, st)]
    elif "AI 활용 다짐" in name:
        flow += [Spacer(1, 12 * mm), para("AI가 알려 준 내용을 만났을 때,", st["center"]), Spacer(1, 10 * mm), ruled_box("나의 다짐", "나는 먼저 ____________________ 을/를 확인하고, ____________________ 하겠습니다.", width, 60 * mm, st), Spacer(1, 8 * mm), para("서명 ____________________", st["center"])]
    else:
        flow += [ruled_box("활동 기록", "활동 순서와 결과를 자세히 적으세요.", width, 70 * mm, st), Spacer(1, 4 * mm), ruled_box("근거와 출처", "무엇을 보고 그렇게 판단했나요?", width, 45 * mm, st), Spacer(1, 4 * mm), ruled_box("돌아보기", "새롭게 알게 된 점과 다음에 확인할 점을 적으세요.", width, 38 * mm, st)]
    return flow


def teacher_guide(era, lesson, width, st):
    flow = resource_heading("교사지도안", lesson, st)
    standards = "\n".join(f"[{item['code']}] {item['description']}" for item in era["curriculumStandards"])
    flow += [ruled_box("2022 개정 교육과정 · 초등학교 5학년 사회", standards, width, 28 * mm if len(era["curriculumStandards"]) == 1 else 38 * mm, st), Spacer(1, 5 * mm)]
    rows = [["단계", "시간", "교수·학습 활동", "자료"]]
    for activity in lesson["activities"]:
        rows.append([activity["stage"], f"{activity['minutes']}분", f"{activity['title']}\n" + "\n".join(f"• {d}" for d in activity["details"]), "\n".join(activity["materials"])])
    flow += [data_table(rows, [width * .12, width * .1, width * .55, width * .23], st), Spacer(1, 5 * mm)]
    flow += [ruled_box("평가 계획", f"방법: {lesson['assessment']['method']}\n기준: {lesson['assessment']['criterion']}\n증거: {lesson['assessment']['evidence']}", width, 35 * mm, st), PageBreak()]
    flow += resource_heading("수업 전 준비·운영 메모", lesson, st)
    prep_rows = [["구분", "확인 내용"], ["사전 준비", "\n".join(f"□ {x}" for x in lesson["teacherPrep"])], ["놓치기 쉬운 점", "\n".join(f"□ {x}" for x in lesson["cautions"])], ["다음 차시 준비", lesson["nextLessonPrep"]], ["남겨야 할 산출물", " · ".join(lesson["outputs"])]]
    flow += [data_table(prep_rows, [width * .22, width * .78], st), Spacer(1, 5 * mm), ruled_box("수업 후 기록", "잘된 점:\n보완할 점:\n다음 차시에 반영할 점:", width, 58 * mm, st)]
    return flow


def quiz_operation_pages(era, width, st, include_answers):
    all_items = []
    for group in era["groups"]:
        source_title, source_url = SOURCES[group["heritage"]]
        for index, (statement, verdict, reason) in enumerate(QUIZ_BANK[group["heritage"]], start=1):
            all_items.append((group, index, statement, verdict, reason, source_title, source_url))
    flow = []
    chunks = [all_items[i:i + (6 if include_answers else 10)] for i in range(0, len(all_items), 6 if include_answers else 10)]
    for chunk_index, chunk in enumerate(chunks):
        if include_answers:
            rows = [["모둠·번호", "정답", "문항·해설"]]
            for group, idx, statement, verdict, reason, source_title, source_url in chunk:
                explanation = Paragraph(
                    f"{escape(statement)}<br/>해설: {escape(reason)}<br/>"
                    f"출처: {escape(source_title)} · <link href={quoteattr(source_url)} color='#A94B36'><u>원문 링크</u></link>",
                    st["small"],
                )
                rows.append([f"{group['id']}모둠 {idx}", verdict, explanation])
            flow.append(data_table(rows, [width * .16, width * .1, width * .74], st))
        else:
            rows = [["모둠·번호", "문항", "판단", "근거 기록"]]
            for group, idx, statement, verdict, reason, source_title, source_url in chunk:
                rows.append([f"{group['id']}모둠 {idx}", statement, "참 / 거짓 / 보류", ""])
            flow.append(data_table(rows, [width * .13, width * .43, width * .2, width * .24], st))
        if chunk_index < len(chunks) - 1:
            flow.append(PageBreak())
            flow += [para("검증 공방 30문항" + (" 정답·해설" if include_answers else " 운영표"), st["h1"]), Spacer(1, 3 * mm)]
    return flow


def teacher_resource(era, lesson, name, width, st):
    flow = resource_heading(name, lesson, st)
    if "연표" in name:
        events = ([
            ["기원전 1세기 무렵", "고구려·백제·신라가 성장하기 시작"], ["1-6세기", "가야 여러 정치체가 한반도 남부에서 성장"], ["475-538", "백제 웅진 도읍기"], ["562", "대가야가 신라에 병합"], ["676", "신라가 한반도 대부분을 통합"],
        ] if era["id"] == "three-kingdoms" else [
            ["1392", "조선 건국"], ["1443", "훈민정음 창제"], ["1446", "훈민정음 해례본 간행"], ["1592-1598", "임진왜란·정유재란"], ["1794-1796", "수원 화성 축성"], ["1897", "대한제국 선포"],
        ])
        flow += [data_table([["시기", "수업에서 연결할 사건·유산"]] + events, [width * .24, width * .76], st), Spacer(1, 6 * mm), ruled_box("수업 활용", "유산 사진 카드를 알맞은 시기 옆에 놓고, 근거가 되는 자료를 학생에게 묻게 하세요.", width, 45 * mm, st)]
    elif "사진 카드" in name:
        for index, group in enumerate(era["groups"]):
            card = Table([[para(f"{group['id']}모둠 · {group['category']}", st["label"])], [para(group["heritage"], st["h1"])], [para(f"탐구 질문: {group['inquiryQuestion']}", st["body"])], [para(f"사진 관찰 단서: {group['visualCue']}", st["small"])]], colWidths=[width], rowHeights=[10 * mm, 18 * mm, 20 * mm, 24 * mm])
            card.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1.2, HexColor(group["color"])), ("BACKGROUND", (0, 0), (-1, 0), HexColor(group["color"])), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10)]))
            flow += [card, Spacer(1, 4 * mm)]
            if index in (2,) and index < len(era["groups"]) - 1:
                flow += [PageBreak(), para(name, st["h1"]), Spacer(1, 3 * mm)]
    elif "봉투 라벨" in name:
        rows = []
        for group in era["groups"]:
            rows.append([f"{era['shortName']} {group['id']}모둠\n{group['heritage']}\n첫 생각 카드 보관", "학생 이름: ____________________\n1차시 수거 □   10차시 반환 □"])
        flow += [data_table(rows, [width * .5, width * .5], st, header=False)]
    elif "질문 카드" in name:
        rows = [["모둠", "담당 유산", "AI에게 물을 질문", "답변에서 확인할 것"]]
        for group in era["groups"]:
            rows.append([str(group["id"]), group["heritage"], group["inquiryQuestion"], "연도·인물·용도·단정 표현"])
        flow += [data_table(rows, [width * .1, width * .2, width * .42, width * .28], st)]
    elif "AI 답변" in name:
        flow += [ruled_box("질문", "모둠별로 같은 질문을 인쇄해 배부하세요.", width, 25 * mm, st), Spacer(1, 3 * mm), ruled_box("검토한 AI 답변", "학생이 밑줄을 그을 수 있도록 줄 간격을 넉넉하게 편집하세요.", width, 82 * mm, st), Spacer(1, 3 * mm), ruled_box("교사 확인", "의도한 오류·단정 표현:\n정답 근거와 출처:", width, 40 * mm, st)]
    elif "오류 유도" in name:
        checks = ["□ 같은 질문으로 AI 답변을 미리 시험했다.", "□ 실제 오류와 학계 논쟁을 구분했다.", "□ 학생이 찾을 수 있는 근거 자료를 함께 준비했다.", "□ 사실인 문장도 섞어 무조건 의심하는 활동이 되지 않게 했다.", "□ 답변에는 개인정보가 없다.", "□ 정답·해설과 출처를 교사가 재확인했다."]
        flow += [para("<br/><br/>".join(checks), st["body"]), Spacer(1, 8 * mm), ruled_box("이번 수업의 교육용 오류", "어떤 오류를 왜 넣었는지 기록하세요.", width, 58 * mm, st)]
    elif "수업 포스터" in name:
        rows = [[f"{i + 1}. {step}", {"출처": "누가 만든 자료인가?", "시기": "언제 만든 자료인가?", "교차": "다른 자료도 같은 말을 하는가?", "원본": "처음 자료를 직접 보았는가?", "보류": "아직 모르면 그대로 남겼는가?"}[step]] for i, step in enumerate(era["verificationSteps"])]
        flow += [data_table([[era["verificationLabel"], "확인 질문"]] + rows, [width * .28, width * .72], st), Spacer(1, 7 * mm), para("근거 없는 확신보다, 확인한 만큼만 말하는 태도가 더 중요합니다.", st["center"])]
    elif "판단 근거" in name:
        rows = [["상황", "교사 판단 예시"], ["국가기관 설명과 AI가 다름", "원본과 다른 공신력 있는 자료를 교차 확인한다."], ["자료마다 제작 시기가 다름", "최신 수정일과 조사 근거를 비교한다."], ["학계 설명이 둘 이상임", "삼국시대는 보류를 허용하고 각 설의 근거를 남긴다."], ["드라마 장면만 근거로 듦", "조선시대 기록·원문과 구분해 적는다."]]
        flow += [data_table(rows, [width * .34, width * .66], st)]
    elif "자료집 표지" in name:
        for group in era["groups"]:
            flow += [ruled_box(f"{group['id']}모둠 자료집 | {group['heritage']}", f"핵심 질문: {group['inquiryQuestion']}\n추천 출처: 국가유산청·국립박물관·유네스코\n자료 수: ____장  배부일: __________", width, 45 * mm, st), Spacer(1, 4 * mm)]
    elif "목차" in name:
        rows = [["번호", "자료 제목", "기관·저자", "발행·수정일", "수업에서 볼 쪽"]] + [[str(i), "", "", "", ""] for i in range(1, 7)]
        flow += [data_table(rows, [width * .08, width * .3, width * .23, width * .18, width * .21], st), Spacer(1, 5 * mm), ruled_box("자료집 검토", "출처 표시 □  제작 시기 확인 □  중복 내용 교차 확인 □  원본 링크 확인 □", width, 35 * mm, st)]
    elif "공식 자료 모음" in name:
        rows = [["모둠", "문화유산", "공식 원문", "세 번 나누어 읽기"]]
        for group in era["groups"]:
            source_title, source_url = SOURCES[group["heritage"]]
            _, _, reading_path = LESSON_FOUR_NOTES[group["heritage"]]
            source_link = Paragraph(
                f"{escape(source_title)}<br/><link href={quoteattr(source_url)} color='#333333'><u>원문 바로가기</u></link>",
                st["small"],
            )
            rows.append([f"{group['id']}모둠", group["heritage"], source_link, reading_path])
        flow += [
            data_table(rows, [width * .1, width * .2, width * .31, width * .39], st, row_heights=[10 * mm] + [23 * mm] * 6),
            Spacer(1, 5 * mm),
            ruled_box("인쇄 자료집으로 바꿀 때", "각 원문의 핵심 부분을 1~2쪽으로 인쇄하고 기관명·자료 제목·원문 주소·인쇄 날짜를 첫 장에 표시하세요. 모둠별로 같은 원문을 세 가지 읽기 임무로 나누어 사용합니다.", width, 37 * mm, st),
        ]
    elif "조사 항목 안내표" in name:
        rows = [
            ["조사 항목", "학생에게 던질 확인 질문", "완료 기준"],
            ["제작 시기", "언제 만들었으며 그 근거는 무엇인가?", "시대 범위와 출처 번호"],
            ["주체·목적", "누가 무엇을 위해 만들었는가?", "확인된 범위까지만 기록"],
            ["유산의 가치", "이 유산으로 무엇을 알 수 있는가?", "모양 설명이 아닌 역사적 의미"],
            ["현재 상태", "지금 어디에 어떻게 남아 있는가?", "유적·유물·세계유산 범위 구분"],
            ["AI 오류", "AI 문장의 어느 낱말이 과장되었는가?", "근거 있는 새 문장과 출처"],
            ["아직 모름", "자료로 확인되지 않거나 의견이 나뉘는 점은?", "추측 대신 남은 질문 기록"],
            ["출처", "친구가 같은 내용을 다시 찾을 수 있는가?", "기관·제목·주소·확인 날짜"],
        ]
        flow += [
            data_table(rows, [width * .17, width * .48, width * .35], st, row_heights=[10 * mm] + [20 * mm] * 7),
            Spacer(1, 5 * mm),
            ruled_box("빠른 순회 점검", "① 출처 번호가 있는가  ② 자기 말로 바꾸었는가  ③ 확인한 사실과 해석을 구분했는가  ④ 아직 모르는 점을 억지로 채우지 않았는가", width, 34 * mm, st),
        ]
    elif "교사용 예시 답안" in name and era["id"] == "three-kingdoms" and lesson["id"] == 4:
        rows = [["모둠·유산", "확인된 내용 예시", "판단 보류 예시"]]
        for group in era["groups"]:
            confirmed, unknown, _ = LESSON_FOUR_NOTES[group["heritage"]]
            rows.append([f"{group['id']}모둠\n{group['heritage']}", confirmed, unknown])
        flow += [
            data_table(rows, [width * .19, width * .42, width * .39], st, row_heights=[10 * mm] + [23 * mm] * 6),
            Spacer(1, 5 * mm),
            ruled_box("인정할 수 있는 다른 답", "문장이 예시와 달라도 공식 자료의 근거 범위를 지키고 출처를 다시 찾을 수 있으면 인정합니다. ‘아직 모름’은 빈칸이 아니라 근거의 한계를 정확히 적은 답입니다.", width, 36 * mm, st),
        ]
    elif "구현 가능성" in name:
        rows = [["검토 항목", "바로 가능", "수정 후 가능", "이번에는 보류", "피드백"], ["카드 인식", "□", "□", "□", ""], ["3D·영상", "□", "□", "□", ""], ["움직임·미션", "□", "□", "□", ""], ["음성·대본", "□", "□", "□", ""], ["QR 대체", "□", "□", "□", ""]]
        flow += [data_table(rows, [width * .2, width * .13, width * .16, width * .17, width * .34], st)]
    elif "30문항 운영표" in name:
        flow += quiz_operation_pages(era, width, st, include_answers=False)
    elif "정답·해설" in name:
        flow += quiz_operation_pages(era, width, st, include_answers=True)
    elif "검증 배지" in name:
        rows = []
        for group in era["groups"]:
            rows.append([f"검증 완료\n{group['id']}모둠 · {group['heritage']}\n출처·근거 확인 □", f"검증 완료\n이름 ____________________\n도슨트 자격 준비 □"])
        flow += [data_table(rows, [width * .5, width * .5], st, header=False)]
    elif "도슨트 자격증" in name:
        for _ in range(2):
            flow += [ruled_box("인공지능과 역사 문화유산 도슨트 자격증", f"이름 ____________________\n담당 유산 ____________________\n위 학생은 {era['verificationLabel']}에 따라 근거를 확인하고 자신의 말로 설명할 준비를 마쳤습니다.\n\n교사 확인 ____________________", width, 63 * mm, st), Spacer(1, 7 * mm)]
    elif "인식률" in name or "카드 비교" in name:
        rows = [["카드", "진한 선", "고유 무늬", "강한 명암", "비대칭", "다른 카드와 구분"], *[[f"{g['id']} {g['heritage']}", "□", "□", "□", "□", "□"] for g in era["groups"]]]
        flow += [data_table(rows, [width * .28, width * .13, width * .14, width * .14, width * .13, width * .18], st)]
    elif "초상권 동의서" in name:
        flow += [para("학생의 음성·영상은 수업용 AR 콘텐츠와 교실 공개수업에서만 사용합니다. 보호자는 촬영 범위와 공개 범위를 선택할 수 있습니다.", st["body"]), Spacer(1, 5 * mm), data_table([["항목", "선택"], ["음성 녹음", "□ 동의  □ 미동의"], ["교실 내 영상 상영", "□ 동의  □ 미동의"], ["학교 누리집·외부 공개", "□ 동의  □ 미동의"], ["동의하지 않을 때 대체 활동", "□ 대본 작성  □ 음성 없이 카드 제작"]], [width * .55, width * .45], st), Spacer(1, 7 * mm), para("학생 이름 __________  보호자 이름 __________  서명 __________  날짜 __________", st["body"])]
    elif "재녹음" in name:
        rows = [["모둠", "30초", "사실 정확", "AI 오류 문장", "소리", "화면", "재녹음"], *[[str(i), "□", "□", "□", "□", "□", "□"] for i in range(1, 7)]]
        flow += [data_table(rows, [width * .1, width * .11, width * .16, width * .19, width * .12, width * .12, width * .2], st)]
    elif "테스트 종합표" in name:
        rows = [["모둠", "밝은 곳", "어두운 곳", "비스듬히", "재인식", "QR", "최종 조치"], *[[str(i), "○△×", "○△×", "○△×", "○△×", "○△×", ""] for i in range(1, 7)]]
        flow += [data_table(rows, [width * .1, width * .12, width * .12, width * .13, width * .13, width * .1, width * .3], st)]
    elif "배치도" in name:
        rows = [["칠판·전후 비교 게시판", "칠판·전후 비교 게시판"], [f"1모둠 {era['groups'][0]['heritage']}", f"4모둠 {era['groups'][3]['heritage']}"], [f"2모둠 {era['groups'][1]['heritage']}", f"5모둠 {era['groups'][4]['heritage']}"], [f"3모둠 {era['groups'][2]['heritage']}", f"6모둠 {era['groups'][5]['heritage']}"], ["입구·스탬프북", "퇴장·피드백 회수"]]
        flow += [data_table(rows, [width * .5, width * .5], st, header=False), Spacer(1, 5 * mm), ruled_box("교실에 맞춘 최종 동선", "입구, 대기선, 태블릿 충전, QR 대체 안내 위치를 표시하세요.", width, 55 * mm, st)]
    elif "관찰 기록" in name:
        rows = [["학생", "자기 말", "검증 과정", "질문 답변", "협력", "관찰 메모"], *[["", "상·중·하", "상·중·하", "상·중·하", "상·중·하", ""] for _ in range(8)]]
        flow += [data_table(rows, [width * .12, width * .13, width * .16, width * .16, width * .13, width * .3], st)]
    elif "부스 표지" in name:
        for group in era["groups"]:
            flow += [ruled_box(f"{group['id']}모둠 | {group['heritage']}", f"{group['inquiryQuestion']}\n주조색: {group['colorName']}  |  관람 순서: 30초 해설 → AR 체험 → 질문 → 스탬프", width, 42 * mm, st), Spacer(1, 4 * mm)]
    elif "운영 체크" in name:
        checks = ["□ 태블릿 6대 충전·카메라 권한", "□ 카드별 AR 인식과 QR 대체 주소", "□ 학생 도슨트 3분 교대 순서", "□ 스탬프북·스탬프·필기구", "□ 오류 발견 기록지·AR 기획서 전시", "□ 관람객 동선·대기선", "□ 초상권·개인정보 노출 확인", "□ 관람객 피드백 회수·학생 전달"]
        flow += [para("<br/><br/>".join(checks), st["body"]), Spacer(1, 8 * mm), ruled_box("비상 대응", "AR 실패 / 인터넷 불안 / 기기 부족 / 동선 정체 때 담당자와 대응을 적으세요.", width, 58 * mm, st)]
    else:
        flow += [ruled_box("운영 목표", f"{lesson['role']} 역할이 드러나도록 사용합니다.", width, 32 * mm, st), Spacer(1, 4 * mm), ruled_box("교사 기록", "준비 상황, 학생 반응, 수정할 점을 기록하세요.", width, 80 * mm, st)]
    return flow


def build_pdf(era, lesson, audience, destination):
    if audience == "학생용":
        page_size = landscape(A4) if lesson["id"] in (7, 10) else A4
        doc = SimpleDocTemplate(
            str(destination),
            pagesize=page_size,
            leftMargin=12 * mm,
            rightMargin=12 * mm,
            topMargin=10 * mm,
            bottomMargin=7 * mm,
            title=f"{era['shortName']} {lesson['id']}차시 {audience}",
            author="인공지능과 역사",
        )
        st = styles_for(page_size)
        st["small"] = ParagraphStyle("studentSmall", parent=st["small"], fontSize=8.8, leading=12.4)
        st["body"] = ParagraphStyle("studentBody", parent=st["body"], fontSize=9.8, leading=14)
        st["label"] = ParagraphStyle("studentLabel", parent=st["label"], fontSize=9.4, leading=12.5)
        st["tableHeader"] = ParagraphStyle("studentTableHeader", parent=st["tableHeader"], fontSize=8.3, leading=11)
        st["identity"] = ParagraphStyle("studentIdentity", parent=st["identity"], fontSize=9.5, leading=12.5)
        width = page_size[0] - doc.leftMargin - doc.rightMargin
        story = student_lesson_sheet(era, lesson, width, st)
        doc.build(
            story,
            onFirstPage=lambda c, d: document_header(c, d, era, lesson, audience),
            onLaterPages=lambda c, d: document_header(c, d, era, lesson, audience),
        )
        return

    special = lesson["downloads"].get("specialFormat")
    page_size = A4
    margin = 10 * mm if page_size == A6 else 14 * mm
    doc = SimpleDocTemplate(str(destination), pagesize=page_size, leftMargin=margin, rightMargin=margin, topMargin=18 * mm, bottomMargin=14 * mm, title=f"{era['shortName']} {lesson['id']}차시 {audience}", author="인공지능과 역사")
    st = styles_for(page_size)
    width = page_size[0] - doc.leftMargin - doc.rightMargin
    story = cover_story(era, lesson, audience, st, width)
    if audience == "교사용":
        story += teacher_guide(era, lesson, width, st)
        resources = lesson["downloads"]["teacher"]
        renderer = teacher_resource
    else:
        resources = lesson["downloads"]["student"]
        renderer = student_resource
    if resources:
        story.append(PageBreak())
    for index, name in enumerate(resources):
        story += renderer(era, lesson, name, width, st)
        if index < len(resources) - 1:
            story.append(PageBreak())
    doc.build(story, onFirstPage=lambda c, d: document_header(c, d, era, lesson, audience), onLaterPages=lambda c, d: document_header(c, d, era, lesson, audience))


def main():
    register_fonts()
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    if OUTPUT_ROOT.exists():
        shutil.rmtree(OUTPUT_ROOT)
    OUTPUT_ROOT.mkdir(parents=True)
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)
    for era in payload["eras"]:
        public_era = PUBLIC_ROOT / era["id"]
        if public_era.exists():
            shutil.rmtree(public_era)
    manifest = {"eras": {}}
    pdf_count = 0
    for era in payload["eras"]:
        output_era = OUTPUT_ROOT / era["id"]
        public_era = PUBLIC_ROOT / era["id"]
        output_era.mkdir()
        public_era.mkdir()
        lesson_entries = []
        era_files = []
        for lesson in era["lessons"]:
            files = {}
            for audience_key, audience_label in (("student", "학생용"), ("teacher", "교사용")):
                filename = f"lesson-{lesson['id']:02d}-{audience_key}.pdf"
                output_path = output_era / filename
                build_pdf(era, lesson, audience_label, output_path)
                shutil.copy2(output_path, public_era / filename)
                files[audience_key] = {"path": f"/downloads/{era['id']}/{filename}", "size": output_path.stat().st_size}
                era_files.append(output_path)
                pdf_count += 1
            answer_filename = f"lesson-{lesson['id']:02d}-answer.pdf"
            answer_output_path = output_era / answer_filename
            build_answer_pdf(era, lesson, answer_output_path)
            shutil.copy2(answer_output_path, public_era / answer_filename)
            files["answer"] = {"path": f"/downloads/{era['id']}/{answer_filename}", "size": answer_output_path.stat().st_size}
            era_files.append(answer_output_path)
            pdf_count += 1
            lesson_zip_name = f"lesson-{lesson['id']:02d}-all.zip"
            lesson_zip_output = output_era / lesson_zip_name
            with zipfile.ZipFile(lesson_zip_output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
                for audience_key in ("student", "teacher", "answer"):
                    pdf_name = f"lesson-{lesson['id']:02d}-{audience_key}.pdf"
                    archive.write(output_era / pdf_name, arcname=pdf_name)
            shutil.copy2(lesson_zip_output, public_era / lesson_zip_name)
            files["bundle"] = {"path": f"/downloads/{era['id']}/{lesson_zip_name}", "size": lesson_zip_output.stat().st_size}
            lesson_entries.append({"lessonId": lesson["id"], "title": lesson["title"], "files": files})
        era_zip_name = f"{era['id']}-all-materials.zip"
        era_zip_output = output_era / era_zip_name
        with zipfile.ZipFile(era_zip_output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for file_path in era_files:
                archive.write(file_path, arcname=f"{era['shortName']}/{file_path.name}")
        shutil.copy2(era_zip_output, public_era / era_zip_name)
        manifest["eras"][era["id"]] = {"title": era["shortName"], "bundle": {"path": f"/downloads/{era['id']}/{era_zip_name}", "size": era_zip_output.stat().st_size}, "lessons": lesson_entries}
    (PUBLIC_ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUTPUT_ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {pdf_count} PDFs, 20 lesson ZIPs and 2 era ZIPs.")


if __name__ == "__main__":
    main()
