// Build photo cards and compile MindAR targets in the same order as data.ts.
// Original photo credits and licenses are documented in src/features/goryeo/photos.ts.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';
const root=process.cwd(), dir=path.join(root,'public/images/goryeo-cards');
const names=['buddha','type','tripitaka','vase','incense','lacquer'];
const titles=['관촉사 미륵보살','고려 금속활자','팔만대장경','청자 상감운학문 매병','청자 칠보무늬 향로','나전 경전함'];
const credits=[['G41rn8 / Wikimedia','CC BY-SA 4.0','creativecommons.org/','licenses/by-sa/4.0/'],['국립중앙박물관','공공누리 제1유형'],['Arian Zwegers /','MrPanyGoff / Wikimedia','CC BY 2.0','creativecommons.org/','licenses/by/2.0/'],['국립중앙박물관','공공누리 제1유형'],['국립중앙박물관','공공누리 제1유형'],['국립중앙박물관','공공누리 제1유형']];
const server=createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<script type="module">import {Compiler} from "/node_modules/mind-ar/dist/mindar-image.prod.js"; window.Compiler=Compiler;</script>');return;}const p=path.resolve(root,decodeURIComponent(req.url.slice(1)));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.jpg')?'image/jpeg':'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await mkdir(dir,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
try{
 const page=await browser.newPage();page.on('console',msg=>console.log(msg.text()));await page.goto(origin);await page.waitForFunction(()=>window.Compiler);
 const cards=await page.evaluate(async({names,titles,credits})=>Promise.all(names.map(async(name,index)=>{
  const img=new Image();img.src=`/public/images/goryeo-photos/${name}.jpg`;await img.decode();
  const c=document.createElement('canvas');c.width=1200;c.height=900;const x=c.getContext('2d');
  x.fillStyle='#eee9dd';x.fillRect(0,0,1200,900);x.fillStyle='#f9f7f0';x.fillRect(18,18,1164,864);
  x.fillStyle='#274d42';x.fillRect(18,18,292,864);x.fillStyle='#d0b87f';x.font='22px sans-serif';x.fillText('GORYEO HERITAGE',42,69);x.font='bold 88px Georgia';x.fillText(String(index+1).padStart(2,'0'),42,180);
  x.fillStyle='#f5f1e7';x.font='bold 28px sans-serif';for(const [i,word] of titles[index].split(' ').entries())x.fillText(word,42,270+i*42);
  x.fillStyle='#b9d2c7';x.font='20px sans-serif';x.fillText('실물 사진 AR 카드',42,480);x.fillText('카드 전체를 비춰요',42,514);
  // Fine decorative marks also provide visual features for tracking, especially on plain photo backgrounds.
  x.strokeStyle='#b59b65';x.lineWidth=2;for(let r=0;r<4;r++)for(let k=0;k<6;k++){const cx=58+k*38,cy=600+r*34;x.beginPath();x.arc(cx,cy,10+(index%3),0,Math.PI*2);x.stroke();if((r+k+index)%3===0){x.beginPath();x.moveTo(cx-5,cy);x.lineTo(cx+5,cy);x.moveTo(cx,cy-5);x.lineTo(cx,cy+5);x.stroke();}}
  x.fillStyle='#dcebe2';x.font='15px sans-serif';credits[index].forEach((line,i)=>x.fillText(line,42,750+i*18));x.fillText('사진 크기 조정 · 카드 편집',42,860);
  const box={x:330,y:38,w:830,h:824};x.fillStyle='#e5e1d9';x.fillRect(box.x,box.y,box.w,box.h);const scale=Math.min(box.w/img.width,box.h/img.height);const w=img.width*scale,h=img.height*scale;x.drawImage(img,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);
  return c.toDataURL('image/jpeg',.93).split(',')[1];
 })),{names,titles,credits});
 for(let i=0;i<names.length;i++)await writeFile(path.join(dir,`${names[i]}.jpg`),Buffer.from(cards[i],'base64'));
 const bytes=await page.evaluate(async names=>{const imgs=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=`/public/images/goryeo-cards/${name}.jpg`;})));const compiler=new window.Compiler();let last=-1;await compiler.compileImageTargets(imgs,p=>{const n=Math.floor(p/10);if(n>last){last=n;console.log(`AR target ${n*10}%`);}});return Array.from(compiler.exportData());},names);
 await writeFile(path.join(root,'public/ar/goryeo-targets.mind'),Uint8Array.from(bytes));console.log(`Saved ${names.length} photo targets, ${bytes.length} bytes`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
