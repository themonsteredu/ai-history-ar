"""Rebuild downloadable worksheets and bundles with the school's fixed masthead.
Run after legacy generators; marked PDFs are not transformed twice.
"""
from pathlib import Path
import fitz,json,re,zipfile,io
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/downloads';MM=72/25.4
MARK='school-leap-template-v1'
def logo_bytes():
 # Preserve the original logo composition; encode for compact print PDFs.
 im=Image.open(ROOT/'public/images/leap-original-logo.png').convert('RGB');buf=io.BytesIO();im.save(buf,format='JPEG',quality=95,subsampling=0);return buf.getvalue()
def fonts(p):
 for name,file in [('Regular','SCDream5.otf'),('Bold','SCDream7.otf')]:p.insert_font(fontname=name,fontfile=str(ROOT/'public/fonts'/file))
def text(p,x,y,s,size=10,bold=False):p.insert_text((x*MM,y*MM),s,fontsize=size,fontname='Bold' if bold else 'Regular',color=(.08,.08,.08))
def block(p,x,y,w,h,s,size=10,bold=False):
 left=p.insert_textbox(fitz.Rect(x*MM,y*MM,(x+w)*MM,(y+h)*MM),s,fontsize=size,fontname='Bold' if bold else 'Regular',lineheight=1.5)
 if left<0:raise ValueError('Text overflow: '+s)
def header(p,subject,lesson,goal=''):
 fonts(p);text(p,15,15,'2026. AI연구학교',9,True);text(p,149,15,'보성초등학교 (5학년)',9,True)
 p.insert_image(fitz.Rect(56*MM,19*MM,154*MM,38.3*MM),stream=logo_bytes())
 p.draw_line((15*MM,41*MM),(195*MM,41*MM),width=2)
 for y in [45,53,64]:p.draw_line((15*MM,y*MM),(195*MM,y*MM),width=.5)
 for x in [42,161]:p.draw_line((x*MM,45*MM),(x*MM,64*MM),width=.5)
 text(p,21,50.5,'단 원');text(p,45,50.5,'AI와 함께하는 역사 탐구');text(p,164,50.5,lesson,9)
 text(p,21,59.5,'주 제');block(p,45,55,113,8,subject,9);text(p,164,59.5,'이름:',9)
 if goal:text(p,15,72,'◎ 학습목표',10,True);block(p,15,75,180,14,goal,9)
def write(doc,path):
 doc.set_metadata({**doc.metadata,'keywords':MARK});doc.subset_fonts();b=doc.tobytes(garbage=4,deflate=True);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b)
def convert(path):
 source=fitz.open(path)
 if MARK in (source.metadata.get('keywords') or ''):return
 out=fitz.open()
 for i,p in enumerate(source):
  lines=p.get_text().splitlines();subject=lines[1] if len(lines)>1 else path.stem
  m=re.search(r'(\d+(?:·\d+)?차시)',lines[0] if lines else '')
  lesson=m.group(1) if m else '탐구 활동'
  dest=out.new_page(width=595.276,height=841.89)
  if i==0:header(dest,subject,lesson)
  else:fonts(dest)
  start=49 if 'data-inquiry' in str(path) else 46
  dest.show_pdf_page(fitz.Rect(15*MM,(71 if i==0 else 16)*MM,195*MM,281*MM),source,i,clip=fitz.Rect(14*MM,start*MM,196*MM,281*MM),keep_proportion=False)
  text(dest,160,291,f'{lesson} · {i+1}쪽',8)
 write(out,path)
def merge(paths,target):
 d=fitz.open()
 for p in paths:
  with fitz.open(p) as x:d.insert_pdf(x)
 write(d,target)
