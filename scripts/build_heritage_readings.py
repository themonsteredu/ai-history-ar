"""Newspaper-style, one A4 page per artifact; text and photo sources stay linked."""
import json,re,subprocess
from pathlib import Path
import fitz
from unify_worksheet_templates import ROOT,MM,fonts,text,write
DATA=json.loads((ROOT/'src/features/open-class/heritage-reading.json').read_text())
JOSEON={item['id']:item for item in json.loads((ROOT/'src/lib/ar/joseon/photos.json').read_text())}
raw=(ROOT/'src/features/goryeo/photos.ts').read_text()
GORYEO={m.group(1):{'author':m.group(2),'source':m.group(3),'license':m.group(4),'licenseUrl':m.group(5),'path':f'images/goryeo-photos/{m.group(1)}.jpg'} for m in re.finditer(r"(\w+):\{credit:'([^']+)',source:'([^']+)',license:'([^']+)',licenseUrl:'([^']+)'",raw)}
outputs=[]
def box(page,rect,content,size=12,lineheight=1.45):
    return page.insert_textbox(rect,content,fontsize=size,fontname='Regular',lineheight=lineheight,color=(.08,.08,.08))
for era,items in DATA.items():
    pack=fitz.open()
    for item in items:
        doc=fitz.open();page=doc.new_page(width=210*MM,height=297*MM);fonts(page)
        photo=JOSEON[item['id']] if era=='joseon' else GORYEO[item['key']]
        photo_path=ROOT/'public'/photo.get('texture',photo['path'])
        if not photo_path.is_file():raise ValueError('missing photo '+str(photo_path))
        text(page,15,14,'역사 탐구 신문',14,True)
        text(page,146,14,('조선시대' if era=='joseon' else '고려시대')+' · 유물 이야기',9,True)
        page.draw_line((15*MM,18*MM),(195*MM,18*MM),color=(.1,.17,.14),width=1.5)
        text(page,15,29,item['name'],19,True)
        text(page,15,36,'사진을 살펴보고, 글에서 유물의 특징과 쓰임을 찾아보세요.',9.5)
        # The picture is an existing documented photo of the actual artifact or reconstruction.
        imgbox=fitz.Rect(119*MM,41*MM,195*MM,90*MM)
        photo_bytes=subprocess.run(['convert',str(photo_path),'-resize','960x960>','-quality','82','jpeg:-'],check=True,stdout=subprocess.PIPE).stdout
        page.insert_image(imgbox,stream=photo_bytes,keep_proportion=True)
        credit="사진: "+photo['author']+"\n"+photo['license']+" · 크기 조정"
        credit_rect=fitz.Rect(119*MM,91*MM,195*MM,101.5*MM)
        if page.insert_textbox(credit_rect,credit,fontsize=7.2,fontname='Regular',lineheight=1.05)<0:raise ValueError('photo credit overflow: '+item['name'])
        page.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(119*MM,91*MM,195*MM,99*MM),'uri':photo['source']})
        lead=fitz.Rect(15*MM,42*MM,111*MM,99*MM)
        if box(page,lead,item['paragraphs'][0],12,1.48)<0:raise ValueError('lead overflow: '+item['name'])
        page.draw_line((15*MM,102*MM),(195*MM,102*MM),color=(.1,.17,.14),width=.7)
        left=fitz.Rect(15*MM,107*MM,101*MM,264*MM);right=fitz.Rect(109*MM,107*MM,195*MM,264*MM)
        paras=item['paragraphs'][1:]; chosen=None
        # Choose the cleanest paragraph break and ensure both columns fit.
        body='\n\n'.join(paras)
        boundaries=[m.end() for m in re.finditer(r'(?<=[.!?])\s+',body)]
        for size in (13.5,13.25,13,12.75,12.5,12.25,12,11.75,11.5,11.25,11):
            trials=[]
            for split in boundaries:
                probe=fitz.open(); pp=probe.new_page(width=210*MM,height=297*MM);fonts(pp)
                rem1=box(pp,left,body[:split].strip(),size);rem2=box(pp,right,body[split:].strip(),size);probe.close()
                if rem1>=0 and rem2>=0:trials.append((abs(rem1-rem2),split,rem1,rem2))
            if trials:
                _,split,rem1,rem2=min(trials);chosen=(size,split,rem1,rem2);break
        if not chosen:raise ValueError('body overflow: '+item['name'])
        size,split,rem1,rem2=chosen
        assert box(page,left,body[:split].strip(),size)>=0
        assert box(page,right,body[split:].strip(),size)>=0
        page.draw_line((105*MM,107*MM),(105*MM,264*MM),color=(.8,.8,.77),width=.4)
        page.draw_line((15*MM,268*MM),(195*MM,268*MM),color=(.5,.5,.46),width=.5)
        text(page,15,274,'자료 출처',9,True)
        for n,source in enumerate(item['sources'][:2]):
            y=279+n*4.5;text(page,15,y,source['name'],8.4)
            page.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(15*MM,(y-4)*MM,192*MM,(y+1)*MM),'uri':source['url']})
        text(page,15,292,'공공기관 자료를 바탕으로 어린이 눈높이에 맞게 새로 쓴 글입니다.',8)
        out=ROOT/'public/downloads'/era/'open-class/readings'/f"{item['id']}-{item['key']}.pdf"
        write(doc,out);outputs.append(out)
        with fitz.open(out) as reader:pack.insert_pdf(reader)
        doc.close()
        print(era,item['name'],'본문',size,'pt · 단별 여백(mm)',round(rem1/MM,1),round(rem2/MM,1))
    out=ROOT/'public/downloads'/era/'open-class/readings/all-readings.pdf';write(pack,out);pack.close();outputs.append(out)
print('created',len(outputs),'PDFs')
