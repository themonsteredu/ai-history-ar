from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, A5, A6
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

INK = HexColor("#1D2825")
SOFT = HexColor("#5D6864")
PAPER = HexColor("#FFFDF7")
LINE = HexColor("#D9D2C3")
GREEN = HexColor("#173F38")
GREEN_SOFT = HexColor("#EAF1EE")
RED = HexColor("#A94B36")
GOLD = HexColor("#C49744")


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


def data_table(rows, widths, st, header=True, font_size=8):
    converted = [[cell if isinstance(cell, Paragraph) else para(cell, st["small"]) for cell in row] for row in rows]
    table = Table(converted, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
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
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, height - 13 * mm, width - doc.rightMargin, height - 13 * mm)
    canvas.setFont("SCoreBold", 7.5)
    canvas.setFillColor(GREEN)
    canvas.drawString(doc.leftMargin, height - 9.5 * mm, f"MOA 역사 AR 교실  |  {era['shortName']} {lesson['id']}차시  |  {audience}")
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
            flow += [ruled_box("MOA 문화유산 도슨트 자격증", f"이름 ____________________\n담당 유산 ____________________\n위 학생은 {era['verificationLabel']}에 따라 근거를 확인하고 자신의 말로 설명할 준비를 마쳤습니다.\n\n교사 확인 ____________________", width, 63 * mm, st), Spacer(1, 7 * mm)]
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
    special = lesson["downloads"].get("specialFormat")
    page_size = A6 if audience == "학생용" and special == "A6 카드" else A5 if audience == "학생용" and special == "A5 접지" else A4
    margin = 10 * mm if page_size == A6 else 14 * mm
    doc = SimpleDocTemplate(str(destination), pagesize=page_size, leftMargin=margin, rightMargin=margin, topMargin=18 * mm, bottomMargin=14 * mm, title=f"{era['shortName']} {lesson['id']}차시 {audience}", author="MOA 역사 AR 교실")
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
    if PUBLIC_ROOT.exists():
        shutil.rmtree(PUBLIC_ROOT)
    OUTPUT_ROOT.mkdir(parents=True)
    PUBLIC_ROOT.mkdir(parents=True)
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
            lesson_zip_name = f"lesson-{lesson['id']:02d}-all.zip"
            lesson_zip_output = output_era / lesson_zip_name
            with zipfile.ZipFile(lesson_zip_output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
                for audience_key in ("student", "teacher"):
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