def course_materials():
 for era,name in [('joseon','조선'),('three-kingdoms','삼국')]:
  data=json.loads((ROOT/'src/content'/era/('six-course.json' if era=='joseon' else 'data-course.json')).read_text())
  folder=OUT/era/('course' if era=='joseon' else 'data-inquiry');students=[];teacher=fitz.open()
  for l in data:
   doc=fitz.open();p=doc.new_page(width=595.276,height=841.89);header(p,l['title'],str(l['id'])+'차시',l['objective'])
   text(p,15,94,'모둠: ________   유산: ________________________',10)
   y=104
   for n,t in enumerate(l['tasks'],1):
    text(p,15,y,f'{n}. {t["title"]}',12,True);block(p,15,y+4,180,16,t['prompt'],10)
    for j in range(3):p.draw_line((15*MM,(y+24+j*9)*MM),(195*MM,(y+24+j*9)*MM),color=(.4,.4,.4),width=.4)
    y+=56
   text(p,145,291,f'{name} 탐구 · {l["id"]}차시',8)
   path=folder/(f'lesson-{l["id"]}-student.pdf' if era=='joseon' else f'student-{l["id"]}.pdf');write(doc,path);students.append(path)
   tp=teacher.new_page(width=595.276,height=841.89)
   if l['id']==1:header(tp,name+' 6차시 수업 운영 안내','교사용');y=76
   else:fonts(tp);y=20
   text(tp,15,y,f'{l["id"]}차시 · {l["title"]}',14,True);block(tp,15,y+7,180,20,l['objective']+'\n'+l['timing'],10)
   y+=33
   for t in l['tasks']:text(tp,15,y,t['title'],11,True);block(tp,15,y+5,180,24,t['prompt'],10);y+=35
   block(tp,15,y+4,180,48,'관찰 기준: 학생이 근거와 출처를 연결해 설명하는지 확인합니다.\n표와 그래프: 확인한 행만 집계하며 파일을 합쳐 학급 자료를 만듭니다.\n기기 이동: 작업 파일을 저장하고 다음 기기에서 불러옵니다.\n자료가 부족한 내용은 억지로 채우지 않고 확인 필요로 남깁니다.',10)
  merge(students,folder/'student-all.pdf');write(teacher,folder/'teacher-guide.pdf')
def update_archives():
 # Replace every worksheet inside existing ZIPs, including nested bundles.
 def rebuild(blob):
  src=zipfile.ZipFile(io.BytesIO(blob));buf=io.BytesIO()
  with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as dst:
   for item in src.infolist():
    b=src.read(item.filename);name=Path(item.filename).name
    matches=list(OUT.rglob(name)) if name.endswith(('.pdf','.pptx')) else []
    # Avoid ambiguous files across eras; use archive entry path or parent ZIP context outside.
    matching=[p for p in matches if str(p.relative_to(OUT)).endswith(item.filename)]
    if len(matching)==1:b=matching[0].read_bytes()
    elif len(matches)==1:b=matches[0].read_bytes()
    if name.endswith('.zip'):b=rebuild(b)
    dst.writestr(item,b)
  return buf.getvalue()
 for era in ['joseon','three-kingdoms']:
  for z in (OUT/era).glob('*.zip'):
   buf=io.BytesIO()
   with zipfile.ZipFile(z) as src,zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as dst:
    for item in src.infolist():
     # The full bundle already contains the individual student sheets.
     if z.name.endswith('-all-materials.zip') and Path(item.filename).name=='student-worksheets-all.pdf':continue
     local=z.parent/Path(item.filename).name
     b=local.read_bytes() if local.is_file() and local!=z else src.read(item.filename)
     dst.writestr(item,b)
   z.write_bytes(buf.getvalue())
 for z in OUT.glob('*.zip'):z.write_bytes(rebuild(z.read_bytes()))
 for era,folder in [('joseon','course'),('three-kingdoms','data-inquiry')]:
  d=OUT/era/folder
  with zipfile.ZipFile(d/(folder+'-all.zip'),'w',zipfile.ZIP_DEFLATED) as z:
   for p in sorted(d.iterdir()):
    if p.suffix in ['.pdf','.pptx']:z.write(p,p.name)
if __name__=='__main__':
 for era in ['joseon','three-kingdoms']:
  for p in sorted((OUT/era).glob('lesson-*.pdf')):convert(p)
  merge(sorted((OUT/era).glob('lesson-*-student.pdf')),OUT/era/'student-worksheets-all.pdf')
 course_materials();update_archives();print('Updated worksheet PDFs and downloadable bundles')
