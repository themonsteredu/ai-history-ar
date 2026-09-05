"""Regenerate only Three Kingdoms lessons 4–10; never touch taught 1–3 or Joseon."""
import json
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/downloads/three-kingdoms'
PLANS=json.loads((ROOT/'src/content/three-kingdoms/continuity-guide.json').read_text())
pdfmetrics.registerFont(TTFont('SCore', str(ROOT/'public/fonts/SCDream5.ttf')))
pdfmetrics.registerFont(TTFont('SCoreBold', str(ROOT/'public/fonts/SCDream9.ttf')))
BODY=ParagraphStyle('body',fontName='SCore',fontSize=9,leading=13,wordWrap='CJK',spaceAfter=3)
SMALL=ParagraphStyle('small',parent=BODY,fontSize=8,leading=11)
BOLD=ParagraphStyle('bold',parent=BODY,fontName='SCoreBold')
TITLE=ParagraphStyle('title',parent=BOLD,fontSize=19,leading=25,spaceAfter=8)
WIDTH=A4[0]-28*mm
def p(text,style=BODY):return Paragraph(escape(text).replace('\n','<br/>'),style)
def table(rows,widths=None,heights=None,header=True):
 t=Table([[p(str(cell), BOLD if header and n==0 else BODY) for cell in row] for n,row in enumerate(rows)],colWidths=widths,rowHeights=heights,hAlign='LEFT')
 commands=[('GRID',(0,0),(-1,-1),.4,colors.HexColor('#ADB4AE')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]
 if header:commands.append(('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EDF0ED')))
 t.setStyle(TableStyle(commands));return t
def box(title,text='',height=25):return table([[title],[text or ' ']], [WIDTH], [None,height*mm])
def footer(c,d):
 c.setFont('SCore',7);c.setFillColor(colors.HexColor('#536058'));c.drawString(14*mm,10*mm,'인공지능과 역사 · 삼국시대 모둠 탐구');c.drawRightString(A4[0]-14*mm,10*mm,str(d.page))
