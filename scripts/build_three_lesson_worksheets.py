"""Three A4 student pages + two-page teacher guide for the revised data lessons."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs/history-three-lessons'
OUT.mkdir(parents=True, exist_ok=True)
for n, f in [('Body','SCDream5.ttf'),('Bold','SCDream9.ttf')]:
    pdfmetrics.registerFont(TTFont(n, str(ROOT / 'public/fonts' / f)))

class Pages:
    def __init__(self, name):
        self.path=OUT/name
        self.c=canvas.Canvas(str(self.path),pagesize=A4,invariant=1)
        self.c.setTitle(name.replace('.pdf',''))
        self.c.setAuthor('MOAKIT')
    def text(self,x,y,w,t,size=10.5,bold=False,maxh=None):
        p=Paragraph(escape(t).replace('\n','<br/>'),ParagraphStyle('t',fontName='Bold' if bold else 'Body',fontSize=size,leading=size*1.45,wordWrap='CJK'))
        _,h=p.wrap(w*mm,280*mm)
        if y+h/mm>279 or (maxh and h/mm>maxh):
            raise ValueError(f'Overflow {t[:50]} at {y}, height {h/mm}')
        p.drawOn(self.c,x*mm,A4[1]-y*mm-h)
        return h/mm
    def line(self,x,y,x2,y2):
        self.c.setStrokeColor(colors.HexColor('#666666'));self.c.setLineWidth(.45)
        self.c.line(x*mm,A4[1]-y*mm,x2*mm,A4[1]-y2*mm)
    def header(self,n,title,teacher=False):
        self.text(14,12,182,'AI·문화유산 데이터 탐구  |  '+('교사용 운영 안내' if teacher else f'{n}차시 학생 활동지'),9)
        self.text(14,23,182,title,19,True)
        self.text(14,37,182,'3차시 개정안 · 40분 기준' if teacher else '____학년 ____반   ____모둠   이름 ____________________',10)
        self.line(14,47,196,47)
    def section(self,y,title,instruction=''):
        self.text(14,y,182,title,12,True)
        if instruction:self.text(14,y+8,182,instruction,9.5)
    def box(self,y,h,label=''):
        self.c.setStrokeColor(colors.HexColor('#777777'));self.c.setLineWidth(.5)
        self.c.rect(14*mm,A4[1]-(y+h)*mm,182*mm,h*mm)
        if label:self.text(18,y+3,174,label,10)
    def table(self,y,headers,rows,widths,rh=20,hh=12,size=10):
        for i,row in enumerate([headers]+rows):
            h=hh if i==0 else rh;x=14
            if i==0:
                self.c.setFillColor(colors.HexColor('#EEEEEE'));self.c.rect(14*mm,A4[1]-(y+h)*mm,182*mm,h*mm,fill=1,stroke=0)
            self.c.setFillColor(colors.black)
            for val,w in zip(row,widths):
                self.line(x,y,x,y+h)
                self.text(x+2,y+2,w-4,str(val),9.5 if i==0 else size,i==0,h-3)
                x+=w
            self.line(x,y,x,y+h);self.line(14,y,196,y);self.line(14,y+h,196,y+h);y+=h
        return y
    def foot(self,n,total=3,teacher=False):
        self.line(14,282,196,282)
        self.c.setFont('Body',8)
        self.c.drawString(14*mm,10*mm,'학급 전체 자료로 하나의 그래프를 만듭니다.' if not teacher else 'AI·문화유산 데이터 탐구 · 3차시 개정')
        self.c.drawRightString(196*mm,10*mm,f'{n} / {total}')
        self.c.showPage()
    def save(self,pages):
        self.c.save()
        assert len(PdfReader(self.path).pages)==pages
        print(self.path)

s=Pages('AI_데이터탐구_3차시_학생활동지.pdf')
s.header(1,'AI의 답을 확인하고, 근거 모으기')
s.section(53,'1. 기존 조사 자료에서 질문을 확인해요')
s.box(64,23,'우리 문화유산: ______________________________________________\n조사 질문: __________________________________________________')
s.section(94,'2. 출처를 남기고, 확인한 내용을 짧게 써요','출처번호는 모둠번호-순서로 적어요. 예: 2모둠의 첫 출처는 2-1')
s.box(113,29,'출처번호: ______  기관: _______________________________________\n자료 제목: __________________________________________________\n링크 또는 배부자료 쪽수: ______________________________________')
s.table(147,['근거 문장 · 한 줄에 한 가지 사실','출처번호'],[['',''],['',''],['','']],[153,29],rh=18,hh=11)
s.text(14,215,182,'다른 출처는 뒷면에 이어 써도 돼요. 빈칸을 모두 채울 필요는 없어요.',9)
s.section(229,'3. 친구와 원문을 다시 확인해요')
s.text(14,240,182,'□ 원문과 뜻이 같아요.   □ 출처를 다시 찾을 수 있어요.',10)
s.text(14,251,182,'보류할 내용 또는 고친 내용: __________________________________',10)
s.text(14,267,182,'AI의 답도 확인이 필요해요. 이 활동지는 2차시에 다시 사용합니다.',9)
s.foot(1)

s.header(2,'한 행에 한 사실, 표로 정제하기')
s.section(53,'1. 지난 시간의 근거 문장을 표로 옮겨요')
s.text(14,64,182,'우리 문화유산: ______________________________________________',10)
s.text(14,75,182,'이야기종류: 언제·어디 / 재료·방법 / 생김새 / 쓰임·생활',10)
s.text(14,85,182,'한 행 = 한 가지 사실. 확인되지 않은 내용은 1쪽에 보류해요.',9.5)
s.table(99,['정제한 핵심내용','이야기종류','출처번호'],[['','',''],['','',''],['','',''],['','','']],[112,43,27],rh=19,hh=12)
s.text(14,190,182,'표의 줄 수는 할당량이 아니에요. 원문이 짧아도 괜찮아요.',9)
s.section(204,'2. 같은 기준으로 다듬었는지 확인해요')
s.text(14,216,182,'□ 종류 이름 통일   □ 한 행에 한 사실   □ 같은 사실 중복 확인',10)
s.text(14,227,182,'□ 출처번호 확인   □ 원문의 뜻 유지   □ 빈칸·미확인 내용 점검',10)
s.section(242,'3. 학급 통합용으로 제출해요')
s.text(14,253,182,'우리 모둠의 유효한 문장: ______건 / 보류: ______건',10.5)
s.text(14,266,182,'1~6모둠의 표를 이어 붙입니다. 모둠별 그래프는 만들지 않아요.',9)
s.foot(2)

s.header(3,'우리 반 자료로 그래프 만들고 읽기')
s.section(53,'1. 1~6모둠의 자료를 합쳐, 종류별로 세어요')
s.text(14,64,182,'질문: 우리 반은 어떤 종류의 내용을 많이 조사했을까?',10)
s.table(76,['이야기종류','문장 수(건)'],[['언제·어디',''],['재료·방법',''],['생김새',''],['쓰임·생활',''],['합계','']],[126,56],rh=12,hh=11)
s.text(14,151,182,'□ 네 종류의 합계와 학급 표의 유효한 문장 수가 같아요.',9.5)
s.section(165,'2. CODAP에서 학급 공통 막대그래프를 만들어요')
s.text(14,176,182,'그래프 → 이야기종류를 가로축으로 끌기 → Config → 점을 막대로 변환',9)
s.text(14,186,182,'Measure → 빈도수 / 가로축: 이야기종류 / 세로축: 문장 수(건)',9)
s.text(14,198,182,'제목: ______________________________________________________',10)
s.text(14,211,182,'□ 제목   □ 축 이름·단위   □ 0부터 시작하는 눈금   □ 개수 일치',9.5)
s.section(225,'3. 우리 반 그래프가 보여 주는 만큼만 설명해요')
s.text(14,237,182,'우리 반 자료에서 __________________가 ______건으로 가장 많아요.',10)
s.text(14,249,182,'더 알아보고 싶은 내용: _______________________________________',10)
s.text(14,264,182,'□ 문장 수로 유산의 우열을 판단하지 않았어요.   □ 파일로 저장했어요.',9)
s.foot(3)
s.save(3)

t=Pages('AI_데이터탐구_3차시_교사용안내.pdf')
t.header(1,'세 차시 운영과 평가',True)
t.section(54,'수업 목표와 핵심 결정')
t.text(14,65,182,'AI의 답을 근거로 확인하고, 조사 문장을 같은 기준의 표로 정제한 뒤 학급 전체 자료의 빈도를 막대그래프로 설명한다. 데이터 수집·정제의 기초를 배우며, AI 모델 훈련은 하지 않는다.',10)
t.table(87,['차시 · PPT','40분 수업 흐름','결과물'],[['1 · 1~9쪽','이론 10분 / 기존 조사 정리 25분 / 공유 5분','활동지 1쪽'],['2 · 10~18쪽','이론 10분 / 표 정제 25분 / 제출 5분','활동지 2쪽'],['3 · 19~27쪽','이론 8분 / 통합 확인·그래프 22분 / 해석·저장 10분','활동지 3쪽']],[34,113,35],rh=21,hh=12,size=9.5)
t.text(14,167,182,'PPT 28쪽은 교사용 준비 안내입니다. 이론 슬라이드는 짧게 설명하고 활동 시간을 확보하세요.',9)
t.section(181,'교사의 준비 · 모둠 자료 합치기')
t.text(14,192,182,'① 기존 조사 자료와 활동지 1~3쪽을 준비합니다. 학생 AI·Google 계정은 필수가 아닙니다.\n② 모둠별 정제 표를 수합하고, 3차시 전에 교사가 CODAP 한 표에 옮겨 입력합니다.\n③ 모둠·유산·이야기종류·핵심내용·출처번호의 다섯 열을 유지합니다.\n④ 1~6모둠의 행을 이어 넣고 출처 목록도 보관합니다. 동시 공동 입력 방식이 아닙니다.',9.5)
t.section(236,'평가는 분량보다 근거와 판단을 봅니다')
t.text(14,248,182,'출처를 찾을 수 있는가 / 한 행에 한 사실과 같은 분류 기준을 적용했는가 / 표·그래프 개수가 일치하는가 / 조사 범위를 넘어 단정하지 않는가. 빈칸은 감점이나 추가 조사 할당의 이유가 아닙니다.',9.5)
t.foot(1,2,True)

t.header(2,'CODAP 조작 · 정제 기준 · 출처',True)
t.section(53,'로그인 없는 조작 순서')
t.text(14,64,182,'접속: https://codap.concord.org/app/\n새 문서 → 테이블 → 새 데이터셋 → 속성명 클릭 → 이름 바꾸기\n+ 버튼으로 열을 추가하고, 빈 행에 입력합니다. Tab 키로 다음 칸으로 이동합니다.\n그래프 → 이야기종류 열 이름을 가로축으로 끌기\nConfig → 점을 막대로 변환 / Measure → 빈도수\nFile → 저장 → Local File → 파일명 → 컴퓨터에 저장하기',9.8)
t.text(14,110,182,'Google Drive 탭의 로그인 버튼은 사용하지 않습니다. CODAP은 실시간 공동 편집 도구가 아닙니다. 학생별 조작이 필요하면 같은 .codap 파일을 배부하고 각자 열게 합니다. 학교망 접속 실패 시 종이 집계표·칠판 막대그래프로 수업 목표를 유지합니다.',9)
t.section(139,'정제와 해석에서 꼭 지킬 기준')
t.text(14,150,182,'• 같은 유산의 같은 사실은 한 건으로 묶고 원자료와 출처를 보관합니다.\n• 다른 유산의 비슷한 특징은 별개의 근거입니다.\n• 한 문장에 다른 사실이 둘 있으면 나눕니다. 확인되지 않은 자료는 보류합니다.\n• “재료·만드는 방법”은 이번 표에서 “재료·방법”으로 통일합니다.\n• 실제로 0건인 범주와 아직 모르는 빈칸을 구분합니다.\n• 문장 수는 조사 내용의 구성일 뿐, 국가·유산·모둠의 우열이 아닙니다.',9)
t.section(191,'예시와 공식 도움말')
t.text(14,202,182,'PPT의 18건은 설명용 연습 자료이며 학생의 실제 결과가 아닙니다.\n언제·어디 6건 / 재료·방법 4건 / 생김새 5건 / 쓰임·생활 3건 = 총 18건\n실제 수업에서는 학급 자료로 바꾸세요. 예시와 똑같이 맞출 필요가 없습니다.',9.2)
t.text(14,226,182,'CODAP FAQ: https://codap.concord.org/help/faqs/\n입력 안내: https://codap.concord.org/how-to/input-data-by-hand/\n그래프 안내: https://codap.concord.org/how-to/getting-started-with-graphs/',8.3)
t.text(14,246,182,'역사 근거: 국립중앙박물관(무령왕릉·금관), 국립부여박물관(향로), 국가유산청(첨성대), UNESCO(고구려 고분군·가야 고분군). 상세 링크는 PPT 발표자 노트에 수록했습니다.',8.5)
t.text(14,264,182,'조작 확인: CODAP v3.1.0 (2985), 한국어 / 2026-09-09. 일부 메뉴는 영어입니다.',8.5)
t.foot(2,2,True)
t.save(2)
