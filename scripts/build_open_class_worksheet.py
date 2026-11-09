"""Two-page open-lesson worksheet. Reuse the fixed school masthead."""
from pathlib import Path
import fitz
from unify_worksheet_templates import header,fonts,text,block,write,MM,ROOT
OUT=ROOT/'public/downloads/joseon/open-class/student-worksheet.pdf'
d=fitz.open();p=d.new_page(width=595.276,height=841.89)
header(p,'조선 전기 과학 기술 탐험 · AI 퀴즈 검증','','사전에 만든 AR 카드로 과학 기술을 소개하고, AI 문제를 자료로 검증할 수 있어요.')
def lines(page,y,n=2):
 for i in range(n):page.draw_line((15*MM,(y+i*9)*MM),(195*MM,(y+i*9)*MM),color=(.55,.55,.55),width=.4)
text(p,15,96,'5학년 (    )반   (    )모둠    이름: __________________',10)
text(p,15,108,'활동 1  우리 모둠 AR 카드 발표하기',13,True)
for y,s in [(120,'우리 모둠은 (                              )을/를 조사하겠습니다.'),(132,'특징은 (                                                                         )입니다.'),(144,'(                                                                  )에 사용하였습니다.'),(156,'이 내용은 (                                                             )에서 확인했습니다.')]:text(p,15,y,s,10)
text(p,15,174,'친구들의 발표에서 특징과 쓰임을 핵심어로 적어요.',10,True)
for row in range(8):
 y=180+row*10.5;p.draw_line((15*MM,y*MM),(195*MM,y*MM),width=.4)
for x in [15,54,124.5,195]:p.draw_line((x*MM,180*MM),(x*MM,253.5*MM),width=.4)
text(p,18,187,'과학 기술',10,True);text(p,57,187,'특징',10,True);text(p,127.5,187,'쓰임',10,True)
for i,n in enumerate(['농사직설','측우기','간의','앙부일구','자격루','혼천의']):text(p,18,197.5+i*10.5,n,10)
text(p,178,293,'1 / 2',8)
p=d.new_page(width=595.276,height=841.89);fonts(p)
text(p,15,18,'활동 2  AI 문제 2개를 만들고 검증하기',13,True)
text(p,15,28,'AI에게 2문제를 부탁하고, 두 문제를 모두 검증해요.',10)
for i,top in enumerate([42,140],1):
 text(p,15,top,f'{i}번  확인할 문제',11,True);lines(p,top+12,1)
 text(p,15,top+25,'AI가 말한 답:   O  /  X',10)
 text(p,15,top+38,'어디에서 확인했나요? (자료 이름 / 쪽수)',10);lines(p,top+48,1)
 text(p,15,top+60,'자료에서 찾은 내용:',10);lines(p,top+70,1)
 text(p,15,top+82,'우리 판단:  □ 채택   □ 수정',10)
text(p,15,232,'활동 3  퀴즈 발표하고 배움 정리하기',13,True)
text(p,15,242,'자료에서 찾은 내용을 근거로 우리 판단을 발표해요.',10)
text(p,15,252,'오늘 알게 된 점:',10);lines(p,261,1)
text(p,15,271,'AI가 만든 정보를 그대로 믿지 않고 확인해야 하는 까닭:',10);lines(p,280,1)
text(p,15,289,'□ 특징과 쓰임 설명  □ AI 정답·해설 확인  □ 근거를 들어 발표',9)
text(p,178,296,'2 / 2',8)
write(d,OUT)
check=fitz.open(OUT);assert len(check)==2
for i,page in enumerate(check):page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(f'/tmp/open-worksheet-{i+1}.png')
print(OUT)