def header(plan,audience):return [p(f"삼국시대 {plan['id']}차시",TITLE),p(plan['title'],BOLD),p(f"{audience}  |  5학년 ____반  ____모둠  담당 유산 ____________________",SMALL),Spacer(1,3*mm),table([['학습 목표',plan['objective']]],[WIDTH*.15,WIDTH*.85],header=False),Spacer(1,4*mm)]
def student(plan):
 i=plan['id'];s=header(plan,'학생용 A4 한 장')
 if i==4:
  s += [box('1. 지난 2·3차시에서 의심한 말과 확인한 판단','의심한 말:\n\n확인한 판단 또는 보류한 까닭:',31),Spacer(1,3*mm),box('2. 10차시까지 이어 갈 우리 질문',height=17),Spacer(1,3*mm),p('3. 서로 다른 근거 3개를 골라 핵심 낱말과 출처 번호만 적어요.',BOLD),table([['근거','핵심 낱말','출처·확인 상태'],['1','','자료 ___  □ 확인됨 □ 보류 □ 추가 확인'],['2','','자료 ___  □ 확인됨 □ 보류 □ 추가 확인'],['3','','자료 ___  □ 확인됨 □ 보류 □ 추가 확인']],[WIDTH*.08,WIDTH*.42,WIDTH*.5],[None,25*mm,25*mm,25*mm]),Spacer(1,3*mm),p('한 행은 유산 한 점이 아니라 근거 문장 하나입니다. 긴 원문은 웹앱의 근거 표에 보관합니다.'),p('□ 우리 모둠·유산 확인  □ 작업 파일 보관  □ 다음 시간에 같은 파일 열기')]
 elif i==5:
  s += [p('4차시의 우리 작업 파일을 열고 원본 CSV를 먼저 보관합니다.',BOLD),table([['공통 항목','선택 기준'],['살펴본 항목','시기·발견 / 재료·구조 / 모양·장면 / 사용·생활'],['확인 상태','확인됨 / 판단 보류 / 추가 확인'],['한 건의 기준','서로 다른 근거 문장 하나'],['중복의 기준','같은 내용이 반복되는 행. 출처가 같아도 다른 문장은 남김']],[WIDTH*.23,WIDTH*.77]),Spacer(1,4*mm),p('고친 곳을 짧게 남겨요.',BOLD),table([['근거 번호','고치기 전 → 고친 뒤','이유'],['','','□ 중복 □ 분류 □ 출처 □ 판단'],['','','□ 중복 □ 분류 □ 출처 □ 판단'],['','','□ 중복 □ 분류 □ 출처 □ 판단']],[WIDTH*.15,WIDTH*.48,WIDTH*.37],[None,26*mm,26*mm,26*mm]),Spacer(1,4*mm),box('완료 점검','□ 원본 보관  □ 출처 확인  □ 같은 기준으로 분류\n□ 모르는 사실을 추측해 채우지 않음\n최종 근거 수: ____건   □ 공통 표 점검 완료   □ 작업 파일·CSV 보관',30)]
 elif i==6:
  s += [p('정제한 바로 그 CSV로 CODAP 그래프를 만듭니다.',BOLD),table([['선택','우리 그래프'],['가로축','□ 살펴본 항목  □ 확인상태'],['세로축','근거 문장 수(건)'],['제목',''],['전체 근거 수','____건']],[WIDTH*.25,WIDTH*.75],[None,15*mm,15*mm,22*mm,15*mm]),Spacer(1,4*mm),p('그래프의 개수와 웹앱의 실제 개수를 비교해요.',BOLD),table([['항목 이름','실제 근거 수','그래프와 일치'],['','____건','□'],['','____건','□'],['','____건','□'],['','____건','□']],[WIDTH*.5,WIDTH*.25,WIDTH*.25],[None]+[19*mm]*4),Spacer(1,4*mm),p('□ 제목·축·단위 확인  □ PNG 저장  □ 그래프 가져오기  □ 작업 파일 보관'),p('이 그래프는 우리 조사 범위를 보여 줍니다. 나라의 힘이나 역사적 중요성을 뜻하지 않습니다.')]
 elif i==7:
  s += [box('1. 그래프의 제목과 전체 근거 수','제목:\n\n전체 근거: ____건',28),Spacer(1,4*mm),box('2. 실제 수치를 넣어 관찰점을 말해요','우리 모둠이 모은 근거 ____건 중\n\n“____________________”은 ____건입니다.',35),Spacer(1,4*mm),box('3. 그래프의 한계를 고르고 말해요','□ 우리가 고른 자료만 세어 전체 모습은 알 수 없다.\n□ 개수가 많다고 역사적으로 더 중요한 것은 아니다.\n□ 문장 수만으로 생활이나 교류를 증명할 수 없다.',32),Spacer(1,4*mm),box('4. 짝 모둠과 30초 설명하기','□ 실제 수치를 말함  □ 자료의 한계를 말함\n□ 그래프에서 해당 부분을 가리킴\n다음 시간에는 개수가 아니라 근거 문장의 내용으로 돌아갑니다.',32),Spacer(1,4*mm),p('□ 관찰점과 한계를 웹앱에 남김  □ 작업 파일 보관')]
 elif i==8:
  s += [p('우리 표에서 확인됨으로 표시한 서로 다른 근거 두 개를 고릅니다.',BOLD),table([['선택한 근거','핵심 내용과 출처'],['근거 번호 ____','내용:\n\n출처:'],['근거 번호 ____','내용:\n\n출처:']],[WIDTH*.22,WIDTH*.78],[None,35*mm,35*mm]),Spacer(1,4*mm),box('두 근거를 연결한 과거 설명','두 근거를 함께 보면,\n\n__________________________________했을 가능성이 있습니다.',36),Spacer(1,4*mm),box('그래도 단정할 수 없는 점','이 자료만으로는\n\n__________________________________까지 알 수 없습니다.',32),Spacer(1,4*mm),p('□ 두 근거와 설명이 연결됨  □ 확인된 사실과 유추를 구분함\n□ 같은 원문의 두 문장을 출처 두 곳으로 세지 않음\n□ 작업 파일 보관')]
 elif i==9:
  s += [p('8차시의 그래프·근거·설명을 그대로 전시에 넣습니다.',BOLD),box('사진과 연결할 핵심 근거','근거 번호 ____   사진에서 보여 줄 특징:',24),Spacer(1,4*mm),table([['전시 선택','우리 모둠'],['사진 표현','□ 표시  □ 확대'],['관람객 활동','□ 특징 찾기  □ 근거 고르기']],[WIDTH*.3,WIDTH*.7],[None,19*mm,19*mm]),Spacer(1,4*mm),p('전시를 실제로 열고 확인한 것에 표시해요.',BOLD),table([['점검 항목','확인'],['우리 그래프와 실제 개수가 맞다.','□'],['선택한 핵심 근거와 우리 해설이 보인다.','□'],['확대 또는 표시가 선택한 대로 나타난다.','□'],['관람객이 특징 찾기 또는 근거 고르기를 할 수 있다.','□'],['카메라 AR 또는 카메라 없는 체험을 확인했다.','□'],['다른 기기에서 작업 파일을 불러와 열었다.','□']],[WIDTH*.86,WIDTH*.14]),Spacer(1,4*mm),box('30초 해설 순서','우리 그래프 → 확인한 근거 → 가능한 과거 설명 → 아직 모르는 점\n□ 전시 점검 완료  □ 최종 작업 파일 보관',27)]
 else:
  s += [p('9차시 최종 파일과 지난 2·3차시 검증 활동지를 전시합니다.',BOLD),table([['시간','우리 역할'],['0~5분','파일 열기·전시 준비'],['5~17분','A팀 해설 / B팀 관람: 세 부스, 각 4분'],['17~19분','역할 교대'],['19~31분','B팀 해설 / A팀 관람: 세 부스, 각 4분'],['31~34분','부스 정리'],['34~40분','처음 판단과 현재 설명 비교']],[WIDTH*.22,WIDTH*.78]),Spacer(1,4*mm),table([['방문한 부스','기억에 남은 근거·질문'],['____모둠',''],['____모둠',''],['____모둠','']],[WIDTH*.25,WIDTH*.75],[None,18*mm,18*mm,18*mm]),Spacer(1,4*mm),box('지난 2·3차시와 지금의 나','그때 의심한 말:\n지금 근거로 설명할 수 있는 것:\n□ 출처 확인  □ 그래프 읽기  □ 사실과 유추 구분',32)]
 return s

