"""Two-page open-lesson worksheet. Reuse the fixed school masthead."""
from pathlib import Path
import fitz
from unify_worksheet_templates import header,fonts,text,block,write,MM,ROOT
OUT=ROOT/'public/downloads/joseon/open-class/student-worksheet.pdf'
d=fitz.open();p=d.new_page(width=595.276,height=841.89)
header(p,'조선 전기 과학 기술 탐험 · AI 퀴즈 검증','공개수업','사전에 만든 AR 카드로 과학 기술을 소개하고, AI 문제를 자료로 검증할 수 있어요.')
def lines(page,y,n=2):
 for i in range(n):page.draw_line((15*MM,(y+i*9)*MM),(195*MM,(y+i*9)*MM),color=(.55,.55,.55),width=.4)
text(p,15,96,'5학년 (    )반   (    )모둠    이름: __________________',10)
text(p,15,108,'활동 1  우리 모둠 AR 카드 발표하기',13,True)
for y,s in [(120,'우리 모둠은 (                              )을/를 소개하겠습니다.'),(132,'특징은 (                                                                         )입니다.'),(144,'(                            )에 사용했고, 백성들에게'),(156,'(                                                                         ) 도움을 주었습니다.'),(168,'이 내용은 (                                                             )에서 확인했습니다.')]:text(p,15,y,s,10)
text(p,15,182,'친구들의 발표에서 쓰임과 생활에 준 도움을 핵심어로 적어요.',10,True)
for y in range(188,252,9):p.draw_line((15*MM,y*MM),(195*MM,y*MM),width=.4)
for x in [15,54,195]:p.draw_line((x*MM,188*MM),(x*MM,251*MM),width=.4)
text(p,18,194,'과학 기술',9,True);text(p,57,194,'쓰임 / 백성 생활에 준 도움',9,True)
for i,n in enumerate(['농사직설','측우기','간의','앙부일구','자격루','혼천의']):text(p,18,203+i*9,n,10)
text(p,15,263,'활동 2  AI에게 OX 문제 2개 부탁하기',13,True)
text(p,15,273,'AI에 입력한 질문 (핵심 내용):',10);lines(p,283,1)
text(p,178,293,'1 / 2',8)
p=d.new_page(width=595.276,height=841.89);fonts(p)
text(p,15,18,'활동 2 계속  AI 문제를 교과서·참고 자료로 검증하기',13,True)
for i,top in enumerate([30,128],1):
 text(p,15,top,f'{i}번 AI 문제',11,True);lines(p,top+12,1)
 text(p,15,top+23,'AI 정답: O / X    AI 해설:',10);lines(p,top+34,1)
 text(p,15,top+45,'확인한 자료 이름·쪽수/주소와 확인한 내용:',10);lines(p,top+56,1)
 text(p,15,top+67,'우리 판단: O / X    검증 결과: □ 채택  □ 수정  □ 제외',10)
 text(p,15,top+78,'고친 문장·정답 / 판단한 이유와 최종 해설:',10);lines(p,top+89,1)
text(p,15,232,'활동 3  퀴즈 발표하고 배움 정리하기',13,True)
text(p,15,242,'친구들이 답한 뒤, 자료의 근거를 들어 정답과 해설을 설명해요.',10)
text(p,15,252,'오늘 알게 된 점:',10);lines(p,261,1)
text(p,15,271,'AI가 만든 정보를 그대로 믿지 않고 확인해야 하는 까닭:',10);lines(p,280,1)
text(p,15,289,'□ 쓰임과 도움 설명  □ AI 정답·해설 확인  □ 근거를 들어 발표',9)
text(p,178,296,'2 / 2',8)
write(d,OUT)
check=fitz.open(OUT);assert len(check)==2
for i,page in enumerate(check):page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(f'/tmp/open-worksheet-{i+1}.png')
print(OUT)
