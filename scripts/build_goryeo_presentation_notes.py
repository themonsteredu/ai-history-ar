"""One A4 worksheet for recording each group's AR presentation."""
import fitz
from unify_worksheet_templates import header,text,write,MM,ROOT
OUT=ROOT/'public/downloads/goryeo/open-class/group-presentation-notes.pdf'
d=fitz.open(); p=d.new_page(width=595.276,height=841.89)
header(p,'친구들의 고려 유물 AR 발표 듣기','발표 활동','친구들이 만든 AR 카드를 보고 각 모둠의 유물과 중요한 내용을 정리해요.')
text(p,15,91,'우리 모둠: ________     이름: ____________________',10)
text(p,15,101,'친구들의 설명을 듣고 기억할 내용을 짧게 적어 보세요.',10,True)
for i in range(6):
 y=108+i*29
 p.draw_rect(fitz.Rect(15*MM,y*MM,195*MM,(y+26)*MM),color=(.7,.7,.7),width=.6)
 text(p,18,y+6,f'{i+1}모둠',10,True)
 text(p,46,y+6,'유물 이름: ______________________________',10)
 text(p,18,y+15,'유물의 특징 / 쓰임 / 기억할 내용:',9)
 p.draw_line((18*MM,(y+23)*MM),(191*MM,(y+23)*MM),color=(.65,.65,.65),width=.45)
text(p,15,290,'친구의 발표를 듣고 새롭게 알게 된 점: ___________________________________',9)
write(d,OUT)
with fitz.open(OUT) as check:
 assert len(check)==1
 check[0].get_pixmap(matrix=fitz.Matrix(1.4,1.4)).save('/tmp/goryeo-presentation-notes.png')
print(OUT)