def teacher(plan):
 s=header(plan,'교사용 운영 안내')+[p('진행 기준: 2·3차시 통합 수업을 이미 마친 학급. 지난 활동지를 이어 사용합니다.',BOLD),Spacer(1,3*mm)]
 for activity in plan['activities']:
  s += [p(f"{activity['stage']} · {activity['minutes']}분 | {activity['title']}",BOLD),p('\n'.join('• '+v for v in activity['details'])),Spacer(1,3*mm)]
 s += [p('오늘 완료 기준',BOLD),p('\n'.join('□ '+v for v in plan['outputs'])),PageBreak(),p(f"{plan['id']}차시 준비와 다음 연결",TITLE),p('수업 전 준비',BOLD),p('\n'.join('□ '+v for v in plan['teacherPrep'])),Spacer(1,4*mm),p('오해하지 않도록 안내할 점',BOLD),p('\n'.join('• '+v for v in plan['cautions'])),Spacer(1,4*mm),p('다음 차시로 넘길 것',BOLD),p(plan['nextLessonPrep']),Spacer(1,4*mm),p('파일 보관 절차',BOLD),p('매 차시 종료 전 작업 파일 보관을 누릅니다. JSON 작업 파일은 근거·그래프·해설을 함께 담는 학생 산출물입니다. CSV는 외부 도구용 표이고 PNG는 그래프 그림입니다. 다른 기기에서는 작업 파일을 불러옵니다. 브라우저의 임시 작업만 믿고 기기를 초기화하지 않습니다.'),Spacer(1,4*mm),p('학생 기기에 수업용 링크 전달',BOLD),p('교사 도구 설정에서 학생 기기용 수업 링크를 만들어 학급에 전달합니다. 설정을 바꾸었다면 새 링크를 전달합니다. 교사용 원본 주소는 학생 링크에서 제외됩니다. 이 링크와 학생의 작업 파일은 서로 다릅니다.'),Spacer(1,4*mm),p('대체 활동',BOLD),p('인터넷이 어려우면 공식 인쇄 자료와 활동지에 근거를 남깁니다. 그래프 도구 연결이 불가능하면 교사가 학생의 같은 CSV로 그래프를 준비하고, 학생이 개수를 확인해 자기 작업에 가져옵니다. AR 카메라가 어려우면 같은 전시의 사진·근거·해설·관람객 활동으로 진행합니다.')]
 return s

def answer(plan):
 return header(plan,'교사용 판단 기준')+[p('모둠마다 근거와 설명이 달라 하나의 문장을 정답으로 강제하지 않습니다.',BOLD),Spacer(1,4*mm),box('앞뒤 차시 연결 기준',plan['nextLessonPrep'],32),Spacer(1,4*mm),table([['확인할 것','판단 기준'],['근거','공식 자료 또는 교사 인쇄 자료의 원문에서 다시 찾을 수 있는가?'],['데이터','한 행은 서로 다른 근거 문장 하나이며, 분류 기준이 같은가?'],['그래프','근거 수(건)를 세었으며 원자료의 실제 개수와 같은가?'],['설명','그래프의 개수와 역사적 사실·유추를 구분하는가?'],['한계','확인할 수 없는 내용은 모른다고 남기는가?'],['산출물','이전 파일을 이어 사용했고 다음 시간에 다시 열 수 있는가?']],[WIDTH*.18,WIDTH*.82]),Spacer(1,4*mm),p('이번 차시 특별 확인',BOLD),p('\n'.join('• '+v for v in plan['cautions'])),Spacer(1,4*mm),p('8차시 예: 금관의 장식과 무덤 출토 기록을 연결해 권위 표현을 설명할 수 있으나, 실제 일상 착용 여부를 단정하지 않습니다. 예시와 다르더라도 선택한 근거와 설명이 연결되는지 판단합니다.')]

def build(path,story,title):
 SimpleDocTemplate(str(path),pagesize=A4,leftMargin=14*mm,rightMargin=14*mm,topMargin=13*mm,bottomMargin=17*mm,title=title,author='MOAKIT').build(story,onFirstPage=footer,onLaterPages=footer)

def main():
 manifest_path=ROOT/'public/downloads/manifest.json'
 manifest=json.loads(manifest_path.read_text())
 for stale in [*OUT.glob('lesson-04-group-*.pdf'), OUT/'lesson-04-teaching.pptx']:
  stale.unlink(missing_ok=True)
 for plan in PLANS:
  id=plan['id'];entry=next(item for item in manifest['eras']['three-kingdoms']['lessons'] if item['lessonId']==id)
  entry['title']=plan['title']
  entry['files']={}
  for kind,render in [('student',student),('teacher',teacher),('answer',answer)]:
   path=OUT/f'lesson-{id:02d}-{kind}.pdf';build(path,render(plan),f"삼국시대 {id}차시 {kind}")
   entry['files'][kind]={'path':f'/downloads/three-kingdoms/{path.name}','size':path.stat().st_size}
  bundle=OUT/f'lesson-{id:02d}-all.zip'
  with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as z:
   for kind in ['student','teacher','answer']:z.write(OUT/f'lesson-{id:02d}-{kind}.pdf',f'lesson-{id:02d}-{kind}.pdf')
  entry['files']['bundle']={'path':f'/downloads/three-kingdoms/{bundle.name}','size':bundle.stat().st_size}
 bundle=OUT/'three-kingdoms-all-materials.zip'
 with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as z:
  for file in sorted(OUT.iterdir()):
   if file.suffix in ['.pdf','.pptx']:z.write(file,f'삼국시대/{file.name}')
 manifest['eras']['three-kingdoms']['bundle']={'path':f'/downloads/three-kingdoms/{bundle.name}','size':bundle.stat().st_size}
 manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('Updated only lessons 4–10: 21 PDFs and 8 ZIPs. Taught lessons and Joseon preserved.')

if __name__=='__main__':main()
